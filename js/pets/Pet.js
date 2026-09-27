import { Entity } from '../entities/Entity.js';

/**
 * Pet — the in-stage companion entity. Currently cosmetic: it orbits the
 * doll. Its gameplay bonus (e.g. +15% fire damage) is a stat effect applied
 * by PetManager when the stage's PlayerStats are built.
 *
 * TODO: Active pet abilities (a Storm Pup that zaps nearby enemies) should be
 * implemented as a pet-owned Spell instance: give the pet def an `ability`
 * spell id, create it with SpellFactory in PetFactory, and call
 * ability.update(dt, ctx) from update() below.
 */
export class Pet extends Entity {
    constructor(def, owner, index = 0) {
        super({ x: owner.pos.x, y: owner.pos.y, radius: 8, team: 'player', render: def.render });
        this.def = def;
        this.owner = owner;
        this.orbitAngle = index * Math.PI;
    }

    update(dt, ctx) {
        super.update(dt, ctx);
        this.orbitAngle += dt * 1.8;
        const tx = this.owner.pos.x + Math.cos(this.orbitAngle) * 34;
        const ty = this.owner.pos.y + Math.sin(this.orbitAngle) * 22 - 10;
        this.pos.x += (tx - this.pos.x) * Math.min(1, dt * 8);
        this.pos.y += (ty - this.pos.y) * Math.min(1, dt * 8);
    }
}
