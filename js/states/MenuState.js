import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { MainMenu } from '../ui/MainMenu.js';

export class MenuState extends BaseState {
    enter() {
        const { profile, states } = this.game;
        this.mount(new MainMenu({
            hasProgress: profile.data.story.introSeen,
            onPlay: () => states.change(profile.data.story.introSeen ? GameStates.MAP : GameStates.INTRO),
            onSettings: () => states.push(GameStates.SETTINGS),
        }));
    }

    pause() { this._mounted.forEach((c) => c.el.classList.add('hidden')); }
    resume() { this._mounted.forEach((c) => c.el.classList.remove('hidden')); }

    render() { this.game.renderer.renderAmbientBackground(); }
}
