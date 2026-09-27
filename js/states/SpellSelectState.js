import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { CardSelectionUI } from '../ui/CardSelectionUI.js';

/**
 * SPELL_SELECT — at the start of every stage, offer 3 unlocked spells; the
 * chosen one enters the stage loadout (SpellBook).
 */
export class SpellSelectState extends BaseState {
    enter() {
        const { stageManager, spellManager, states } = this.game;
        const stage = stageManager.current;
        this.stage = stage;
        const offers = spellManager.generateStageOffer(this.game.config.progression.spellChoicesAtStageStart, stage.player.spellBook, stage.rules);
        const next = () => states.change(stage.isFinal ? GameStates.FINAL_BOSS : GameStates.PLAYING);
        if (offers.length === 0) {
            this.skip = next;
            return;
        }
        this.mount(new CardSelectionUI({
            title: 'Choose Your Spell',
            subtitle: `${stage.name} — ${stage.description}`,
            cards: offers,
            onSelect: (card) => {
                stage.player.spellBook.addSpell(card.spellId);
                next();
            },
        }), 'overlay');
    }

    update() {
        if (this.skip) {
            const skip = this.skip;
            this.skip = null;
            skip();
        }
    }

    render() { this.game.renderer.renderStage(this.stage); }
}
