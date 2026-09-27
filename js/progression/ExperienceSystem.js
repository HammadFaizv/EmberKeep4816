import { Events } from '../core/EventBus.js';
import { Pickup } from '../entities/Pickup.js';

/**
 * ExperienceSystem — converts kills into stage EXP through EXP orbs.
 *
 * Stage-scoped: created by the Stage, subscribed through the Stage's
 * Subscriptions so it disappears with the stage. Every kill drops orbs worth
 * the enemy's `exp`; collecting an orb awards it (× the `expGain` stat).
 * The stage rule `autoCollectPickups` makes orbs fly to the player, which
 * keeps DEFENSE stages (no movement) fair.
 *
 * Big EXP values (bosses) are split into several orbs for a satisfying burst.
 */
const MAX_ORB_VALUE = 25;

export class ExperienceSystem {
    constructor({ bus, subscriptions, levels, player, stage }) {
        this.bus = bus;
        this.levels = levels;
        this.player = player;
        this.stage = stage;
        subscriptions
            .on(Events.ENEMY_KILLED, ({ enemy }) => this.dropOrbs(enemy))
            .on(Events.EXP_COLLECTED, ({ amount }) => this.award(amount));
    }

    dropOrbs(enemy) {
        let remaining = enemy.exp ?? 0;
        while (remaining > 0) {
            const value = Math.min(MAX_ORB_VALUE, remaining);
            remaining -= value;
            this.stage.spawnPickup(new Pickup({ kind: 'exp', amount: value, x: enemy.pos.x, y: enemy.pos.y }));
        }
    }

    award(baseAmount) {
        if (!baseAmount) return;
        const amount = baseAmount * this.player.stats.get('expGain');
        this.bus.emit(Events.EXP_GAINED, { amount });
        this.levels.addExp(amount);
    }
}
