/**
 * StateMachine — generic stack-based finite state machine.
 *
 * Used for the global game flow (MENU -> MAP -> PLAYING ...). Overlay states
 * such as PAUSED and LEVEL_UP are *pushed* on top of PLAYING so the stage keeps
 * rendering underneath but stops updating.
 *
 * A state is any object implementing (all optional):
 *   enter(params), exit(), pause(), resume(), update(dt), render(alpha)
 *
 * Boss AI uses its own lighter machine (js/bosses/BossStateMachine.js) because
 * boss states need per-entity context rather than global services.
 */
export class StateMachine {
    constructor() {
        this.states = new Map();
        this.stack = [];
    }

    register(id, state) {
        this.states.set(id, state);
        return this;
    }

    get current() { return this.stack[this.stack.length - 1] ?? null; }
    get currentId() { return this.current?.id ?? null; }

    has(id) { return this.stack.some((entry) => entry.id === id); }

    /** Replaces the whole stack with a single state. */
    change(id, params = {}) {
        while (this.stack.length) this.stack.pop().state.exit?.();
        this._enter(id, params);
    }

    /** Pushes an overlay state; the state beneath is paused. */
    push(id, params = {}) {
        this.current?.state.pause?.();
        this._enter(id, params);
    }

    /** Pops the top state; the state beneath resumes. */
    pop() {
        const top = this.stack.pop();
        top?.state.exit?.();
        this.current?.state.resume?.();
    }

    update(dt) {
        this.current?.state.update?.(dt);
    }

    /** Renders every state bottom-up so overlays draw above their parent. */
    render(alpha) {
        for (const entry of this.stack) entry.state.render?.(alpha);
    }

    _enter(id, params) {
        const state = this.states.get(id);
        if (!state) throw new Error(`StateMachine: unknown state "${id}"`);
        this.stack.push({ id, state });
        state.enter?.(params);
    }
}
