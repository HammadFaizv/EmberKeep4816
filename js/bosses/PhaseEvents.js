import { Events } from '../core/EventBus.js';
import { Effect } from '../entities/Effect.js';
import { Projectile } from '../entities/Projectile.js';

/**
 * PhaseEvents — scripted events a boss phase runs when it begins.
 *
 * Phase config:  onEnter: [{ type: 'dialogue', text }, { type: 'summon', enemyId, count }, ...]
 * PhaseTransitionState runs them after the new phase applies.
 *
 *   dialogue     { text }                        boss speaks (BOSS_DIALOGUE event)
 *   summon       { enemyId, count, distance }    adds around the boss
 *   arenaHazard  { hazard: { type, ... } }       starts an ArenaHazards entry
 *   heal         { fraction }                    restores a fraction of max HP
 *   shockwave    { count, damage, speed }        ring of projectiles
 *
 * To add one: PhaseEvents.register('darkness', (event, boss, ctx) => { ... }).
 */
const TYPES = new Map();

export const PhaseEvents = {
    register(type, fn) { TYPES.set(type, fn); },

    run(events = [], boss, ctx) {
        for (const event of events) {
            const fn = TYPES.get(event.type);
            if (fn) fn(event, boss, ctx);
            else console.warn(`PhaseEvents: unknown type "${event.type}"`);
        }
    },
};

PhaseEvents.register('dialogue', (e, boss, ctx) => {
    ctx.bus.emit(Events.BOSS_DIALOGUE, { boss, speaker: e.speaker ?? boss.name, text: e.text });
});

PhaseEvents.register('summon', (e, boss, ctx) => {
    const distance = e.distance ?? boss.radius + 50;
    for (let i = 0; i < e.count; i++) {
        const angle = (i / e.count) * Math.PI * 2;
        const x = boss.pos.x + Math.cos(angle) * distance;
        const y = boss.pos.y + Math.sin(angle) * distance;
        ctx.spawnEffect(new Effect({ kind: 'ring', x, y, duration: 0.5, data: { radius: 24, color: '#b36bff' } }));
        ctx.spawnEnemy(e.enemyId, { x, y });
    }
});

PhaseEvents.register('arenaHazard', (e, boss, ctx) => {
    ctx.arenaHazards?.add(e.hazard);
});

PhaseEvents.register('heal', (e, boss) => {
    boss.heal(boss.maxHp * e.fraction);
});

PhaseEvents.register('shockwave', (e, boss, ctx) => {
    for (let i = 0; i < e.count; i++) {
        const angle = (i / e.count) * Math.PI * 2;
        ctx.spawnProjectile(Projectile.create({
            x: boss.pos.x, y: boss.pos.y,
            vx: Math.cos(angle) * e.speed, vy: Math.sin(angle) * e.speed,
            radius: 8, team: 'enemy', damage: { base: e.damage * boss.damageMult }, lifetime: 4,
            visual: { shape: 'ember', color: boss.render.accent ?? '#ff4040' }, source: boss,
        }));
    }
});
