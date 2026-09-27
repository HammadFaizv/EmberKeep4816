import { Events } from '../core/EventBus.js';
import { el } from './dom.js';
import { ITEMS } from '../config/itemConfig.js';
import { SPELLS } from '../config/spellConfig.js';
import { PETS } from '../config/petConfig.js';
import { RELICS } from '../config/relicConfig.js';

/**
 * UIManager — mounts DOM UI components into layers above the canvas and shows
 * toast notifications for progression events.
 *
 * Layers (bottom to top): screen (HUD, map chrome) -> overlay (cards, pause,
 * results, shops) -> toast. Game states own which components are mounted;
 * UIManager just places them.
 */
const MAX_TOASTS = 4;

export class UIManager {
    constructor(root, bus) {
        this.root = root;
        this.layers = {
            screen: el('div', { class: 'ui-layer ui-screen' }),
            overlay: el('div', { class: 'ui-layer ui-overlay' }),
            toast: el('div', { class: 'ui-layer ui-toasts' }),
        };
        root.append(this.layers.screen, this.layers.overlay, this.layers.toast);
        this._bindToasts(bus);
    }

    mount(component, layer = 'screen') {
        this.layers[layer].append(component.el);
        component.onMount?.();
        return component;
    }

    unmount(component) {
        component?.destroy();
    }

    toast(text, kind = 'info') {
        const node = el('div', { class: `toast toast-${kind}` }, text);
        this.layers.toast.append(node);
        // Keep the stack short so a burst of unlocks never covers the screen.
        while (this.layers.toast.children.length > MAX_TOASTS) this.layers.toast.firstElementChild.remove();
        setTimeout(() => node.classList.add('toast-out'), 2600);
        setTimeout(() => node.remove(), 3200);
    }

    _bindToasts(bus) {
        bus.on(Events.ITEM_ACQUIRED, ({ id }) => this.toast(`Obtained: ${ITEMS[id]?.name ?? id}`, 'item'));
        bus.on(Events.PATH_UNLOCKED, ({ name }) => this.toast(`New path opened: ${name}`, 'path'));
        bus.on(Events.FEATURE_UNLOCKED, ({ name }) => this.toast(`Unlocked: ${name}`, 'feature'));
        bus.on(Events.SPELL_UNLOCKED, ({ id }) => this.toast(`Spell learned: ${SPELLS[id]?.name ?? id}`, 'spell'));
        bus.on(Events.SPELL_UPGRADED, ({ id, level }) => this.toast(`${SPELLS[id]?.name ?? id} upgraded to Lv ${level}`, 'spell'));
        bus.on(Events.PET_UNLOCKED, ({ id }) => this.toast(`New companion: ${PETS[id]?.name ?? id}`, 'feature'));
        bus.on(Events.UPGRADE_PURCHASED, ({ node }) => this.toast(`Upgrade purchased: ${node.name}`, 'feature'));
        bus.on(Events.RELIC_ACQUIRED, ({ id }) => this.toast(`Relic acquired: ${RELICS[id]?.name ?? id}`, 'item'));
        bus.on(Events.GATE_OPENED, ({ name, consumed }) => this.toast(
            `${name} opened${consumed.length ? ` (used ${consumed.map((c) => ITEMS[c.id]?.name ?? c.id).join(', ')})` : ''}`, 'path'));
    }
}
