import { Events } from '../core/EventBus.js';

/**
 * ExperienceSystem — converts kills into stage EXP.
 *
 * Stage-scoped: created by the Stage, subscribed through the Stage's
 * Subscriptions so it disappears with the stage. EXP is awarded directly on
 * kill (no orbs) to keep DEFENSE stages, where the player cannot move, fair.
 *
 * TODO: If EXP orbs are wanted in OPEN_FIELD stages, spawn Pickup entities of
 * kind 'exp' here instead of calling levels.addExp directly, and let the stage
 * rule `autoCollectPickups` decide whether they fly to the player.
 */
export class ExperienceSystem {
    constructor({ bus, subscriptions, levels, player }) {
        this.bus = bus;
        this.levels = levels;
        this.player = player;
        subscriptions.on(Events.ENEMY_KILLED, ({ enemy }) => this.award(enemy.exp));
    }

    award(baseAmount) {
        if (!baseAmount) return;
        const amount = baseAmount * this.player.stats.get('expGain');
        this.bus.emit(Events.EXP_GAINED, { amount });
        this.levels.addExp(amount);
    }
}
