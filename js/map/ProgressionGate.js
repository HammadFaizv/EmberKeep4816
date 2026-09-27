import { ProgressionRequirement } from '../progression/ProgressionRequirement.js';

/**
 * ProgressionGate — a world obstacle on a map connection (Broken Bridge,
 * Sealed Gate). Open when all its ProgressionRequirements are met.
 *
 * Gates are generic data; nothing in code knows about bridges or keys.
 */
export class ProgressionGate {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.requirements = data.requirements ?? [];
        this.consumes = Boolean(data.consumes);
    }

    isOpen(profile) {
        return ProgressionRequirement.checkAll(this.requirements, profile);
    }

    describeRequirements() {
        return this.requirements.map((r) => ProgressionRequirement.describe(r));
    }
}
