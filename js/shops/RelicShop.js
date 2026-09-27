import { ShopItem } from './ShopItem.js';
import { ProgressionRequirement } from '../progression/ProgressionRequirement.js';

/**
 * RelicShop — the Relic Merchant. Sells permanent relics for Souls and boss
 * materials through RelicSystem. Follows the same shop interface as SpellShop
 * (getSections / canPurchase / purchase), so ShopUI renders it unchanged.
 */
export class RelicShop {
    constructor({ id = 'relic_shop', relics, profile }) {
        this.id = id;
        this.name = 'Wandering Relic Merchant';
        this.currencies = ['souls', 'gold'];
        this.relics = relics;
        this.profile = profile;
    }

    getSections() {
        const items = this.relics.definitions.map((def) => new ShopItem({
            id: `relic:${def.id}`,
            kind: 'relic',
            name: def.name,
            description: def.description,
            costs: def.costs,
            requirements: def.requirements ?? [],
            data: { relicId: def.id, element: def.element, owned: this.relics.owns(def.id) },
            onPurchase: () => this.relics.purchase(def.id),
        }));
        return [
            { title: 'Relics for Sale', items: items.filter((i) => !i.data.owned), empty: 'You own every relic.' },
            { title: 'Owned Relics', items: items.filter((i) => i.data.owned), empty: 'No relics yet. Souls drop from elites and bosses.' },
        ];
    }

    getOwnedSummary() { return null; }

    canPurchase(item) {
        return !item.data.owned && ProgressionRequirement.checkAll(item.requirements, this.profile) && this.relics.canPurchase(item.data.relicId);
    }

    purchase(item) {
        return this.canPurchase(item) && item.onPurchase();
    }
}
