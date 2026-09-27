/**
 * ObjectPool — reuses short-lived objects (projectiles, particles, damage numbers)
 * to reduce garbage-collection spikes.
 *
 * Projectiles use it (Projectile.create / Projectile.release; the Stage
 * releases dead ones during cleanup). Pooled objects must implement
 * reset(...args) to reinitialise their state completely.
 */
export class ObjectPool {
    constructor(factory, initialSize = 0) {
        this.factory = factory;
        this.free = [];
        for (let i = 0; i < initialSize; i++) this.free.push(factory());
    }

    acquire(...args) {
        const obj = this.free.pop() ?? this.factory();
        obj.reset?.(...args);
        return obj;
    }

    release(obj) {
        this.free.push(obj);
    }
}
