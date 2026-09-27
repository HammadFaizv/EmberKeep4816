import { Events } from '../core/EventBus.js';
import { UPGRADES } from '../config/upgradeConfig.js';
import { EffectRegistry } from './EffectRegistry.js';
import { ProgressionRequirement } from './ProgressionRequirement.js';

/**
 * UpgradeSystem — the permanent Gold upgrade tree.
 *
 * Node state machine:  locked -> available -> purchased
 *   available = every `requires` parent purchased AND extra `requirements` met.
 *
 * Purchased nodes are re-applied to a fresh PlayerStats at the start of every
 * stage via applyTo(), so upgrade effects never double-stack and a respec
 * feature would simply clear `permanentUpgrades`.
 */
export const NodeState = Object.freeze({
    LOCKED: 'locked',
    AVAILABLE: 'available',
    PURCHASED: 'purchased',
});

export class UpgradeSystem {
    constructor({ profile, costs, unlocks, bus, nodes = UPGRADES }) {
        this.profile = profile;
        this.costs = costs;
        this.unlocks = unlocks;
        this.bus = bus;
        this.nodes = nodes;
        this.byId = new Map(nodes.map((n) => [n.id, n]));
    }

    getNode(id) { return this.byId.get(id); }
    isPurchased(id) { return this.profile.hasUpgrade(id); }

    getState(id) {
        if (this.isPurchased(id)) return NodeState.PURCHASED;
        const node = this.getNode(id);
        const parentsOk = node.requires.every((p) => this.isPurchased(p));
        const reqsOk = ProgressionRequirement.checkAll(node.requirements, this.profile);
        return parentsOk && reqsOk ? NodeState.AVAILABLE : NodeState.LOCKED;
    }

    canPurchase(id) {
        return this.getState(id) === NodeState.AVAILABLE && this.costs.canAfford(this.getNode(id).costs);
    }

    purchase(id) {
        if (!this.canPurchase(id)) return false;
        const node = this.getNode(id);
        this.costs.pay(node.costs, `upgrade:${id}`);
        this.profile.data.permanentUpgrades.push(id);
        // One-time effects (feature unlocks) apply now; stat effects apply per stage.
        EffectRegistry.apply(node.effects, { unlocks: this.unlocks }, `upgrade:${id}`);
        this.unlocks.refresh();
        this.profile.save();
        this.bus.emit(Events.UPGRADE_PURCHASED, { id, node });
        return true;
    }

    /** Applies all purchased stat effects to a target ({ stats }). */
    applyTo(target) {
        for (const id of this.profile.data.permanentUpgrades) {
            const node = this.getNode(id);
            if (!node) continue; // node removed from config: ignore gracefully
            EffectRegistry.apply(node.effects.filter((e) => e.type !== 'unlockFeature'), target, `upgrade:${id}`);
        }
    }
}
