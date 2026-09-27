import { Events } from '../core/EventBus.js';
import { CURRENCIES } from '../config/itemConfig.js';

/**
 * CurrencySystem — generic balances for every currency in itemConfig.CURRENCIES.
 * Gold is just one id; adding "souls" needs no code here.
 *
 * Currencies are persistent: they live on the profile and survive death.
 * The caller decides when to persist (stage end, purchases) to avoid a
 * localStorage write per coin.
 */
export class CurrencySystem {
    constructor({ profile, bus }) {
        this.profile = profile;
        this.bus = bus;
    }

    get(id) { return this.profile.currency(id); }
    canAfford(id, amount) { return this.get(id) >= amount; }

    add(id, amount, source = 'unknown') {
        if (!CURRENCIES[id]) throw new Error(`Unknown currency "${id}"`);
        if (amount <= 0) return;
        this.profile.data.currencies[id] = this.get(id) + amount;
        this.bus.emit(Events.CURRENCY_CHANGED, { id, amount, total: this.get(id), source });
    }

    spend(id, amount, source = 'unknown') {
        if (!this.canAfford(id, amount)) return false;
        this.profile.data.currencies[id] = this.get(id) - amount;
        this.bus.emit(Events.CURRENCY_CHANGED, { id, amount: -amount, total: this.get(id), source });
        return true;
    }
}
