import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { CardSelectionUI } from '../ui/CardSelectionUI.js';

/**
 * SPELL_SELECT — at the start of every stage, offer 3 unlocked spells; the
 * chosen one enters the stage loadout (SpellBook).
 */
export class SpellSelectState extends BaseState {
    enter() {
        const { stageManager, states } = this.game;
        const stage = stageManager.current;
        this.stage = stage;
        this.next = () => states.change(stage.isFinal ? GameStates.FINAL_BOSS : GameStates.PLAYING);
        this.showOffer();
    }

    /** Rerolls here spend the same per-run pool as level-up cards (stage.rerolls). */
    showOffer() {
        const { stage } = this;
        const offers = this.game.spellManager.generateStageOffer(this.game.config.progression.spellChoicesAtStageStart, stage.player.spellBook, stage.rules);
        if (offers.length === 0) {
            this.skip = this.next;
            return;
        }
        // Rerolling only makes sense when there are more spells than slots on offer.
        const canReroll = this.game.spellManager.getAvailableStageSpells(stage.rules).length > offers.length;
        this.ui = this.mount(new CardSelectionUI({
            title: 'Choose Your Spell',
            subtitle: `${stage.name} — ${stage.description}`,
            cards: offers,
            onSelect: (card) => {
                stage.player.spellBook.addSpell(card.spellId);
                this.next();
            },
            reroll: canReroll ? {
                remaining: stage.rerolls,
                onReroll: () => {
                    stage.rerolls -= 1;
                    this.unmount(this.ui);
                    this.showOffer();
                },
            } : null,
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
