import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { VictoryUI } from '../ui/VictoryUI.js';
import { VICTORY_TEXT } from '../config/storyConfig.js';

/** VICTORY — the final stage is complete. */
export class VictoryState extends BaseState {
    enter() {
        const { stageManager, states } = this.game;
        stageManager.completeCurrent();
        stageManager.unload();
        this.mount(new VictoryUI({
            lines: VICTORY_TEXT,
            onContinue: () => states.change(GameStates.MAP),
        }), 'overlay');
    }

    render() { this.game.renderer.renderAmbientBackground(); }
}
