import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { Events } from '../core/EventBus.js';
import { SettingsUI } from '../ui/SettingsUI.js';

/** Overlay state pushed from the main menu. */
export class SettingsState extends BaseState {
    enter() {
        const { profile, states, unlocks, input, bus } = this.game;
        const settings = profile.data.settings;
        this.mount(new SettingsUI({
            settings,
            bindings: () => input.bindings,
            onChange: (key, value) => {
                settings[key] = value;
                profile.save();
                bus.emit(Events.SETTINGS_CHANGED, { key, value });
            },
            onRebind: (action, code) => {
                // A key can only drive one action: drop it from any other override.
                for (const [other, keys] of Object.entries(settings.keyBindings)) {
                    if (other !== action) settings.keyBindings[other] = keys.filter((k) => k !== code);
                }
                settings.keyBindings[action] = [code];
                input.setBindings(settings.keyBindings);
                profile.save();
            },
            onResetBindings: () => {
                settings.keyBindings = {};
                input.setBindings({});
                profile.save();
            },
            onReset: () => {
                profile.reset();
                input.setBindings(profile.data.settings.keyBindings);
                this.game.worldMap.reset();
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
