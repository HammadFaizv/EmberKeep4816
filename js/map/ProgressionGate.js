import { ProgressionRequirement } from '../progression/ProgressionRequirement.js';

/**
 * ProgressionGate — a world obstacle on a map connection (Broken Bridge,
 * Sealed Gate). Gates are generic data; nothing in code knows about bridges
 * or keys.
 *
 * Non-consuming gates are open whenever their requirements are met.
 * Consuming gates (`consumes: true`) are OPENED once by UnlockSystem, which
 * removes the required items and records the gate in profile.openedGates;
 * from then on they stay open even though the items are gone.
 */
export class ProgressionGate {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.requirements = data.requirements ?? [];
        this.consumes = Boolean(data.consumes);
    }

    /** Requirements currently met (items in the inventory, etc.). */
    canOpen(profile) {
        return ProgressionRequirement.checkAll(this.requirements, profile);
    }

    isOpen(profile) {
        if (profile.isGateOpened(this.id)) return true;
        return !this.consumes && this.canOpen(profile);
    }

    /** Items taken when a consuming gate opens. */
    consumedItems() {
        return this.requirements.filter((r) => r.type === 'hasItem').map((r) => ({ id: r.id, amount: r.amount ?? 1 }));
    }

    describeRequirements() {
        return this.requirements.map((r) => ProgressionRequirement.describe(r));
    }
}
