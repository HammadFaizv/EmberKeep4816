/**
 * GameLoop — requestAnimationFrame driver with a fixed gameplay timestep.
 *
 * update(step) is called zero or more times per frame with a constant `step`
 * (deterministic physics/cooldowns). render(alpha) is called once per frame;
 * alpha is the fraction between the last two updates, available for
 * interpolation if smoother rendering is ever needed.
 */
export class GameLoop {
    constructor({ update, render, step = 1 / 60, maxFrameTime = 0.25 }) {
        this.update = update;
        this.render = render;
        this.step = step;
        this.maxFrameTime = maxFrameTime;
        this.accumulator = 0;
        this.lastTime = 0;
        this.running = false;
        this._frame = this._frame.bind(this);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._frame);
    }

    stop() {
        this.running = false;
    }

    _frame(now) {
        if (!this.running) return;
        // Clamp long frames (tab switch, breakpoint) to avoid a "spiral of death".
        const frameTime = Math.min((now - this.lastTime) / 1000, this.maxFrameTime);
        this.lastTime = now;
        this.accumulator += frameTime;

        while (this.accumulator >= this.step) {
            this.update(this.step);
            this.accumulator -= this.step;
        }

        this.render(this.accumulator / this.step);
        requestAnimationFrame(this._frame);
    }
}
