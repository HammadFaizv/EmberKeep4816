import { Events } from '../core/EventBus.js';
import { circlesOverlap } from '../utils/MathUtils.js';
import { Pickup } from '../entities/Pickup.js';
import { Effect } from '../entities/Effect.js';

/**
 * CombatSystem — stage-scoped orchestrator for everything that hurts.
 *
 *  - projectile collisions (player projectiles vs enemies, enemy projectiles vs player)
 *  - applying spell hits (damage, knockback, statuses, lifesteal)
 *  - enemy attacks on the player
 *  - deaths and loot drops
 *
 * It *uses* DamageSystem/ElementSystem/StatusEffectSystem for the math and
 * announces outcomes on the EventBus; it never grants persistent rewards itself.
 */
export class CombatSystem {
    constructor({ stage, bus, rng, damage, statuses }) {
        this.stage = stage;
        this.bus = bus;
        this.rng = rng;
        this.damage = damage;
        this.statuses = statuses;
        statuses.combat = this;
    }

    get player() { return this.stage.player; }

    update() {
        const { projectiles, enemies } = this.stage;
        for (const p of projectiles) {
            if (!p.alive) continue;
            if (p.team === 'player') {
                for (const enemy of enemies) {
                    if (!enemy.targetable || p.hitIds.has(enemy.id) || !circlesOverlap(p, enemy)) continue;
                    p.hitIds.add(enemy.id);
                    this.applySpellHit(p.damage, enemy, p.pos);
                    if (p.pierce-- <= 0) { p.alive = false; break; }
                }
            } else if (p.team === 'enemy' && circlesOverlap(p, this.player)) {
                p.alive = false;
                this.damagePlayer(p.damage, p.source);
            }
        }
    }

    /** Resolves a player spell hitting an enemy. */
    applySpellHit(packet, enemy, sourcePos = this.player.pos) {
        if (!enemy.targetable) return null;
        const result = this.damage.resolve(packet, enemy);
        const died = enemy.takeDamage(result.total);
        this.bus.emit(Events.ENEMY_DAMAGED, { enemy, result });
        this._damageNumber(enemy, result);

        const lifesteal = this.player.stats.get('lifesteal');
        if (lifesteal > 0 && result.total > 0) this.player.heal(result.total * lifesteal);

        if (packet.knockback && !enemy.isBoss) {
            const push = sourcePos === enemy.pos ? null : enemy.pos.clone().sub(sourcePos).normalize();
            if (push) enemy.pos.addScaled(push, packet.knockback * 0.25);
        }
        for (const status of packet.statusEffects ?? []) {
            this.statuses.apply(enemy, { element: packet.element, ...status }, packet.source);
        }
        if (died) this.handleEnemyDeath(enemy);
        return result;
    }

    /** Damage-over-time ticks (burn, future poison) — elemental only, no defense. */
    applyDamageOverTime(target, amount, element) {
        if (!target.targetable) return;
        if (target === this.player) {
            this.damagePlayer({ base: 0, element, elemental: amount });
            return;
        }
        const result = this.damage.resolve({ base: 0, element, elemental: amount }, target);
        this._damageNumber(target, result, true);
        if (target.takeDamage(result.total)) this.handleEnemyDeath(target);
    }

    /** Any source damaging the player. packet = { base, element?, elemental? } */
    damagePlayer(packet, source = null) {
        const player = this.player;
        if (!player.alive || player.invulnerableTime > 0) return;
        const result = this.damage.resolve(packet, player);
        const died = player.takeDamage(result.total);
        this.bus.emit(Events.PLAYER_DAMAGED, { amount: result.total, source });
        if (died) {
            player.alive = false;
            this.bus.emit(Events.PLAYER_DIED, { source });
        }
    }

    /** Called by enemy AI when a melee attack connects. */
    enemyMeleeHit(enemy) {
        this.damagePlayer({ base: enemy.damage }, enemy);
    }

    handleEnemyDeath(enemy) {
        if (enemy.isBoss) {
            enemy.dying = true; // FSM DEAD state removes it after its death animation
        } else {
            enemy.alive = false;
        }
        this._rollDrops(enemy);
        this.bus.emit(Events.ENEMY_KILLED, { enemy });
        if (enemy.isBoss) {
            this.bus.emit(enemy.isMiniboss ? Events.MINIBOSS_DEFEATED : Events.BOSS_DEFEATED, { boss: enemy });
        }
    }

    _rollDrops(enemy) {
        const { goldChance = 0, gold = [1, 1], rareChance = 0, rareItem } = enemy.drops;
        const chance = Math.min(1, goldChance + this.player.stats.get('goldDropChance'));
        if (this.rng.chance(chance)) {
            const amount = this.rng.int(gold[0], gold[1]);
            this.stage.spawnPickup(new Pickup({ kind: 'gold', amount, x: enemy.pos.x, y: enemy.pos.y }));
            this.bus.emit(Events.GOLD_DROPPED, { amount, enemy });
        }
        if (rareItem && this.rng.chance(rareChance)) {
            this.stage.addLoot({ type: 'item', id: rareItem, amount: 1 });
        }
    }

    _damageNumber(target, result, small = false) {
        if (!this.stage.showDamageNumbers) return;
        const color = result.immune ? '#8a8a8a' : result.weakness ? '#ff5050' : result.resisted ? '#a0a0c0' : '#ffffff';
        this.stage.spawnEffect(new Effect({
            kind: 'text',
            x: target.pos.x + this.rng.range(-8, 8),
            y: target.pos.y - target.radius,
            duration: 0.6,
            data: { text: result.immune ? 'IMMUNE' : String(result.total), color, size: small ? 11 : 14 },
        }));
    }
}
