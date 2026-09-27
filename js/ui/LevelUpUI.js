import { CardSelectionUI } from './CardSelectionUI.js';

/** LevelUpUI — the level-up variant of the card picker. */
export class LevelUpUI extends CardSelectionUI {
    constructor({ level, remaining, cards, onSelect, reroll }) {
        super({
            title: `Level ${level}!`,
            subtitle: remaining > 1 ? `${remaining} level-ups to spend` : 'The doll grows stronger. Choose a boon for this stage.',
            cards,
            onSelect,
            reroll,
        });
        this.el.classList.add('level-up');
    }
}
