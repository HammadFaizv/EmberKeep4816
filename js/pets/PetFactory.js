import { Pet } from './Pet.js';
import { PETS } from '../config/petConfig.js';

/** PetFactory — builds in-stage Pet entities (and their ability spells) from pet definitions. */
export class PetFactory {
    constructor({ definitions = PETS } = {}) {
        this.definitions = definitions;
        this.classes = new Map(); // petId -> custom Pet subclass
    }

    registerClass(petId, cls) { this.classes.set(petId, cls); }

    create(petId, owner, index, spellFactory = null) {
        const def = this.definitions[petId];
        const Cls = this.classes.get(petId) ?? Pet;
        const pet = new Cls(def, owner, index);
        if (def.ability && spellFactory) pet.ability = spellFactory.create(def.ability, { owner: pet });
        return pet;
    }
}
