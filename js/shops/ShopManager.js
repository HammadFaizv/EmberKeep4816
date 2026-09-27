/**
 * ShopManager — registry of shops by id. Map nodes of type 'shop' reference a
 * shopId; the ShopState asks this manager for the shop to display.
 *
 * TODO: Future shops (a Relic Merchant selling boss-material crafts, a Pet
 * Treats vendor) are new classes following SpellShop's interface, registered
 * here in Game.js, plus a UI component.
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
