import { BossState } from '../BossState.js';

/** IDLE — the boss "awakens" for `fsm.idleTime`, then chases once the player is in aggro range. */
export class IdleState extends BossState {
    static id = 'IDLE';

    enter() { this.stop(); }

    update(dt, ctx) {
        this.stop();
        if (this.time >= (this.cfg.idleTime ?? 1) && this.distanceToPlayer(ctx) <= (this.cfg.aggroRange ?? 800)) {
            this.machine.change('CHASE');
        }
    }
}
