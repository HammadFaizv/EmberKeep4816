import { BossState } from '../BossState.js';
import { BossAttacks } from '../BossAttacks.js';

/**
 * ATTACK — basic melee: telegraph for `windup` seconds, strike, brief recovery,
 * then back to CHASE. The telegraph gives the player a chance to step away.
 */
export class AttackState extends BossState {
    static id = 'ATTACK';

    enter({ attackId }) {
        this.attackId = attackId;
        this.attack = this.boss.attacks[attackId];
        this.struck = false;
        this.stop();
    }

    update(dt, ctx) {
        this.stop();
        const windup = this.attack.windup ?? 0.3;
        this.boss.telegraph = { attackId: this.attackId, progress: Math.min(1, this.time / windup), radius: this.boss.radius + this.attack.reach };
        if (!this.struck && this.time >= windup) {
            this.struck = true;
            BossAttacks.execute(this.boss, this.attackId, ctx);
            this.controller.triggerCooldown(this.attackId);
        }
        if (this.time >= windup + 0.3) this.machine.change('CHASE');
    }

    exit() { this.boss.telegraph = null; }
}
