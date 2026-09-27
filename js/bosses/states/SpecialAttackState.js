import { BossState } from '../BossState.js';
import { BossAttacks } from '../BossAttacks.js';

/**
 * SPECIAL_ATTACK — any non-melee attack from the current phase (bursts,
 * summons...). Which attack runs is data; this state only handles timing:
 * windup telegraph -> execute -> recovery -> CHASE.
 */
export class SpecialAttackState extends BossState {
    static id = 'SPECIAL_ATTACK';

    enter({ attackId }) {
        this.attackId = attackId;
        this.attack = this.boss.attacks[attackId];
        this.done = false;
        this.stop();
    }

    update(dt, ctx) {
        this.stop();
        const windup = this.attack.windup ?? 0.6;
        this.boss.telegraph = { attackId: this.attackId, progress: Math.min(1, this.time / windup), radius: this.boss.radius + 30, special: true };
        if (!this.done && this.time >= windup) {
            this.done = true;
            BossAttacks.execute(this.boss, this.attackId, ctx);
            this.controller.triggerCooldown(this.attackId);
        }
        if (this.time >= windup + 0.5) this.machine.change('CHASE');
    }

    exit() { this.boss.telegraph = null; }
}
