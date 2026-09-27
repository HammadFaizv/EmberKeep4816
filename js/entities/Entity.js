import { Vector2 } from '../utils/Vector2.js';

let nextEntityId = 1;

/** Fresh unique id (also used when pooled entities are recycled). */
export function allocateEntityId() { return nextEntityId++; }

/**
 * Entity — anything that exists in a stage: position, collision radius, team,
 * and a render descriptor. Entities hold DATA and simple self-updates only;
 * cross-entity rules (damage, collisions, loot) live in combat/ systems.
 *
 * `render` is a descriptor ({ shape, color, ... }) looked up by the rendering
 * layer. Swapping placeholder shapes for sprites only changes rendering/.
 */
export class Entity {
    constructor({ x = 0, y = 0, radius = 10, team = 'neutral', render = null } = {}) {
        this.id = allocateEntityId();
        this.pos = new Vector2(x, y);
        this.vel = new Vector2();
        this.radius = radius;
        this.team = team;
        this.render = render;
        this.alive = true;
        this.age = 0;
    }

    /** Alive and interactable (bosses play a death state while `dying`). */
    get targetable() { return this.alive; }

    update(dt, ctx) {
        this.age += dt;
    }

    destroy() { this.alive = false; }
}

/**
 * Combatant — an Entity that can take damage and carry status effects.
 * Shared by Player and Enemy so DamageSystem/StatusEffectSystem treat them alike.
 *
 * Subclasses provide: maxHp, defense, resistances, immunities, canBeImmune.
 */
export class Combatant extends Entity {
    constructor(options) {
        super(options);
        this.statuses = [];     // managed by StatusEffectSystem
        this.moveMult = 1;      // recalculated each tick by StatusEffectSystem
        this.stunned = false;
        this.frozen = false;    // set by the 'freeze' status (rendering + AI)
        this.flashTime = 0;     // hit flash for rendering
        this.resistances = {};
        this.immunities = [];
        this.canBeImmune = false;
    }

    get hpRatio() { return this.maxHp > 0 ? this.hp / this.maxHp : 0; }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        this.flashTime = 0.1;
        return this.hp <= 0;
    }

    heal(amount) {
        const before = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - before;
    }

    update(dt, ctx) {
        super.update(dt, ctx);
        if (this.flashTime > 0) this.flashTime -= dt;
    }
}
