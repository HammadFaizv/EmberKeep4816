import { Events } from '../core/EventBus.js';

/**
 * SoulSystem — Souls, the second currency.
 *
 * Souls drop from elites, minibosses and bosses (enemy `drops.souls`) and are
 * spent at the Relic Merchant. Like gold they are credited on pickup, so they
 * survive death.
 */
export class SoulSystem {
    constructor({ currency, bus }) {
        this.currency = currency;
        bus.on(Events.SOULS_COLLECTED, ({ amount }) => this.collect(amount));
    }

    get balance() { return this.currency.get('souls'); }

    collect(amount) {
        this.currency.add('souls', amount, 'pickup');
    }
}
