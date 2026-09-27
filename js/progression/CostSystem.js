import { CURRENCIES, ITEMS } from '../config/itemConfig.js';

/**
 * CostSystem — pays multi-resource costs such as
 *   [{ type: 'currency', id: 'gold', amount: 100 }, { type: 'item', id: 'bone_crystal', amount: 1 }]
 *
 * Shops, the upgrade tree and pet adoption all use this, so a new resource type
 * only needs a new entry in COST_TYPES.
 */
export class CostSystem {
    constructor({ currency, items }) {
        this.types = new Map();
        this.register('currency', {
            has: (c) => currency.canAfford(c.id, c.amount),
            pay: (c, source) => currency.spend(c.id, c.amount, source),
            describe: (c) => `${c.amount} ${CURRENCIES[c.id]?.name ?? c.id}`,
        });
        this.register('item', {
            has: (c) => items.has(c.id, c.amount),
            pay: (c) => items.remove(c.id, c.amount),
            describe: (c) => `${c.amount}× ${ITEMS[c.id]?.name ?? c.id}`,
        });
    }

    register(type, handler) {
        this.types.set(type, handler);
    }

    canAfford(costs = []) {
        return costs.every((c) => this._handler(c).has(c));
    }

    /** All-or-nothing payment. Returns false (and pays nothing) if unaffordable. */
    pay(costs = [], source = 'purchase') {
        if (!this.canAfford(costs)) return false;
        costs.forEach((c) => this._handler(c).pay(c, source));
        return true;
    }

    describe(costs = []) {
        return costs.length ? costs.map((c) => this._handler(c).describe(c)).join(' + ') : 'Free';
    }

    _handler(cost) {
        const handler = this.types.get(cost.type);
        if (!handler) throw new Error(`CostSystem: unknown cost type "${cost.type}"`);
        return handler;
    }
}
