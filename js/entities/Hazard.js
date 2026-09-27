import { Entity } from './Entity.js';

/**
 * Hazard — a lingering damage area (burning ground, poison clouds, lava pools,
 * meteor impacts). Unlike Effect (purely cosmetic), a Hazard hurts: its damage
 * is resolved by CombatSystem.updateHazards(), keeping all damage rules there.
 *
 *   team        'player' = hurts enemies (spell zones), 'enemy' = hurts the player
 *   warmup      seconds of telegraph before it becomes active (harmless meanwhile)
 *   impact      optional damage packet applied ONCE when it activates
 *   tick        damage packet applied every `tickInterval` while active
 *   statusEffects applied with every tick (burn, poison, chill...)
 *   visual      { kind, color } read by the renderer ('fire', 'poison', 'lava', 'frost', 'storm')
 *   follow      optional entity to stick to (auras)
 *   orbit       optional { owner, distance, speed, angle }: circles the owner (orbiting blades)
 */
export class Hazard extends Entity {
    constructor({
        x, y, radius, duration = 3, warmup = 0, team = 'player',
        impact = null, tick = null, tickInterval = 0.5, statusEffects = [],
        visual = { kind: 'fire' }, source = null, follow = null, orbit = null,
    }) {
        super({ x, y, radius, team, render: visual });
        this.duration = duration;
        this.warmup = warmup;
        this.impact = impact;
        this.tick = tick;
        this.tickInterval = tickInterval;
        this.tickTimer = 0;
        this.statusEffects = statusEffects;
        this.source = source;
        this.follow = follow;
        this.orbit = orbit;       // { owner, distance, speed, angle } — circles an entity
        this.impacted = false;
    }

    get active() { return this.age >= this.warmup; }
    get warmupProgress() { return this.warmup > 0 ? Math.min(1, this.age / this.warmup) : 1; }
    get lifeProgress() { return this.active ? Math.min(1, (this.age - this.warmup) / this.duration) : 0; }

    update(dt, ctx) {
        super.update(dt, ctx);
        if (this.follow) {
            if (!this.follow.alive) this.alive = false;
            else this.pos.copy(this.follow.pos);
        }
        if (this.orbit) {
            const o = this.orbit;
            o.angle += o.speed * dt;
            this.pos.set(o.owner.pos.x + Math.cos(o.angle) * o.distance, o.owner.pos.y + Math.sin(o.angle) * o.distance);
        }
        if (this.age >= this.warmup + this.duration) this.alive = false;
    }
}
