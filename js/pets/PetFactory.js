import { Pet } from './Pet.js';
import { PETS } from '../config/petConfig.js';

/** PetFactory — builds in-stage Pet entities from pet definitions. */
export class PetFactory {
    constructor({ definitions = PETS } = {}) {
        this.definitions = definitions;
        this.classes = new Map(); // petId -> custom Pet subclass
    }

    registerClass(petId, cls) { this.classes.set(petId, cls); }

    create(petId, owner, index) {
        const def = this.definitions[petId];
        const Cls = this.classes.get(petId) ?? Pet;
        return new Cls(def, owner, index);
    }
}
