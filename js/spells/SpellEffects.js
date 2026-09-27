import { Projectile } from '../entities/Projectile.js';
import { Effect } from '../entities/Effect.js';
import { Hazard } from '../entities/Hazard.js';

/**
 * SpellEffects — cast behaviors, keyed by `def.behavior`.
 *
 * A behavior receives (spell, targets, ctx, hooks) and creates projectiles /
 * hazards / applies hits through ctx.combat. Behaviors never compute damage
 * themselves — they pass spell.buildDamagePacket() to CombatSystem, which uses
 * DamageSystem and ElementSystem. That keeps elemental logic out of spells.
 *
 *   projectile  single/piercing bolts
 *   chain       lightning that jumps between enemies
 *   nova        area burst around the caster
 *   strike      area burst at the target
 *   zone        lingering Hazard at the target (clouds, meteors with a warmup)
 *   orbit       Hazards that circle the caster for a while (blades)
 *   fusion      a CARRIER behavior whose every hit triggers a PAYLOAD
 *               (projectile -> nova on impact, strike -> frost field...)
 *
 * `hooks.onHit(enemy, pos)` lets a carrier report its hits; fusion uses it.
 * Payloads live in FUSION_PAYLOADS and reuse the same helpers.
 */

/** Hits every enemy inside `radius` of `center` with the spell's packet. */
export function areaHit(spell, center, radius, ctx, { packet = spell.buildDamagePacket(), onHit } = {}) {
    for (const enemy of ctx.targeting.inRadius(center, radius)) {
        ctx.combat.applySpellHit(packet, enemy, center);
        onHit?.(enemy, enemy.pos);
    }
}

/** Lightning that jumps from `first` through up to `jumps` nearby enemies. */
export function chainFrom(spell, first, fromPos, jumps, chainRange, ctx, { packet = spell.buildDamagePacket(), hit = new Set(), onHit } = {}) {
    let from = fromPos;
    let current = first;
    for (let i = 0; i <= jumps && current; i++) {
        hit.add(current.id);
        ctx.spawnEffect(new Effect({ kind: 'bolt', x: from.x, y: from.y, duration: 0.18,
            data: { to: current.pos.clone(), color: spell.def.visual?.color } }));
        from = current.pos.clone();
        ctx.combat.applySpellHit(packet, current, from);
        onHit?.(current, from);
        current = ctx.targeting.nearest(from, chainRange, hit);
    }
}

/** Spawns a player-team Hazard built from a `zone` block and the spell's packet. */
export function spawnZone(spell, pos, zone, ctx) {
    const packet = spell.buildDamagePacket();
    const tickFraction = zone.tickFraction ?? 0.25;
    ctx.spawnHazard(new Hazard({
        x: pos.x,
        y: pos.y,
        radius: zone.radius,
        duration: zone.duration ?? 3,
        warmup: zone.warmup ?? 0,
        team: 'player',
        impact: zone.impact ? { ...packet, statusEffects: packet.statusEffects } : null,
        tick: zone.tick === false ? null : { ...packet, base: packet.base * tickFraction, elemental: packet.elemental * tickFraction },
        tickInterval: zone.tickInterval ?? 0.5,
        statusEffects: zone.statusEffects ?? packet.statusEffects,
        visual: { kind: zone.visual ?? 'fire', color: spell.def.visual?.color },
        source: spell,
    }));
}

export const SPELL_BEHAVIORS = {
    projectile: {
        cast(spell, targets, ctx, hooks = {}) {
            const origin = spell.owner.pos;
            const speed = spell.getStat('projectileSpeed');
            const range = spell.getStat('range');
            for (const target of targets) {
                const dir = origin.directionTo(target.pos);
                ctx.spawnProjectile(Projectile.create({
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
                    onHit: hooks.onHit ? (enemy, p) => hooks.onHit(enemy, p.pos.clone()) : null,
                }));
            }
        },
    },

    chain: {
        cast(spell, targets, ctx, hooks = {}) {
            const jumps = Math.round(spell.getStat('chainCount'));
            const chainRange = spell.getStat('chainRange') || 120;
            for (const first of targets) chainFrom(spell, first, spell.owner.pos, jumps, chainRange, ctx, { onHit: hooks.onHit });
        },
    },

    nova: {
        cast(spell, targets, ctx, hooks = {}) {
            const center = spell.owner.pos;
            const radius = spell.getStat('areaRadius');
            ctx.spawnEffect(new Effect({ kind: spell.def.visual?.effect ?? 'ring', x: center.x, y: center.y, duration: 0.35,
                data: { radius, color: spell.def.visual?.color, follow: spell.owner } }));
            areaHit(spell, center, radius, ctx, { onHit: hooks.onHit });
        },
    },

    strike: {
        cast(spell, targets, ctx, hooks = {}) {
            const radius = spell.getStat('areaRadius');
            for (const target of targets) {
                const center = target.pos.clone();
                ctx.spawnEffect(new Effect({ kind: 'strike', x: center.x, y: center.y, duration: 0.3,
                    data: { radius, color: spell.def.visual?.color } }));
                areaHit(spell, center, radius, ctx);
                hooks.onHit?.(target, center);
            }
        },
    },

    zone: {
        cast(spell, targets, ctx) {
            const zone = { ...spell.def.zone, radius: spell.getStat('areaRadius'), duration: spell.getStat('zoneDuration') || spell.def.zone.duration };
            for (const target of targets) spawnZone(spell, target.pos.clone(), zone, ctx);
        },
    },

    orbit: {
        cast(spell, targets, ctx) {
            const count = Math.max(1, Math.round(spell.getStat('targetCount')));
            const packet = spell.buildDamagePacket();
            const o = spell.def.orbit;
            for (let i = 0; i < count; i++) {
                ctx.spawnHazard(new Hazard({
                    x: spell.owner.pos.x,
                    y: spell.owner.pos.y,
                    radius: spell.def.visual?.size ?? 12,
                    duration: spell.getStat('zoneDuration') || o.duration,
                    team: 'player',
                    tick: packet,
                    tickInterval: o.tickInterval ?? 0.35,
                    statusEffects: packet.statusEffects,
                    visual: { kind: 'blade', color: spell.def.visual?.color },
                    source: spell,
                    orbit: { owner: spell.owner, distance: spell.getStat('areaRadius'), speed: o.speed ?? 3, angle: (i / count) * Math.PI * 2 },
                }));
            }
        },
    },

    fusion: {
        cast(spell, targets, ctx) {
            const { carrier, payload } = spell.def.fusion;
            const trigger = FUSION_PAYLOADS[payload.type];
            SPELL_BEHAVIORS[carrier].cast(spell, targets, ctx, {
                onHit: (enemy, pos) => trigger(spell, enemy, pos, payload, ctx),
            });
        },
    },
};

/**
 * Fusion payloads: what happens at every carrier hit. `damageMult` scales the
 * spell's own packet so a fused spell never double-dips at full damage.
 */
const scaled = (spell, mult = 0.6) => {
    const p = spell.buildDamagePacket();
    return { ...p, base: p.base * mult, elemental: p.elemental * mult, knockback: 0 };
};

export const FUSION_PAYLOADS = {
    nova(spell, enemy, pos, payload, ctx) {
        ctx.spawnEffect(new Effect({ kind: 'ring', x: pos.x, y: pos.y, duration: 0.3,
            data: { radius: payload.radius, color: payload.color ?? spell.def.visual?.color, fill: true } }));
        const packet = { ...scaled(spell, payload.damageMult), statusEffects: payload.statusEffects ?? spell.def.statusEffects };
        for (const other of ctx.targeting.inRadius(pos, payload.radius)) {
            if (other !== enemy) ctx.combat.applySpellHit(packet, other, pos);
        }
    },

    chain(spell, enemy, pos, payload, ctx) {
        const next = ctx.targeting.nearest(enemy.pos, payload.chainRange ?? 130, new Set([enemy.id]));
        if (next) chainFrom(spell, next, enemy.pos.clone(), payload.jumps ?? 2, payload.chainRange ?? 130, ctx,
            { packet: scaled(spell, payload.damageMult), hit: new Set([enemy.id]) });
    },

    zone(spell, enemy, pos, payload, ctx) {
        spawnZone(spell, pos, payload, ctx);
    },
};
