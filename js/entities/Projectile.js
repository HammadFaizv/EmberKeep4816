import { Entity, allocateEntityId } from './Entity.js';
import { ObjectPool } from '../utils/ObjectPool.js';

/**
 * Projectile — moves in a straight line and carries a damage packet.
 * Collision and damage are resolved by CombatSystem, not here.
 *
 * `pierce` = how many extra enemies it may pass through after the first hit.
 * `onHit(enemy, projectile, ctx)` optional hook (spell fusion payloads).
 * `onExpire(projectile, ctx)` optional hook when it runs out of lifetime.
 *
 * Projectiles are pooled: create them with Projectile.create({...}); the Stage
 * releases dead ones back to the pool during cleanup. Boss bullet patterns can
 * spawn hundreds per second without garbage-collection spikes.
 */
export class Projectile extends Entity {
    static pool = new ObjectPool(() => new Projectile(), 64);

    static create(options) { return Projectile.pool.acquire(options); }
    static release(projectile) { Projectile.pool.release(projectile); }

    constructor(options) {
        super({ team: 'neutral' });
        this.hitIds = new Set();
        if (options) this.reset(options);
    }

    reset({ x, y, vx, vy, radius = 6, team, damage, pierce = 0, lifetime = 2, visual, source = null, onHit = null, onExpire = null }) {
        this.id = allocateEntityId();
        this.pos.set(x, y);
        this.vel.set(vx, vy);
        this.radius = radius;
        this.team = team;
        this.render = visual;
        this.damage = damage;
        this.pierce = pierce;
        this.lifetime = lifetime;
        this.source = source;
        this.onHit = onHit;
        this.onExpire = onExpire;
        this.alive = true;
        this.age = 0;
        this.hitIds.clear();
        return this;
    }

    update(dt, ctx) {
        super.update(dt, ctx);
        this.pos.addScaled(this.vel, dt);
        if (this.age >= this.lifetime) {
            this.alive = false;
            this.onExpire?.(this, ctx);
        }
    }
}
