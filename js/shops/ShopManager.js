/**
 * ShopManager — registry of shops by id. Map nodes of type 'shop' reference a
 * shopId; the ShopState asks this manager for the shop to display.
 *
 * Shop interface (SpellShop, RelicShop):
 *   id, name, currencies          header data
 *   getSections()                 [{ title, items: ShopItem[], empty }]
 *   getOwnedSummary()             optional { label, tags: [{ text, element }] }
 *   canPurchase(item) / purchase(item)
 * ShopUI renders any shop that follows it; a new shop is a class + a
 * registration in Game.js + a map node with its shopId.
 */
export class ShopManager {
    constructor() {
        this.shops = new Map();
    }

    register(shop) {
        this.shops.set(shop.id, shop);
        return this;
    }

    get(id) {
        return this.shops.get(id) ?? null;
    }
}
