/**
 * Cooldown — counts down to zero; `ready` when elapsed.
 * Used by spells, enemy attacks and boss abilities.
 */
export class Cooldown {
    constructor(duration, startReady = true) {
        this.duration = duration;
        this.remaining = startReady ? 0 : duration;
    }

    get ready() { return this.remaining <= 0; }
    get progress() { return this.duration > 0 ? 1 - this.remaining / this.duration : 1; }

    update(dt) {
        if (this.remaining > 0) this.remaining -= dt;
    }

    /** Restarts the cooldown, optionally with a new duration. */
    trigger(duration = this.duration) {
        this.duration = duration;
        this.remaining = duration;
    }
}

/** Timer — counts up; optional one-shot callback after `duration`. */
export class Timer {
    constructor(duration = Infinity, onComplete = null) {
        this.duration = duration;
        this.elapsed = 0;
        this.onComplete = onComplete;
        this.done = false;
    }

    update(dt) {
        if (this.done) return;
        this.elapsed += dt;
        if (this.elapsed >= this.duration) {
            this.done = true;
            this.onComplete?.();
        }
    }

    reset(duration = this.duration) {
        this.duration = duration;
        this.elapsed = 0;
        this.done = false;
    }
}
