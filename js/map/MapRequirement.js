import { ProgressionRequirement } from '../progression/ProgressionRequirement.js';

/**
 * MapRequirement — map-facing helpers over the generic ProgressionRequirement
 * system: explains to the player why a node is locked.
 */
export const MapRequirement = {
    nodePrerequisitesMet(node, profile) {
        return ProgressionRequirement.checkAll(node.prerequisites, profile);
    },

    /** Human-readable reasons a node is locked (empty when unlocked). */
    lockReasons(node, profile) {
        if (node.unlocked) return [];
        const reasons = ProgressionRequirement.unmet(node.prerequisites, profile)
            .map((r) => ProgressionRequirement.describe(r));
        if (node.incoming.length && !node.incoming.some((c) => c.isOpen(profile))) {
            const completedSources = node.incoming.filter((c) => c.from.completed);
            if (completedSources.length === 0) {
                reasons.push(`Complete ${node.incoming.map((c) => c.from.name).join(' or ')}`);
            }
            completedSources.forEach((c) => {
                if (c.gate) reasons.push(`${c.gate.name}: ${c.gate.describeRequirements().join(', ')}`);
            });
        }
        return reasons;
    },
};
