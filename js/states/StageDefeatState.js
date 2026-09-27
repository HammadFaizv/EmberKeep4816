import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { StageResultUI } from '../ui/StageResultUI.js';

/**
 * STAGE_DEFEAT — the doll fell (or the stage was abandoned). Permanent
 * progress is untouched; the temporary stage is discarded.
 */
export class StageDefeatState extends BaseState {
    enter() {
        const { stageManager, states } = this.game;
        this.stage = stageManager.current;
        const summary = stageManager.failCurrent();
        this.mount(new StageResultUI({
            victory: false,
            summary,
            onRetry: () => states.change(GameStates.STAGE_LOADING, { stageId: summary.stageId }),
            onMap: () => {
                stageManager.unload();
                states.change(GameStates.MAP);
            },
        }), 'overlay');
    }

    render() { this.game.renderer.renderStage(this.stage); }
}
