import { PlayingState } from './PlayingState.js';
import { Events } from '../core/EventBus.js';

/**
 * FINAL_BOSS — the last stage. Plays exactly like PLAYING (same Stage
 * machinery) with its own presentation: cinematic letterbox bars while the
 * Demon Lord speaks (entrance and every phase change), an opening banner, and
 * routing to VICTORY on completion (handled by PlayingState via stage.isFinal).
 *
 * TODO: A unique music track belongs here once an AudioManager exists.
 */
const CINEMATIC_TIME = 3.2;

export class FinalBossState extends PlayingState {
    onEnter() {
        const { overlay } = this.game.renderer;
        overlay.showBanner('The Summit', 'Every soul before you fell here.', 3);
        this.cinematic = CINEMATIC_TIME;
        overlay.setLetterbox(true);
        this.subs
            .on(Events.BOSS_SPAWNED, () => this.playCinematic())
            .on(Events.BOSS_PHASE_CHANGED, () => this.playCinematic())
            .on(Events.BOSS_DEFEATED, () => this.playCinematic());
    }

    playCinematic() {
        this.cinematic = CINEMATIC_TIME;
        this.game.renderer.overlay.setLetterbox(true);
    }

    onUpdate(dt) {
        if (this.cinematic <= 0) return;
        this.cinematic -= dt;
        if (this.cinematic <= 0) this.game.renderer.overlay.setLetterbox(false);
    }

    exit() {
        this.game.renderer.overlay.setLetterbox(false);
        super.exit();
    }
}
