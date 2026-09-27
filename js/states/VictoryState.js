import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { VictoryUI } from '../ui/VictoryUI.js';
import { VICTORY_TEXT } from '../config/storyConfig.js';

/** VICTORY — the final stage is complete. Offers New Game+. */
export class VictoryState extends BaseState {
    enter() {
        const { stageManager, states, profile, newGamePlus, session } = this.game;
        stageManager.completeCurrent();
        stageManager.unload();
        profile.data.story.cleared = true;
        profile.save();
        this.mount(new VictoryUI({
            lines: VICTORY_TEXT,
            nextCycle: newGamePlus.level + 1,
            onContinue: () => states.change(GameStates.MAP),
            onNewGamePlus: () => {
                newGamePlus.start();
                session.currentNodeId = null;
                states.change(GameStates.MAP);
                this.game.ui.toast(`New Game+${newGamePlus.level} begins. The north grows darker.`, 'path');
            },
        }), 'overlay');
    }

    render() { this.game.renderer.renderAmbientBackground(); }
}
