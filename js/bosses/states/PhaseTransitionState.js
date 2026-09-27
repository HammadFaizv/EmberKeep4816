import { BossState } from '../BossState.js';
import { PhaseEvents } from '../PhaseEvents.js';
import { Effect } from '../../entities/Effect.js';

/**
 * PHASE_TRANSITION — entered by BossStateMachine when HP crosses the next
 * phase threshold. The boss is invulnerable while it transforms, then the new
 * phase (speed, cooldowns, attack list) takes effect.
 *
 * Per-phase scripted events (dialogue, add waves, arena hazards, heals...)
 * are listed as `onEnter` on the phase config and run here through the
 * PhaseEvents registry once the new phase applies. Per-phase immunity and
 * resistance overrides are read directly by Boss getters.
 */
export class PhaseTransitionState extends BossState {
    static id = 'PHASE_TRANSITION';

    constructor(machine) {
        super(machine);
        this.interruptible = false;
    }

    enter() {
        this.stop();
        this.boss.invulnerable = true;
        this.boss.statuses = [];
    }

    update(dt, ctx) {
        this.stop();
        if (this.time >= (this.cfg.phaseTransitionTime ?? 1.5)) {
            this.boss.applyPendingPhase();
            PhaseEvents.run(this.boss.phase.onEnter, this.boss, ctx);
            ctx.spawnEffect(new Effect({ kind: 'ring', x: this.boss.pos.x, y: this.boss.pos.y, duration: 0.6,
                data: { radius: this.boss.radius * 4, color: this.boss.render.accent ?? '#ff0000' } }));
            this.machine.change('CHASE');
        }
    }

    exit() { this.boss.invulnerable = false; }
}
