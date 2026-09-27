import { Events } from '../core/EventBus.js';
import { ITEMS } from '../config/itemConfig.js';

/**
 * ProgressionItemSystem — persistent counted items: progression keys
 * (Bridge Logs), boss materials (Bone Crystal) and rare drops (Soul Shard).
 */
export class ProgressionItemSystem {
    constructor({ profile, bus }) {
        this.profile = profile;
        this.bus = bus;
    }

    count(id) { return this.profile.itemCount(id); }
    has(id, amount = 1) { return this.count(id) >= amount; }

    add(id, amount = 1, source = 'unknown') {
        if (!ITEMS[id]) throw new Error(`Unknown item "${id}"`);
        this.profile.data.progressionItems[id] = this.count(id) + amount;
        this.bus.emit(Events.ITEM_ACQUIRED, { id, amount, item: ITEMS[id], source });
    }

    remove(id, amount = 1) {
        if (!this.has(id, amount)) return false;
        this.profile.data.progressionItems[id] = this.count(id) - amount;
        return true;
    }

    /** Items grouped by category for UI display. */
    list() {
        return Object.entries(this.profile.data.progressionItems)
            .filter(([, count]) => count > 0)
            .map(([id, count]) => ({ ...ITEMS[id], count }));
    }
}
