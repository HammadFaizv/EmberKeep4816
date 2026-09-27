/**
 * ShopItem — a purchasable entry.
 *
 * `costs` is a list (never a bare number) so items can require gold plus boss
 * materials. `requirements` are ProgressionRequirements that must be met before
 * the item can be bought (e.g. defeat a boss first). `onPurchase` performs the
 * effect and is supplied by the shop that created the item.
 */
export class ShopItem {
    constructor({ id, kind, name, description, costs = [], requirements = [], data = {}, onPurchase }) {
        this.id = id;
        this.kind = kind;            // 'unlockSpell' | 'upgradeSpell' | future kinds
        this.name = name;
        this.description = description;
        this.costs = costs;
        this.requirements = requirements;
        this.data = data;
        this.onPurchase = onPurchase;
    }
}
