import { Events } from '../core/EventBus.js';
import { circlesOverlap } from '../utils/MathUtils.js';
import { Pickup } from '../entities/Pickup.js';
import { Effect } from '../entities/Effect.js';

/**
 * CombatSystem — stage-scoped orchestrator for everything that hurts.
 *
 *  - projectile collisions (player projectiles vs enemies, enemy projectiles vs player)
 *  - applying spell hits (combos, damage, knockback, statuses, lifesteal)
 *  - hazards (spell zones, lava pools, meteor impacts)
 *  - enemy attacks on the player and on structures (barricades, towers)
 *  - deaths and loot drops
 *
 * It *uses* DamageSystem/ElementSystem/StatusEffectSystem/ComboSystem for the
 * rules and announces outcomes on the EventBus; it never grants persistent
 * rewards itself.
 */
const MAX_ENEMY_RADIUS = 50; // broad-phase margin for projectile queries

export class CombatSystem {
    constructor({ stage, bus, rng, damage, statuses, combos = null }) {
        this.stage = stage;
        this.bus = bus;
        this.rng = rng;
        this.damage = damage;
        this.statuses = statuses;
        this.combos = combos;
        statuses.combat = this;
        if (combos) combos.combat = this;
    }

    get player() { return this.stage.player; }

    update(dt) {
        this._updateProjectiles();
        this._updateHazards(dt);
    }

    _updateProjectiles() {
        const { projectiles, targeting } = this.stage;
        for (const p of projectiles) {
            if (!p.alive) continue;
            if (p.team === 'player') {
                for (const enemy of targeting.query(p.pos, p.radius + MAX_ENEMY_RADIUS)) {
                    if (!enemy.targetable || p.hitIds.has(enemy.id) || !circlesOverlap(p, enemy)) continue;
                    p.hitIds.add(enemy.id);
                    this.applySpellHit(p.damage, enemy, p.pos);
                    p.onHit?.(enemy, p, this.stage);
                    if (p.pierce-- <= 0) { p.alive = false; break; }
                }
            } else if (p.team === 'enemy' && circlesOverlap(p, this.player)) {
                p.alive = false;
                this.damagePlayer(p.damage, p.source);
            }
        }
    }

    _updateHazards(dt) {
        for (const h of this.stage.hazards) {
            if (!h.alive || !h.active) continue;
            if (h.impact && !h.impacted) {
                h.impacted = true;
                this._hazardHit(h, h.impact);
            }
            if (!h.tick) continue;
            h.tickTimer -= dt;
            if (h.tickTimer <= 0) {
                h.tickTimer += h.tickInterval;
                this._hazardHit(h, h.tick);
            }
        }
    }

    _hazardHit(hazard, packet) {
        const full = { knockback: 0, statusEffects: hazard.statusEffects, ...packet };
        if (hazard.team === 'player') {
            for (const enemy of this.stage.targeting.inRadius(hazard.pos, hazard.radius)) {
                this.applySpellHit(full, enemy, hazard.pos, { small: true });
            }
        } else if (hazard.pos.distanceTo(this.player.pos) <= hazard.radius + this.player.radius * 0.5) {
            this.damagePlayer(full, hazard.source);
        }
    }

    /**
     * Resolves a player spell (or tower, hazard, combo) hitting an enemy.
     * options.combos=false stops combo effects from chaining into more combos.
     */
    applySpellHit(packet, enemy, sourcePos = this.player.pos, { combos = true, small = false } = {}) {
        if (!enemy.targetable) return null;
        let hit = this._applyStatusBonus(packet, enemy);
        if (combos && this.combos) hit = this.combos.beforeHit(hit, enemy, sourcePos);

        const result = this.damage.resolve(hit, enemy);
        const died = enemy.takeDamage(result.total);
        this.bus.emit(Events.ENEMY_DAMAGED, { enemy, result });
        this._damageNumber(enemy, result, small);

        const lifesteal = this.player.stats.get('lifesteal');
        if (lifesteal > 0 && result.total > 0) this.player.heal(result.total * lifesteal);

        if (hit.knockback && !enemy.isBoss && !enemy.frozen) {
            const push = sourcePos === enemy.pos ? null : enemy.pos.clone().sub(sourcePos).normalize();
            if (push) enemy.pos.addScaled(push, hit.knockback * 0.25);
        }
        if (!died) {
            for (const status of hit.statusEffects ?? []) {
                this.statuses.apply(enemy, { element: hit.element, ...status }, hit.source);
            }
        }
        if (died) this.handleEnemyDeath(enemy);
        return result;
    }

    /** `bonusVsStatus: { freeze: 1 }` = +100% damage against frozen targets (Ice Lance shatter). */
    _applyStatusBonus(packet, enemy) {
        const bonuses = packet.bonusVsStatus;
        if (!bonuses) return packet;
        let mult = 1;
        for (const [status, bonus] of Object.entries(bonuses)) if (this.statuses.has(enemy, status)) mult += bonus;
        return mult === 1 ? packet : { ...packet, base: packet.base * mult, elemental: packet.elemental * mult };
    }

    /** Damage-over-time ticks (burn, poison) — elemental only, no defense. */
    applyDamageOverTime(target, amount, element) {
        if (!target.targetable) return;
        if (target === this.player) {
            this.damagePlayer({ base: 0, element, elemental: amount }, null, { ignoreInvulnerability: true });
            return;
        }
        const result = this.damage.resolve({ base: 0, element, elemental: amount }, target);
        this._damageNumber(target, result, true);
        if (target.takeDamage(result.total)) this.handleEnemyDeath(target);
    }

    /** Any source damaging the player. packet = { base, element?, elemental?, statusEffects? } */
    damagePlayer(packet, source = null, { ignoreInvulnerability = false } = {}) {
        const player = this.player;
        if (!player.alive || (player.invulnerableTime > 0 && !ignoreInvulnerability) || player.invulnerableTime === Infinity) return;
        const result = this.damage.resolve(packet, player);
        const died = ignoreInvulnerability ? this._rawPlayerDamage(result.total) : player.takeDamage(result.total);
        this.bus.emit(Events.PLAYER_DAMAGED, { amount: result.total, source });
        for (const status of packet.statusEffects ?? []) {
            this.statuses.apply(player, { element: packet.element, ...status }, source);
        }
        if (died) {
            player.alive = false;
            this.bus.emit(Events.PLAYER_DIED, { source });
        }
    }

    /** DoT ticks bypass the post-hit invulnerability window (it would swallow them). */
    _rawPlayerDamage(amount) {
        const player = this.player;
        player.hp = Math.max(0, player.hp - amount);
        return player.hp <= 0;
    }

    /** Called by enemy AI when a melee attack connects. */
    enemyMeleeHit(enemy) {
        this.damagePlayer({ base: enemy.damage, statusEffects: enemy.def.onHitStatus }, enemy);
    }

    /** Called by enemy AI when it attacks a structure (barricade, tower). */
    damageStructure(structure, amount, source = null) {
        if (!structure.alive) return;
        const dealt = Math.max(1, Math.round(amount * (100 / (100 + (structure.defense ?? 0)))));
        structure.takeDamage(dealt);
        if (structure.hp <= 0) {
            structure.alive = false;
            this.stage.spawnEffect(new Effect({ kind: 'ring', x: structure.pos.x, y: structure.pos.y, duration: 0.5,
                data: { radius: structure.radius * 2, color: '#c9a45c' } }));
            this.bus.emit(Events.STRUCTURE_DESTROYED, { structure, source });
        }
    }

    handleEnemyDeath(enemy) {
        if (enemy.isBoss) {
            if (enemy.dying) return;
            enemy.dying = true; // FSM DEAD state removes it after its death animation
        } else {
            if (!enemy.alive) return;
            enemy.alive = false;
        }
        this._rollDrops(enemy);
        this.bus.emit(Events.ENEMY_KILLED, { enemy });
        if (enemy.isBoss) {
            this.bus.emit(enemy.isMiniboss ? Events.MINIBOSS_DEFEATED : Events.BOSS_DEFEATED, { boss: enemy });
        }
    }

    _rollDrops(enemy) {
        const { goldChance = 0, gold = [1, 1], rareChance = 0, rareItem, souls } = enemy.drops;
        const { x, y } = enemy.pos;
        const chance = Math.min(1, goldChance + this.player.stats.get('goldDropChance'));
        if (this.rng.chance(chance)) {
            const amount = Math.max(1, Math.round(this.rng.int(gold[0], gold[1]) * this.player.stats.get('goldValue')));
            this.stage.spawnPickup(new Pickup({ kind: 'gold', amount, x, y }));
            this.bus.emit(Events.GOLD_DROPPED, { amount, enemy });
        }
        if (souls && this.rng.chance(souls.chance ?? 1)) {
            this.stage.spawnPickup(new Pickup({ kind: 'soul', amount: this.rng.int(souls.amount[0], souls.amount[1]), x, y }));
        }
        if (rareItem && this.rng.chance(rareChance)) {
            this.stage.addLoot({ type: 'item', id: rareItem, amount: 1 });
        }
    }

    /** Floating combat text (damage numbers, combo names). */
    floatingText(pos, text, color = '#ffffff', size = 14, duration = 0.6) {
        this.stage.spawnEffect(new Effect({
            kind: 'text', x: pos.x + this.rng.range(-8, 8), y: pos.y, duration, data: { text, color, size },
        }));
    }

    _damageNumber(target, result, small = false) {
        if (!this.stage.showDamageNumbers) return;
        const color = result.immune ? '#8a8a8a' : result.weakness ? '#ff5050' : result.resisted ? '#a0a0c0' : '#ffffff';
        this.floatingText({ x: target.pos.x, y: target.pos.y - target.radius },
            result.immune ? 'IMMUNE' : String(result.total), color, small ? 11 : 14);
    }
}
