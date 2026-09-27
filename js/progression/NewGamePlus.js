import { Events } from '../core/EventBus.js';
import { ITEMS } from '../config/itemConfig.js';

/**
 * NewGamePlus — starts another cycle after the Demon Lord falls.
 *
 * KEPT:   gold, souls, spells and spell upgrades, the upgrade tree, pets,
 *         relics, boss materials, features, settings.
 * RESET:  map progress (stages, bosses, opened gates) and progression keys
 *         (Bridge Logs, Ancient Key), so the journey north starts again.
 * HARDER: every stage is shifted up the difficulty tiers (see
 *         StageRules.resolveScaling) and currency rewards grow
 *         (StageManager), per GAME_CONFIG.newGamePlus.
 */
export class NewGamePlus {
    constructor({ profile, unlocks, worldMap, bus }) {
        this.profile = profile;
        this.unlocks = unlocks;
        this.worldMap = worldMap;
        this.bus = bus;
    }

    get level() { return this.profile.ngPlus; }
    get available() { return Boolean(this.profile.data.story.cleared); }

    start() {
        if (!this.available) return false;
        const data = this.profile.data;
        data.story.ngPlus = this.level + 1;
        data.completedStages = [];
        data.unlockedStages = [];
        data.defeatedBosses = [];
        data.openedGates = [];
        for (const id of Object.keys(data.progressionItems)) {
            if (ITEMS[id]?.category === 'progression') delete data.progressionItems[id];
        }
        this.worldMap.reset();
        this.unlocks.refresh();
        this.profile.save();
        this.bus.emit(Events.NEW_GAME_PLUS, { level: data.story.ngPlus });
        return true;
    }
}
