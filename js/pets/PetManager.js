import { PETS } from '../config/petConfig.js';
import { EffectRegistry } from '../progression/EffectRegistry.js';

/**
 * PetManager — persistent pet ownership and equipment.
 *
 * Owned pets live in profile.data.pets, equipped ones in equippedPets. The
 * number of equippable pets is the `petSlots` stat (base + upgrade tree), so
 * there is no hard-coded maximum.
 */
export class PetManager {
    constructor({ profile, costs, unlocks, factory, getPermanentStats }) {
        this.profile = profile;
        this.costs = costs;
        this.unlocks = unlocks;
        this.factory = factory;
        this.getPermanentStats = getPermanentStats; // () => PlayerStats without pets
    }

    get definitions() { return Object.values(PETS); }
    get owned() { return this.profile.data.pets; }
    get equipped() { return this.profile.data.equippedPets; }
    get slots() { return Math.floor(this.getPermanentStats().get('petSlots')); }

    isOwned(id) { return this.owned.includes(id); }
    isEquipped(id) { return this.equipped.includes(id); }

    adopt(id) {
        if (this.isOwned(id) || !this.costs.pay(PETS[id].costs, `pet:${id}`)) return false;
        this.unlocks.unlockPet(id);
        this.profile.save();
        return true;
    }

    equip(id) {
        if (!this.isOwned(id) || this.isEquipped(id) || this.equipped.length >= this.slots) return false;
        this.equipped.push(id);
        this.profile.save();
        return true;
    }

    unequip(id) {
        const list = this.equipped;
        const index = list.indexOf(id);
        if (index < 0) return false;
        list.splice(index, 1);
        this.profile.save();
        return true;
    }

    /** Active pets = equipped pets that fit the current slot count. */
    activePets() {
        return this.equipped.slice(0, this.slots).filter((id) => PETS[id]);
    }

    applyTo(target) {
        for (const id of this.activePets()) EffectRegistry.apply(PETS[id].effects, target, `pet:${id}`);
    }

    createStagePets(owner, spellFactory) {
        return this.activePets().map((id, i) => this.factory.create(id, owner, i, spellFactory));
    }
}
