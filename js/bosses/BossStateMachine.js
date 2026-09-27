import { Events } from '../core/EventBus.js';

/**
 * BossStateMachine — per-boss finite state machine.
 *
 * States: IDLE, CHASE, ATTACK, SPECIAL_ATTACK, PHASE_TRANSITION, STUNNED, DEAD
 * (whichever the boss lists in `fsm.states`).
 *
 * Transition sources:
 *   - the active state itself (distance, cooldowns, timers)      -> state.update()
 *   - global rules checked every tick (death, HP phase threshold) -> checkGlobalTransitions()
 *   - external events (stun from a spell, scripted triggers)      -> handleEvent()
 */
export class BossStateMachine {
    constructor(boss, controller) {
        this.boss = boss;
        this.controller = controller;
        this.states = new Map();
        this.current = null;
        this.timeInState = 0;
        this.history = []; // last few state ids, handy for debugging/AI decisions
    }

    add(StateClass) {
        this.states.set(StateClass.id, new StateClass(this));
        return this;
    }

    has(id) { return this.states.has(id); }
    get currentId() { return this.current?.id ?? null; }

    change(id, params = {}) {
        const next = this.states.get(id);
        if (!next) {
            console.warn(`BossStateMachine: ${this.boss.name} has no state "${id}"`);
            return;
        }
        this.current?.exit();
        this.current = next;
        this.timeInState = 0;
        this.history.push(id);
        if (this.history.length > 10) this.history.shift();
        next.enter(params);
    }

    update(dt, ctx) {
        this.timeInState += dt;
        this.checkGlobalTransitions(ctx);
        this.current?.update(dt, ctx);
    }

    checkGlobalTransitions(ctx) {
        const { boss } = this;
        if (boss.dying) {
            if (this.currentId !== 'DEAD') this.change('DEAD');
            return;
        }
        boss.checkPhaseThreshold();
        if (boss.pendingPhase !== null && this.current?.interruptible && this.has('PHASE_TRANSITION')) {
            this.change('PHASE_TRANSITION');
            ctx.bus.emit(Events.BOSS_PHASE_CHANGED, { boss, phase: boss.phases[boss.pendingPhase] });
        }
    }

    /** External events, e.g. handleEvent('stun', { duration }). */
    handleEvent(event, data = {}) {
        if (this.current?.onEvent(event, data)) return;
        if (event === 'stun' && this.current?.interruptible && this.has('STUNNED') && this.boss.stunImmuneTime <= 0) {
            this.change('STUNNED', data);
        }
    }
}
