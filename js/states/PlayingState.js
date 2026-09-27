import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { Events } from '../core/EventBus.js';
import { StageUI } from '../ui/StageUI.js';
import { SPELLS } from '../config/spellConfig.js';

/**
 * PLAYING — runs the current Stage. Overlays (LEVEL_UP, PAUSED) are pushed on
 * top, which pauses this state's update while it keeps rendering underneath.
 *
 * Transitions are deferred until after the stage update so a state change
 * never happens halfway through a simulation tick.
 */
export class PlayingState extends BaseState {
    enter() {
        const { stageManager, renderer, profile, ui } = this.game;
        this.stage = stageManager.current;
        this.next = null;
        renderer.overlay.reset();
        this.hud = this.mount(new StageUI({
            onPause: () => this.game.states.push(GameStates.PAUSED),
            getGold: () => profile.currency('gold'),
            getSouls: () => profile.currency('souls'),
        }));
        this.subs
            .on(Events.WAVE_STARTED, ({ wave, total, boss }) => {
                renderer.overlay.showBanner(boss ? `${boss}` : `Wave ${wave}`, boss ? 'A guardian approaches' : `of ${total}`);
            })
            .on(Events.BOSS_SPAWNED, ({ boss }) => {
                if (boss.dialogue.intro) renderer.overlay.showDialogue(boss.name, boss.dialogue.intro, 4.5);
            })
            .on(Events.BOSS_PHASE_CHANGED, ({ boss, phase }) => renderer.overlay.showBanner(phase.name, `${boss.name} grows stronger`))
            .on(Events.BOSS_DIALOGUE, ({ speaker, text }) => renderer.overlay.showDialogue(speaker, text))
            .on(Events.BOSS_DEFEATED, ({ boss }) => {
                if (boss.dialogue.defeat) renderer.overlay.showDialogue(boss.name, boss.dialogue.defeat, 3.5);
            })
            .on(Events.BUFF_APPLIED, ({ label, duration }) => ui.toast(`${label} for ${duration}s`, 'spell'))
            .on(Events.BUFF_EXPIRED, ({ label }) => ui.toast(`${label} faded`, 'info'))
            .on(Events.SPELLS_FUSED, ({ spell }) => renderer.overlay.showBanner('Spells Fused', SPELLS[spell.id]?.name ?? spell.name))
            .on(Events.STRUCTURE_DESTROYED, ({ structure }) => ui.toast(`${structure.name} destroyed!`, 'info'))
            .on(Events.STAGE_COMPLETED, () => { this.next = { id: this.stage.isFinal ? GameStates.VICTORY : GameStates.STAGE_COMPLETE }; })
            .on(Events.STAGE_FAILED, () => { this.next = { id: GameStates.STAGE_DEFEAT }; });
        this.onEnter();
    }

    /** Hook for subclasses (FinalBossState). */
    onEnter() {}
    onUpdate(dt) {}

    update(dt) {
        const { input, stageManager, states } = this.game;
        if (input.wasPressed('pause')) {
            states.push(GameStates.PAUSED);
            return;
        }
        stageManager.update(dt);
        this.onUpdate(dt);

        if (this.next) {
            states.change(this.next.id, this.next.params);
            return;
        }
        if (this.stage.pendingLevelUps > 0 && this.stage.status === 'running') states.push(GameStates.LEVEL_UP);
    }

    render() {
        this.game.renderer.renderStage(this.stage);
        this.hud.update(this.stage);
    }
}
