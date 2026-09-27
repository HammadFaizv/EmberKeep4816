import { Events } from '../core/EventBus.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * LevelSystem — TEMPORARY stage level. Created fresh for every stage
 * (level = startingLevel, exp = 0) and discarded afterwards.
 *
 * Do not confuse with permanent progression (PlayerProgression/UpgradeSystem).
 */
export class LevelSystem {
    constructor({ bus, startingLevel = 0, curve = GAME_CONFIG.expToNextLevel }) {
        this.bus = bus;
        this.curve = curve;
        this.level = startingLevel;
        this.exp = 0;
    }

    get expToNext() { return this.curve(this.level); }
    get progress() { return this.exp / this.expToNext; }

    /** Adds EXP and returns how many levels were gained. Emits LEVEL_UP per level. */
    addExp(amount) {
        this.exp += amount;
        let gained = 0;
        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.level += 1;
            gained += 1;
            this.bus.emit(Events.LEVEL_UP, { level: this.level });
        }
        return gained;
    }
}
