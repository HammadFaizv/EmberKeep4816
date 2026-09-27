import { Projectile } from '../entities/Projectile.js';
import { Effect } from '../entities/Effect.js';
import { Hazard } from '../entities/Hazard.js';
import { clamp } from '../utils/MathUtils.js';

/**
 * BossAttacks — registry of boss attack *types*.
 *
 * Boss configs describe attacks as data ({ type: 'radialBurst', count: 12, ... });
 * this file turns a type into behavior. New boss mechanics are new entries
 * here, reusable by any boss.
 *
 * Each type:
 *   execute(boss, attack, ctx)            runs once when the windup ends
 *   tick?(boss, attack, ctx, dt, t)       optional CHANNEL: runs every update for
 *                                         `attack.channel` seconds after execute
 *                                         (charges, spiral streams)
 */
const TYPES = new Map();

export const BossAttacks = {
    register(type, definition) { TYPES.set(type, definition); },

    execute(boss, attackId, ctx) {
        const attack = boss.attacks[attackId];
        TYPES.get(attack.type)?.execute(boss, attack, ctx);
    },

    /** Channelled attacks keep running after execute (see SpecialAttackState). */
    tick(boss, attackId, ctx, dt, t) {
        const attack = boss.attacks[attackId];
        TYPES.get(attack.type)?.tick?.(boss, attack, ctx, dt, t);
    },

    channelTime(boss, attackId) {
        const attack = boss.attacks[attackId];
        return TYPES.get(attack.type)?.tick ? attack.channel ?? 0 : 0;
    },

    isMelee(boss, attackId) { return boss.attacks[attackId]?.type === 'melee'; },
};

/**
 * Damage packet for a boss attack: elemental attacks (`attack.element`) deal
 * elemental damage, so the doll's `resist.<element>` stats reduce them;
 * everything else is physical and reduced by defense.
 */
const attackPacket = (boss, damage, element) => (element
    ? { base: 0, element, elemental: damage * boss.damageMult }
    : { base: damage * boss.damageMult });

const bossProjectile = (boss, angle, attack, shape = 'bone') => Projectile.create({
    x: boss.pos.x,
    y: boss.pos.y,
    vx: Math.cos(angle) * attack.speed,
    vy: Math.sin(angle) * attack.speed,
    radius: 7,
    team: 'enemy',
    damage: attackPacket(boss, attack.damage, attack.element),
    lifetime: 4,
    visual: { shape: attack.shape ?? shape, color: attack.color ?? boss.render.accent ?? '#ff4040' },
    source: boss,
});

BossAttacks.register('melee', {
    execute(boss, attack, ctx) {
        ctx.spawnEffect(new Effect({ kind: 'ring', x: boss.pos.x, y: boss.pos.y, duration: 0.25,
            data: { radius: boss.radius + attack.reach, color: boss.render.accent ?? '#ff4040', fill: true } }));
        const gap = boss.pos.distanceTo(ctx.player.pos) - boss.radius - ctx.player.radius;
        if (gap <= attack.reach) ctx.combat.damagePlayer({ base: attack.damage * boss.damageMult }, boss);
    },
});

BossAttacks.register('radialBurst', {
    execute(boss, attack, ctx) {
        const offset = (boss.controller.burstCount++ % 2) * (Math.PI / attack.count);
        for (let i = 0; i < attack.count; i++) {
            ctx.spawnProjectile(bossProjectile(boss, offset + (i / attack.count) * Math.PI * 2, attack));
        }
    },
});

BossAttacks.register('summon', {
    execute(boss, attack, ctx) {
        for (let i = 0; i < attack.count; i++) {
            const angle = (i / attack.count) * Math.PI * 2;
            const x = boss.pos.x + Math.cos(angle) * (boss.radius + 40);
            const y = boss.pos.y + Math.sin(angle) * (boss.radius + 40);
            ctx.spawnEffect(new Effect({ kind: 'ring', x, y, duration: 0.5, data: { radius: 22, color: '#b36bff' } }));
            ctx.spawnEnemy(attack.enemyId, { x, y });
        }
    },
});

/**
 * Meteor rain: telegraphed impact circles around the player. Each meteor
 * explodes after `warmup`, then leaves burning ground for `burn` seconds.
 */
BossAttacks.register('meteorRain', {
    execute(boss, attack, ctx) {
        const p = ctx.player.pos;
        for (let i = 0; i < attack.count; i++) {
            const angle = ctx.rng.angle();
            const dist = i === 0 ? 0 : ctx.rng.range(40, attack.spread ?? 260);
            const x = clamp(p.x + Math.cos(angle) * dist, 30, ctx.world.width - 30);
            const y = clamp(p.y + Math.sin(angle) * dist, 30, ctx.world.height - 30);
            ctx.spawnHazard(new Hazard({
                x, y,
                radius: attack.radius,
                warmup: attack.warmup + i * (attack.stagger ?? 0.12),
                duration: attack.burn ?? 2.5,
                team: 'enemy',
                impact: attackPacket(boss, attack.damage, 'fire'),
                tick: { base: 0, element: 'fire', elemental: (attack.burnDamage ?? 4) * boss.damageMult },
                tickInterval: 0.5,
                visual: { kind: 'meteor', color: attack.color ?? '#ff5a1f' },
                source: boss,
            }));
        }
    },
});

/** Charge: dashes toward where the player stood when the windup ended. */
BossAttacks.register('charge', {
    execute(boss, attack, ctx) {
        boss.charge = { dir: boss.pos.directionTo(ctx.player.pos), hit: false };
    },
    tick(boss, attack, ctx) {
        if (!boss.charge) return;
        boss.vel.copy(boss.charge.dir).scale(attack.speed);
        boss.pos.x = clamp(boss.pos.x, boss.radius, ctx.world.width - boss.radius);
        boss.pos.y = clamp(boss.pos.y, boss.radius, ctx.world.height - boss.radius);
        if (!boss.charge.hit && boss.pos.distanceTo(ctx.player.pos) <= boss.radius + ctx.player.radius + 4) {
            boss.charge.hit = true;
            ctx.combat.damagePlayer({ base: attack.damage * boss.damageMult }, boss);
        }
        if (Math.random() < 0.5) {
            ctx.spawnEffect(new Effect({ kind: 'ring', x: boss.pos.x, y: boss.pos.y, duration: 0.3,
                data: { radius: boss.radius * 0.8, color: boss.render.accent } }));
        }
    },
});

/** Spiral: a rotating stream of projectiles for the whole channel. */
BossAttacks.register('spiral', {
    execute(boss) {
        boss.spiral = { angle: 0, timer: 0 };
    },
    tick(boss, attack, ctx, dt) {
        const s = boss.spiral;
        s.angle += (attack.turnRate ?? 3) * dt;
        s.timer -= dt;
        if (s.timer > 0) return;
        s.timer = attack.interval ?? 0.08;
        const arms = attack.arms ?? 3;
        for (let i = 0; i < arms; i++) {
            ctx.spawnProjectile(bossProjectile(boss, s.angle + (i / arms) * Math.PI * 2, attack, 'ember'));
        }
    },
});
