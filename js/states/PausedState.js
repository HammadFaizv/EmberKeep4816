import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { PauseUI } from '../ui/PauseUI.js';

export class PausedState extends BaseState {
    enter() {
        const { states, stageManager } = this.game;
        this.mount(new PauseUI({
            stageName: stageManager.current.name,
            onResume: () => states.pop(),
            onAbandon: () => states.change(GameStates.STAGE_DEFEAT, { abandoned: true }),
        }), 'overlay');
    }

    update() {
        if (this.game.input.wasPressed('pause')) this.game.states.pop();
    }
}
