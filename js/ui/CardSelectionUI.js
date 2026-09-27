import { UIComponent, el } from './dom.js';
import { RARITIES } from '../config/cardConfig.js';
import { ELEMENTS } from '../config/elementConfig.js';

/**
 * CardSelectionUI — generic "pick exactly one card" overlay.
 * Used for level-up cards AND the stage-start spell choice. It renders
 * whatever card objects it is given and reports the chosen one; it never
 * decides which cards exist. Keys 1-9 select.
 *
 * Optional `reroll: { remaining, onReroll }` shows a Reroll button (key R);
 * the owning state decides what a reroll does and how many are left.
 */
export class CardSelectionUI extends UIComponent {
    constructor(props) {
        super(props);
        this.chosen = false;
        this._onKey = (e) => {
            if (e.code === 'KeyR') {
                this.reroll();
                return;
            }
            const index = Number(e.key) - 1;
            if (index >= 0 && index < this.props.cards.length) this.choose(this.props.cards[index]);
        };
        window.addEventListener('keydown', this._onKey);
    }

    build() {
        const { title, subtitle, cards } = this.props;
        return el('div', { class: 'card-overlay' }, [
            el('h2', { class: 'card-title' }, title),
            subtitle ? el('p', { class: 'card-subtitle' }, subtitle) : null,
            el('div', { class: 'card-row' }, cards.map((card, i) => this._card(card, i))),
            this.props.reroll ? this._rerollButton() : null,
            el('p', { class: 'card-hint' }, `Choose one · press 1–${cards.length}${this.props.reroll ? ' · R to reroll' : ''}`),
        ]);
    }

    _rerollButton() {
        const { remaining } = this.props.reroll;
        return el('button', {
            class: 'btn card-reroll',
            type: 'button',
            disabled: remaining <= 0,
            onClick: () => this.reroll(),
        }, `↻ Reroll (${remaining} left)`);
    }

    reroll() {
        const reroll = this.props.reroll;
        if (this.chosen || !reroll || reroll.remaining <= 0) return;
        this.chosen = true;
        reroll.onReroll();
    }

    _card(card, index) {
        const rarity = RARITIES[card.rarity] ?? RARITIES.common;
        const element = card.element ? ELEMENTS[card.element] : null;
        return el('button', {
            class: `card card-${card.rarity}`,
            type: 'button',
            style: { '--rarity': rarity.color, '--element': element?.color ?? rarity.color },
            onClick: () => this.choose(card),
        }, [
            el('span', { class: 'card-key' }, String(index + 1)),
            el('span', { class: 'card-rarity' }, `${card.rarity} · ${card.type}`),
            el('span', { class: 'card-sigil' }, element ? element.name[0] : '✧'),
            el('span', { class: 'card-name' }, card.name),
            el('span', { class: 'card-desc' }, card.description),
            card.meta ? el('span', { class: 'card-meta' }, card.meta) : null,
        ]);
    }

    choose(card) {
        if (this.chosen) return;
        this.chosen = true;
        this.props.onSelect(card);
    }

    destroy() {
        window.removeEventListener('keydown', this._onKey);
        super.destroy();
    }
}
