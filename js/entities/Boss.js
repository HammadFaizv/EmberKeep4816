import { Enemy } from './Enemy.js';
import { BossController } from '../bosses/BossController.js';

/**
 * Boss — an Enemy driven by a finite state machine instead of a simple AI.
 *
 * The Boss holds DATA (hp, phases, attacks, current phase). Behavior lives in
 * BossController + BossStateMachine + BossState subclasses. Phase changes are
 * *requested* here (pendingPhase) and *performed* by PHASE_TRANSITION state.
 */
export class Boss extends Enemy {
    constructor(def, { scaling, ...rest }) {
        super(def, {
            ...rest,
            scaling: { hpMult: scaling.bossHpMult ?? 1, damageMult: scaling.bossDamageMult ?? 1 },
        });
        this.kind = def.kind ?? 'boss';
        this.canBeImmune = true;
        this.phases = def.phases ?? [{ name: 'Default', threshold: 1, attacks: Object.keys(def.attacks ?? {}) }];
        this.phaseIndex = 0;
        this.pendingPhase = null;
        this.attacks = def.attacks ?? {};
        this.fsmConfig = def.fsm ?? {};
        this.rewards = def.rewards ?? [];
        this.dying = false;
        this.invulnerable = false;
        this.stunImmuneTime = 0;
        this.telegraph = null;   // { attackId, progress } read by rendering
        this.controller = new BossController(this);
    }

    get isBoss() { return true; }
    get isMiniboss() { return this.kind === 'miniboss'; }
    get targetable() { return this.alive && !this.dying; }
    get phase() { return this.phases[this.phaseIndex]; }
    get currentMoveSpeed() { return this.moveSpeed * (this.phase.speedMult ?? 1) * this.moveMult; }

    /** Attack ids usable in the current phase. */
    get activeAttackIds() { return this.phase.attacks ?? Object.keys(this.attacks); }

    takeDamage(amount) {
        if (this.invulnerable) return false;
        return super.takeDamage(amount);
    }

    /** Flags a pending phase when HP crosses the next threshold. */
    checkPhaseThreshold() {
        if (this.pendingPhase !== null) return;
        const next = this.phases[this.phaseIndex + 1];
        if (next && this.hpRatio <= next.threshold) this.pendingPhase = this.phaseIndex + 1;
    }

    applyPendingPhase() {
        if (this.pendingPhase === null) return;
        this.phaseIndex = this.pendingPhase;
        this.pendingPhase = null;
    }

    /** Status effects call this; the FSM decides whether a stun actually lands. */
    onStatusApplied(type, status) {
        if (type === 'stun') this.controller.handleEvent('stun', { duration: status.duration });
    }

    think(dt, ctx) {
        this.controller.update(dt, ctx);
    }
}
