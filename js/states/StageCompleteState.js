import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { StageResultUI } from '../ui/StageResultUI.js';

/** STAGE_COMPLETE — commits persistent progress, shows the summary, returns to the map. */
export class StageCompleteState extends BaseState {
    enter() {
        const { stageManager, states } = this.game;
        this.stage = stageManager.current;
        const summary = stageManager.completeCurrent();
        this.mount(new StageResultUI({
            victory: true,
            summary,
            onContinue: () => {
                stageManager.unload();
                states.change(GameStates.MAP);
            },
        }), 'overlay');
    }

    render() { this.game.renderer.renderStage(this.stage); }
}
