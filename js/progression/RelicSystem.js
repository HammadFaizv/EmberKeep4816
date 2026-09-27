import { Events } from '../core/EventBus.js';
import { RELICS } from '../config/relicConfig.js';
import { EffectRegistry } from './EffectRegistry.js';
import { ProgressionRequirement } from './ProgressionRequirement.js';

/**
 * RelicSystem — persistent relic ownership. Purchases go through CostSystem
 * (Souls + boss materials); owned relics apply their effects to the permanent
 * stat block at the start of every stage (see PlayerProgression.buildPermanentStats).
 */
export class RelicSystem {
    constructor({ profile, costs, bus, relics = RELICS }) {
        this.profile = profile;
        this.costs = costs;
        this.bus = bus;
        this.relics = relics;
    }

    get definitions() { return Object.values(this.relics); }
    owns(id) { return this.profile.ownsRelic(id); }
    isAvailable(id) { return ProgressionRequirement.checkAll(this.relics[id].requirements, this.profile); }

    canPurchase(id) {
        return !this.owns(id) && this.isAvailable(id) && this.costs.canAfford(this.relics[id].costs);
    }

    purchase(id) {
        if (!this.canPurchase(id) || !this.costs.pay(this.relics[id].costs, `relic:${id}`)) return false;
        this.profile.data.relics.push(id);
        this.profile.save();
        this.bus.emit(Events.RELIC_ACQUIRED, { id, relic: this.relics[id] });
        return true;
    }

    applyTo(target) {
        for (const id of this.profile.data.relics) {
            const relic = this.relics[id];
            if (relic) EffectRegistry.apply(relic.effects, target, `relic:${id}`);
        }
    }
}
