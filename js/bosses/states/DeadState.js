import { BossState } from '../BossState.js';
import { Effect } from '../../entities/Effect.js';

/**
 * DEAD — death animation window. CombatSystem already emitted the defeat
 * events and rolled drops; this state only removes the boss afterwards.
 */
export class DeadState extends BossState {
    static id = 'DEAD';

    constructor(machine) {
        super(machine);
        this.interruptible = false;
    }

    enter() {
        this.stop();
        this.boss.telegraph = null;
    }

    update(dt, ctx) {
        this.stop();
        if (Math.random() < 0.3) {
            ctx.spawnEffect(new Effect({
                kind: 'ring',
                x: this.boss.pos.x + (Math.random() - 0.5) * this.boss.radius * 2,
                y: this.boss.pos.y + (Math.random() - 0.5) * this.boss.radius * 2,
                duration: 0.4,
                data: { radius: 18, color: this.boss.render.accent ?? '#ffffff' },
            }));
        }
        if (this.time >= 1.4) this.boss.alive = false;
    }
}
