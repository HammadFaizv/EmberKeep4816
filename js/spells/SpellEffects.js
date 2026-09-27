import { Projectile } from '../entities/Projectile.js';
import { Effect } from '../entities/Effect.js';

/**
 * SpellEffects — cast behaviors, keyed by `def.behavior`.
 *
 * A behavior receives (spell, targets, ctx) and creates projectiles / applies
 * hits through ctx.combat. Behaviors never compute damage themselves — they
 * pass spell.buildDamagePacket() to CombatSystem, which uses DamageSystem and
 * ElementSystem. That keeps elemental logic out of individual spells.
 *
 * Supported now: projectile (single/piercing), chain, nova (AoE around caster),
 * strike (AoE at target). Buffs/debuffs are statusEffects on the definition.
 *
 * TODO: Spell fusion — add a 'fusion' behavior that composes two behaviors
 * (e.g. projectile that triggers a nova on impact). A future SpellFusionSystem
 * would create a Spell whose def.behavior = 'fusion' and def.parts = [...].
 */
export const SPELL_BEHAVIORS = {
    projectile: {
        cast(spell, targets, ctx) {
            const origin = spell.owner.pos;
            const speed = spell.getStat('projectileSpeed');
            const range = spell.getStat('range');
            for (const target of targets) {
                const dir = origin.directionTo(target.pos);
                ctx.spawnProjectile(new Projectile({
                    x: origin.x,
                    y: origin.y,
                    vx: dir.x * speed,
                    vy: dir.y * speed,
                    radius: spell.def.visual?.size ?? 6,
                    team: 'player',
                    damage: spell.buildDamagePacket(),
                    pierce: Math.round(spell.getStat('pierce')),
                    lifetime: (range * 1.4) / speed,
                    visual: spell.def.visual,
                    source: spell,
                }));
            }
        },
    },

    chain: {
        cast(spell, targets, ctx) {
            const jumps = Math.round(spell.getStat('chainCount'));
            const chainRange = spell.getStat('chainRange') || 120;
            for (const first of targets) {
                const hit = new Set();
                let from = spell.owner.pos;
                let current = first;
                for (let i = 0; i <= jumps && current; i++) {
                    hit.add(current.id);
                    ctx.spawnEffect(new Effect({ kind: 'bolt', x: from.x, y: from.y, duration: 0.18,
                        data: { to: current.pos.clone(), color: spell.def.visual?.color } }));
                    from = current.pos.clone();
                    ctx.combat.applySpellHit(spell.buildDamagePacket(), current, from);
                    current = ctx.targeting.nearest(from, chainRange, hit);
                }
            }
        },
    },

    nova: {
        cast(spell, targets, ctx) {
            const center = spell.owner.pos;
            const radius = spell.getStat('areaRadius');
            ctx.spawnEffect(new Effect({ kind: 'ring', x: center.x, y: center.y, duration: 0.35,
                data: { radius, color: spell.def.visual?.color, follow: spell.owner } }));
            for (const enemy of ctx.targeting.inRadius(center, radius)) {
                ctx.combat.applySpellHit(spell.buildDamagePacket(), enemy, center);
            }
        },
    },

    strike: {
        cast(spell, targets, ctx) {
            const radius = spell.getStat('areaRadius');
            for (const target of targets) {
                const center = target.pos.clone();
                ctx.spawnEffect(new Effect({ kind: 'strike', x: center.x, y: center.y, duration: 0.3,
                    data: { radius, color: spell.def.visual?.color } }));
                for (const enemy of ctx.targeting.inRadius(center, radius)) {
                    ctx.combat.applySpellHit(spell.buildDamagePacket(), enemy, center);
                }
            }
        },
    },
};
