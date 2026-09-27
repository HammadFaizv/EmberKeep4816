import { Entity } from './Entity.js';

/**
 * Projectile — moves in a straight line and carries a damage packet.
 * Collision and damage are resolved by CombatSystem, not here.
 *
 * `pierce` = how many extra enemies it may pass through after the first hit.
 */
export class Projectile extends Entity {
    constructor({ x, y, vx, vy, radius = 6, team, damage, pierce = 0, lifetime = 2, visual, source = null }) {
        super({ x, y, radius, team, render: visual });
        this.vel.set(vx, vy);
        this.damage = damage;
        this.pierce = pierce;
        this.lifetime = lifetime;
        this.source = source;
        this.hitIds = new Set();
    }

    update(dt, ctx) {
        super.update(dt, ctx);
        this.pos.addScaled(this.vel, dt);
        if (this.age >= this.lifetime) this.alive = false;
    }
}
