import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';

/**
 * STAGE_LOADING — builds the Stage via StageManager/StageFactory.
 * TODO: When real assets exist, preload the stage's sprite sheets/audio here
 * (from a `assets` list on the stage definition) and show a progress bar.
 */
export class StageLoadingState extends BaseState {
    enter({ stageId }) {
        this.stageId = stageId;
    }

    update() {
        this.game.stageManager.load(this.stageId);
        this.game.states.change(GameStates.SPELL_SELECT);
    }

    render() { this.game.renderer.clear('#000'); }
}
