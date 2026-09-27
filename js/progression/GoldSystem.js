import { Events } from '../core/EventBus.js';

/**
 * GoldSystem — gold-specific rules on top of the generic CurrencySystem.
 *
 * Listens for GOLD_COLLECTED (emitted by stage pickups) and credits the
 * persistent balance immediately, so gold survives death.
 *
 * Gold modifiers: the `goldValue` stat (upgrades, relics) is applied when a
 * coin drops (CombatSystem._rollDrops), so the coin shows its real value and
 * stage summaries count what was actually credited.
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
