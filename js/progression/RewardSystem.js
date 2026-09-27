/**
 * RewardSystem — grants persistent rewards described as data:
 *   { type: 'currency', id: 'gold', amount: 50 }
 *   { type: 'item', id: 'bridge_logs', amount: 1 }
 *   { type: 'unlockSpell', id: 'flame_nova' }
 *   { type: 'unlockFeature', id: 'pets' }
 *   { type: 'unlockPet', id: 'fire_sprite' }
 *
 * Used for stage rewards, boss rewards and NPC visits. Register new reward
 * types with register(type, fn).
 */
export class RewardSystem {
    constructor({ currency, items, unlocks }) {
        this.handlers = new Map();
        this.register('currency', (r, source) => currency.add(r.id, r.amount, source));
        this.register('item', (r, source) => items.add(r.id, r.amount ?? 1, source));
        this.register('unlockSpell', (r) => unlocks.unlockSpell(r.id));
        this.register('unlockFeature', (r) => unlocks.unlockFeature(r.id));
        this.register('unlockPet', (r) => unlocks.unlockPet(r.id));
    }

    register(type, handler) {
        this.handlers.set(type, handler);
    }

    grant(rewards = [], source = 'unknown') {
        for (const reward of rewards) {
            const handler = this.handlers.get(reward.type);
            if (handler) handler(reward, source);
            else console.warn(`RewardSystem: unknown reward type "${reward.type}"`);
        }
    }
}
