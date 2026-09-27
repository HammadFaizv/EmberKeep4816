import { BossState } from '../BossState.js';

/**
 * STUNNED — entered via an external 'stun' event. The boss stands still,
 * then gains brief stun immunity so chain stuns cannot lock it forever.
 */
export class StunnedState extends BossState {
    static id = 'STUNNED';

    enter({ duration }) {
        this.duration = Math.min(duration ?? 0.5, this.cfg.stunDuration ?? 1);
        this.stop();
    }

    update() {
        this.stop();
        if (this.time >= this.duration) this.machine.change('CHASE');
    }

    exit() { this.boss.stunImmuneTime = 3; }
}
