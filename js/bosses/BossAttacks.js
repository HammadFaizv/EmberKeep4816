import { Projectile } from '../entities/Projectile.js';
import { Effect } from '../entities/Effect.js';

/**
 * BossAttacks — registry of boss attack *types*.
 *
 * Boss configs describe attacks as data ({ type: 'radialBurst', count: 12, ... });
 * this file turns a type into behavior. New boss mechanics (meteor rain,
 * charge, lasers, arena hazards) are new entries here, reusable by any boss.
 *
 * Each type: { execute(boss, attack, ctx), telegraph?(boss, attack) -> effect data }
 */
const TYPES = new Map();

export const BossAttacks = {
    register(type, definition) { TYPES.set(type, definition); },

    execute(boss, attackId, ctx) {
        const attack = boss.attacks[attackId];
        TYPES.get(attack.type)?.execute(boss, attack, ctx);
    },

    isMelee(boss, attackId) { return boss.attacks[attackId]?.type === 'melee'; },
};

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
            const angle = offset + (i / attack.count) * Math.PI * 2;
            ctx.spawnProjectile(new Projectile({
                x: boss.pos.x,
                y: boss.pos.y,
                vx: Math.cos(angle) * attack.speed,
                vy: Math.sin(angle) * attack.speed,
                radius: 7,
                team: 'enemy',
                damage: { base: attack.damage * boss.damageMult },
                lifetime: 4,
                visual: { shape: 'bone', color: boss.render.accent ?? '#ff4040' },
                source: boss,
            }));
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
