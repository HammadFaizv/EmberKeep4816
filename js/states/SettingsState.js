import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { SettingsUI } from '../ui/SettingsUI.js';

/** Overlay state pushed from the main menu. */
export class SettingsState extends BaseState {
    enter() {
        const { profile, states, unlocks } = this.game;
        this.mount(new SettingsUI({
            settings: profile.data.settings,
            onChange: (key, value) => {
                profile.data.settings[key] = value;
                profile.save();
            },
            onReset: () => {
                profile.reset();
                unlocks.refresh();
                profile.save();
                this.game.session.currentNodeId = null;
                states.change(GameStates.MENU);
                this.game.ui.toast('Save data reset.', 'info');
            },
            onBack: () => states.pop(),
        }), 'overlay');
    }
}
