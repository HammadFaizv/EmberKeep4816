/**
 * BossState — base class for one state of a boss FSM.
 *
 * Lifecycle: enter(params) -> update(dt, ctx) every tick -> exit()
 * A state decides its own outgoing transitions by calling
 * `this.machine.change(nextName, params)`. Global transitions (death, phase
 * change, stun) are handled by BossStateMachine so individual states stay small.
 *
 * `interruptible = false` protects a state (e.g. PHASE_TRANSITION, DEAD) from
 * being cut short by external events like stuns.
 */
export class BossState {
    static id = 'BASE';

    constructor(machine) {
        this.machine = machine;
        this.boss = machine.boss;
        this.controller = machine.controller;
        this.interruptible = true;
    }

    get id() { return this.constructor.id; }
    get cfg() { return this.boss.fsmConfig; }
    get time() { return this.machine.timeInState; }

    enter(params = {}) {}
    update(dt, ctx) {}
    exit() {}

    /** Optional hook for external events; return true if handled. */
    onEvent(event, data) { return false; }

    // ---- helpers shared by concrete states ------------------------------
    distanceToPlayer(ctx) {
        return this.boss.pos.distanceTo(ctx.player.pos) - this.boss.radius - ctx.player.radius;
    }

    moveTowardPlayer(ctx, speedScale = 1) {
        this.boss.vel.copy(this.boss.pos.directionTo(ctx.player.pos)).scale(this.boss.currentMoveSpeed * speedScale);
    }

    stop() { this.boss.vel.set(0, 0); }
}
