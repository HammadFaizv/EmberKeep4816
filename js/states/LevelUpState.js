import { BaseState } from './BaseState.js';
import { LevelUpUI } from '../ui/LevelUpUI.js';

/**
 * LEVEL_UP — pushed over PLAYING when the stage level rises. Shows 3 cards,
 * applies the chosen one, repeats while level-ups are pending, then pops.
 */
export class LevelUpState extends BaseState {
    enter() {
        this.stage = this.game.stageManager.current;
        this.showOffer();
    }

    cardContext() {
        const { stage } = this;
        return {
            stage,
            player: stage.player,
            spellBook: stage.player.spellBook,
            availableSpells: this.game.spellManager.getAvailableStageSpells(stage.rules),
        };
    }

    showOffer() {
        const { stage } = this;
        const ctx = this.cardContext();
        const cards = this.game.cards.generate(this.game.config.progression.cardChoices, ctx);
        if (cards.length === 0) {
            stage.pendingLevelUps = 0;
            this.game.states.pop();
            return;
        }
        this.ui = this.mount(new LevelUpUI({
            level: stage.levels.level - stage.pendingLevelUps + 1,
            remaining: stage.pendingLevelUps,
            cards,
            onSelect: (card) => {
                this.game.cards.apply(card, ctx);
                stage.pendingLevelUps -= 1;
                this.unmount(this.ui);
                if (stage.pendingLevelUps > 0) this.showOffer();
                else this.game.states.pop();
            },
            reroll: {
                remaining: stage.rerolls,
                onReroll: () => {
                    stage.rerolls -= 1;
                    this.unmount(this.ui);
                    this.showOffer();
                },
            },
        }), 'overlay');
    }
}
