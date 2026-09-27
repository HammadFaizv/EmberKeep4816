/**
 * EventBus — decoupled publish/subscribe messaging.
 *
 * Systems announce facts ("an enemy died", "gold was collected") and other
 * systems react, without holding direct references to each other.
 *
 * Rule of thumb: use events for *notifications* that any number of listeners may
 * care about. Use direct method calls for *commands* where the caller needs a result.
 */
export const Events = Object.freeze({
    // Combat
    ENEMY_SPAWNED: 'enemy:spawned',
    ENEMY_KILLED: 'enemy:killed',
    ENEMY_DAMAGED: 'enemy:damaged',
    PLAYER_DAMAGED: 'player:damaged',
    PLAYER_HEALED: 'player:healed',
    PLAYER_DIED: 'player:died',
    SPELL_CAST: 'spell:cast',

    // Stage progression (temporary)
    EXP_GAINED: 'exp:gained',
    LEVEL_UP: 'level:up',
    CARD_SELECTED: 'card:selected',
    WAVE_STARTED: 'wave:started',
    WAVE_COMPLETED: 'wave:completed',
    BOSS_SPAWNED: 'boss:spawned',
    BOSS_PHASE_CHANGED: 'boss:phaseChanged',
    BOSS_DEFEATED: 'boss:defeated',
    MINIBOSS_DEFEATED: 'miniboss:defeated',
    STAGE_STARTED: 'stage:started',
    STAGE_COMPLETED: 'stage:completed',
    STAGE_FAILED: 'stage:failed',

    // Economy / persistent progression
    GOLD_DROPPED: 'gold:dropped',
    GOLD_COLLECTED: 'gold:collected',
    CURRENCY_CHANGED: 'currency:changed',
    ITEM_ACQUIRED: 'item:acquired',
    SPELL_UNLOCKED: 'spell:unlocked',
    SPELL_UPGRADED: 'spell:upgraded',
    UPGRADE_PURCHASED: 'upgrade:purchased',
    PATH_UNLOCKED: 'path:unlocked',
    FEATURE_UNLOCKED: 'feature:unlocked',
    PET_UNLOCKED: 'pet:unlocked',
    SAVE_WRITTEN: 'save:written',
    SAVE_RESET: 'save:reset',
});

export class EventBus {
    constructor() {
        this._listeners = new Map();
        this.debug = false;
    }

    /** Subscribes and returns an unsubscribe function. */
    on(event, handler) {
        if (!this._listeners.has(event)) this._listeners.set(event, new Set());
        this._listeners.get(event).add(handler);
        return () => this.off(event, handler);
    }

    once(event, handler) {
        const off = this.on(event, (payload) => {
            off();
            handler(payload);
        });
        return off;
    }

    off(event, handler) {
        this._listeners.get(event)?.delete(handler);
    }

    emit(event, payload = {}) {
        if (this.debug) console.debug(`[EventBus] ${event}`, payload);
        const handlers = this._listeners.get(event);
        if (!handlers) return;
        // Copy so handlers may unsubscribe while being iterated.
        for (const handler of [...handlers]) handler(payload);
    }
}

/**
 * Collects unsubscribe functions so short-lived objects (a Stage, a UI screen)
 * can drop all their listeners in one call when they are destroyed.
 */
export class Subscriptions {
    constructor(bus) {
        this.bus = bus;
        this._offs = [];
    }

    on(event, handler) {
        this._offs.push(this.bus.on(event, handler));
        return this;
    }

    clear() {
        this._offs.forEach((off) => off());
        this._offs = [];
    }
}
