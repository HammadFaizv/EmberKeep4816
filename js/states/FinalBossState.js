import { PlayingState } from './PlayingState.js';

/**
 * FINAL_BOSS — the last stage. Plays exactly like PLAYING (same Stage
 * machinery) but has its own state so the finale can diverge: music, UI
 * framing, and routing to VICTORY on completion.
 *
 * TODO: Final-boss presentation (letterbox bars, unique music track, dialogue
 * with the Demon Lord between phases on BOSS_PHASE_CHANGED) belongs here.
 */
export class FinalBossState extends PlayingState {
    onEnter() {
        this.game.renderer.overlay.showBanner('The Summit', 'Every soul before you fell here.', 3);
    }
}
