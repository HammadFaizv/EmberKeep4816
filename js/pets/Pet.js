import { Entity } from '../entities/Entity.js';

/**
 * Pet — the in-stage companion entity. It orbits the doll and, if its
 * definition names an `ability` (a hidden spell id), casts that spell on its
 * own cooldown. Its passive bonus (e.g. +15% fire damage) is a stat effect
 * applied by PetManager when the stage's PlayerStats are built.
 *
 * The pet borrows the doll's PlayerStats (`stats`), so damage upgrades and
 * elemental bonuses also strengthen pet abilities.
 */
export class Pet extends Entity {
    constructor(def, owner, index = 0) {
        super({ x: owner.pos.x, y: owner.pos.y, radius: 8, team: 'player', render: def.render });
        this.def = def;
        this.owner = owner;
        this.stats = owner.stats;
        this.ability = null;       // Spell, created by PetFactory
        this.orbitAngle = index * Math.PI;
        this.facing = 1;
    }

    update(dt, ctx) {
        super.update(dt, ctx);
        this.orbitAngle += dt * 1.8;
        const tx = this.owner.pos.x + Math.cos(this.orbitAngle) * 34;
        const ty = this.owner.pos.y + Math.sin(this.orbitAngle) * 22 - 10;
        const dx = (tx - this.pos.x) * Math.min(1, dt * 8);
        this.pos.x += dx;
        this.pos.y += (ty - this.pos.y) * Math.min(1, dt * 8);
        if (Math.abs(dx) > 0.05) this.facing = Math.sign(dx);
        this.ability?.update(dt, ctx);
    }
}
