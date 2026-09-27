import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { StoryScreen } from '../ui/StoryScreen.js';
import { INTRO_PAGES } from '../config/storyConfig.js';

export class IntroState extends BaseState {
    enter() {
        this.mount(new StoryScreen({
            pages: INTRO_PAGES,
            onDone: () => {
                if (this.done) return;
                this.done = true;
                this.game.profile.data.story.introSeen = true;
                this.game.profile.save();
                this.game.states.change(GameStates.MAP);
            },
        }));
        this.done = false;
    }

    render() { this.game.renderer.renderAmbientBackground(); }
}
