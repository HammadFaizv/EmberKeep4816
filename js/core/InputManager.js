/**
 * InputManager — normalises keyboard and mouse input.
 *
 * Gameplay code asks for *actions* ("moveUp", "pause") rather than raw keys.
 * Rebinding (Settings screen) only changes the bindings table: overrides are
 * stored in profile.settings.keyBindings and applied with setBindings().
 */
export const DEFAULT_BINDINGS = Object.freeze({
    moveUp: ['KeyW', 'ArrowUp'],
    moveDown: ['KeyS', 'ArrowDown'],
    moveLeft: ['KeyA', 'ArrowLeft'],
    moveRight: ['KeyD', 'ArrowRight'],
    pause: ['Escape', 'KeyP'],
    confirm: ['Enter', 'Space'],
});

/** Player-facing names of rebindable actions (Settings screen). */
export const ACTION_LABELS = Object.freeze({
    moveUp: 'Move up',
    moveDown: 'Move down',
    moveLeft: 'Move left',
    moveRight: 'Move right',
    pause: 'Pause',
    confirm: 'Confirm',
});

/** Short, readable label for a KeyboardEvent.code ('KeyW' -> 'W'). */
export function keyLabel(code) {
    return code.replace(/^(Key|Digit)/, '').replace(/^Arrow/, 'Arrow ');
}

export class InputManager {
    constructor(canvas, bindings = DEFAULT_BINDINGS) {
        this.canvas = canvas;
        this.bindings = { ...bindings };
        this.down = new Set();
        this.pressed = new Set();
        this.mouse = { x: 0, y: 0, clicked: false, inside: false };

        window.addEventListener('keydown', (e) => {
            if (!this.down.has(e.code)) this.pressed.add(e.code);
            this.down.add(e.code);
            if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
        });
        window.addEventListener('keyup', (e) => this.down.delete(e.code));
        window.addEventListener('blur', () => this.down.clear());

        canvas.addEventListener('mousemove', (e) => this._updateMouse(e));
        canvas.addEventListener('mouseleave', () => { this.mouse.inside = false; });
        canvas.addEventListener('mousedown', (e) => {
            this._updateMouse(e);
            this.mouse.clicked = true;
        });
    }

    /**
     * Applies binding overrides on top of the defaults. Each override replaces
     * the action's PRIMARY key; secondary defaults (arrows, P) stay available
     * unless another action now uses them.
     */
    setBindings(overrides = {}) {
        const taken = new Set(Object.values(overrides).flat());
        this.bindings = Object.fromEntries(Object.entries(DEFAULT_BINDINGS).map(([action, keys]) => {
            const custom = overrides[action];
            if (!custom?.length) return [action, keys.filter((k) => !taken.has(k))];
            return [action, [...custom, ...keys.slice(1).filter((k) => !taken.has(k))]];
        }));
        this.down.clear();
    }

    isDown(action) { return this.bindings[action]?.some((code) => this.down.has(code)) ?? false; }
    wasPressed(action) { return this.bindings[action]?.some((code) => this.pressed.has(code)) ?? false; }

    /** Returns a movement vector from the directional actions (not normalised). */
    getMoveAxis() {
        return {
            x: (this.isDown('moveRight') ? 1 : 0) - (this.isDown('moveLeft') ? 1 : 0),
            y: (this.isDown('moveDown') ? 1 : 0) - (this.isDown('moveUp') ? 1 : 0),
        };
    }

    /** Consumes a click, returning its canvas-space position or null. */
    consumeClick() {
        if (!this.mouse.clicked) return null;
        this.mouse.clicked = false;
        return { x: this.mouse.x, y: this.mouse.y };
    }

    /** Called once per fixed update to clear edge-triggered input. */
    endTick() {
        this.pressed.clear();
        this.mouse.clicked = false;
    }

    // The canvas is CSS-scaled to fit the window; convert to internal resolution.
    _updateMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
        this.mouse.y = ((e.clientY - rect.top) / rect.height) * this.canvas.height;
        this.mouse.inside = true;
    }
}
