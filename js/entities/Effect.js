import { Entity } from './Entity.js';

/**
 * Effect — a purely visual, timed entity (explosions, lightning arcs, damage
 * numbers, telegraphs). Effects never affect gameplay.
 *
 * `kind` selects the painter in rendering/EffectsRenderer.js.
 *
 * Lingering damage areas (burning ground, poison clouds) are Hazard entities
 * (entities/Hazard.js) whose damage CombatSystem resolves, keeping Effect
 * strictly cosmetic.
 */
export class Effect extends Entity {
    constructor({ kind, x, y, duration = 0.4, data = {} }) {
        super({ x, y, radius: 0, team: 'neutral' });
        this.kind = kind;
        this.duration = duration;
        this.data = data;
    }

    get progress() { return Math.min(1, this.age / this.duration); }

    update(dt, ctx) {
        super.update(dt, ctx);
        if (this.age >= this.duration) this.alive = false;
    }
}
