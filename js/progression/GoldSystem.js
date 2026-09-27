import { Events } from '../core/EventBus.js';

/**
 * GoldSystem — gold-specific rules on top of the generic CurrencySystem.
 *
 * Listens for GOLD_COLLECTED (emitted by stage pickups) and credits the
 * persistent balance immediately, so gold survives death.
 *
 * TODO: Gold-specific modifiers (e.g. an upgrade "+10% gold value") belong in
 * collect() — read a `goldValue` stat from the payload before crediting.
 */
export class GoldSystem {
    constructor({ currency, bus }) {
        this.currency = currency;
        bus.on(Events.GOLD_COLLECTED, ({ amount }) => this.collect(amount));
    }

    get balance() { return this.currency.get('gold'); }

    collect(amount) {
        this.currency.add('gold', amount, 'pickup');
    }
}
