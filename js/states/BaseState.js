import { Subscriptions } from '../core/EventBus.js';

/**
 * BaseState — shared plumbing for global game states.
 * Tracks mounted UI components and event subscriptions so exit() always
 * cleans up, preventing leaked DOM or listeners between states.
 */
export class BaseState {
    constructor(game) {
        this.game = game;
        this.subs = new Subscriptions(game.bus);
        this._mounted = [];
    }

    mount(component, layer = 'screen') {
        this._mounted.push(component);
        return this.game.ui.mount(component, layer);
    }

    unmount(component) {
        this._mounted = this._mounted.filter((c) => c !== component);
        this.game.ui.unmount(component);
    }

    enter(params) {}
    update(dt) {}
    render() {}

    exit() {
        this._mounted.forEach((c) => this.game.ui.unmount(c));
        this._mounted = [];
        this.subs.clear();
    }

    /** Draws the world map as a backdrop (used by shop/upgrade/pet screens). */
    renderMapBackdrop() {
        const { renderer, worldMap, session } = this.game;
        renderer.renderMap(worldMap, { currentId: session.currentNodeId });
    }
}
