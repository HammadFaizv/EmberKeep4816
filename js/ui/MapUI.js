import { UIComponent, el, button } from './dom.js';
import { STAGES } from '../config/stageConfig.js';
import { BOSSES } from '../config/bossConfig.js';
import { NPCS } from '../config/npcConfig.js';
import { CompletionConditions } from '../stages/StageRules.js';
import { describeReward } from './StageResultUI.js';

/**
 * MapUI — DOM chrome around the canvas-drawn world map: resource bar,
 * navigation buttons, and an info panel for the selected node.
 * It reads data and reports intents (onActivate, onOpen...), nothing more.
 */
const TYPE_LABELS = { OPEN_FIELD: 'Open Field', DEFENSE: 'Defense', BOSS_ARENA: 'Boss Arena' };
const SHOP_BLURBS = {
    spell_shop: 'The witch sells and refines spells here.',
    relic_shop: 'A hooded merchant trades relics for Souls and boss materials.',
};

export class MapUI extends UIComponent {
    build() {
        this.refs = {};
        return el('div', { class: 'map-ui' }, [
            el('div', { class: 'map-topbar' }, [
                el('div', { class: 'map-title' }, [el('strong', {}, 'The Corrupted North'), el('span', { class: 'muted small' }, ' · Soul #4816')]),
                this.refs.resources = el('div', { class: 'map-resources' }),
                this.refs.nav = el('div', { class: 'map-nav' }),
            ]),
            this.refs.panel = el('div', { class: 'map-panel panel' }),
        ]);
    }

    /** Refreshes resources/nav (cheap; called when entering the map or after changes). */
    refresh({ gold, souls, ngPlus, items, features }) {
        const { onOpen } = this.props;
        this.refs.resources.replaceChildren(...[
            ngPlus ? el('span', { class: 'tag tag-danger', title: 'New Game+ cycle' }, `NG+${ngPlus}`) : null,
            el('span', { class: 'res-gold' }, `● ${gold}`),
            souls || features.relicShop ? el('span', { class: 'res-souls', title: 'Souls — spent at the Relic Merchant' }, `✦ ${souls}`) : null,
            ...items.map((i) => el('span', { class: 'res-item', title: i.description }, `${i.name}${i.count > 1 ? ` ×${i.count}` : ''}`)),
        ].filter(Boolean));
        this.refs.nav.replaceChildren(...[
            features.spellShop ? button('Spell Shop', () => onOpen('SHOP', { shopId: 'spell_shop' }), 'btn btn-small') : null,
            features.relicShop ? button('Relics', () => onOpen('SHOP', { shopId: 'relic_shop' }), 'btn btn-small') : null,
            button('Upgrades', () => onOpen('UPGRADES'), 'btn btn-small'),
            features.pets ? button('Pets', () => onOpen('PETS'), 'btn btn-small') : null,
            button('Menu', () => onOpen('MENU'), 'btn btn-small btn-ghost'),
        ].filter(Boolean));
    }

    showNode(node, lockReasons) {
        const panel = this.refs.panel;
        if (!node) {
            panel.replaceChildren(el('p', { class: 'muted' }, 'Select a location on the map.'));
            return;
        }
        panel.replaceChildren(...this._nodeDetails(node, lockReasons).filter(Boolean));
    }

    _nodeDetails(node, lockReasons) {
        const parts = [el('h3', {}, node.name)];
        const action = (label) => button(label, () => this.props.onActivate(node), 'btn btn-primary');

        if (node.stageId) {
            const def = STAGES[node.stageId];
            const bossId = def.waves.map((w) => w.boss ?? w.miniboss).find(Boolean);
            parts.push(
                el('p', { class: 'map-tags' }, [
                    el('span', { class: 'tag' }, TYPE_LABELS[def.type] ?? def.type),
                    el('span', { class: 'tag tag-danger' }, '☠'.repeat(Math.max(1, Math.min(8, def.difficulty)))),
                    node.optional ? el('span', { class: 'tag' }, 'Optional') : null,
                ]),
                el('p', {}, def.description),
                bossId ? el('p', { class: 'small' }, `Guardian: ${BOSSES[bossId].name}`) : null,
                el('p', { class: 'small muted' }, `Goal: ${(def.completion ?? []).map((c) => CompletionConditions.describe(c)).join(', ')}`),
                el('p', { class: 'small muted' }, `Rewards: ${(def.rewards ?? []).map(describeReward).join(', ') || '—'}`),
            );
            if (node.completed) parts.push(el('p', { class: 'small ok' }, '✓ Cleared — replays grant reduced gold.'));
        } else if (node.npcId) {
            parts.push(el('p', {}, `${NPCS[node.npcId].name} lives here.`));
        } else if (node.shopId) {
            parts.push(el('p', {}, SHOP_BLURBS[node.shopId] ?? 'A merchant waits here.'));
        }

        if (!node.unlocked) {
            parts.push(el('div', { class: 'lock-reasons' }, [
                el('strong', {}, '🔒 Locked'),
                el('ul', {}, lockReasons.map((r) => el('li', {}, r))),
            ]));
        } else if (node.stageId) {
            parts.push(action(node.completed ? 'Replay Stage' : 'Enter Stage'));
        } else if (node.npcId) {
            parts.push(action('Talk'));
        } else if (node.shopId) {
            parts.push(action('Visit Shop'));
        }
        return parts;
    }
}
