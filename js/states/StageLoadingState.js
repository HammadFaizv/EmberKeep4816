import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { stageManifest } from '../assets/StageAssets.js';

/**
 * STAGE_LOADING — preloads the stage's assets (procedural sprites, the ground
 * texture, any external sprite sheets listed in the stage's `assets`), showing
 * a progress bar, then builds the Stage via StageManager/StageFactory.
 *
 * TODO: Audio files would join the manifest once an AudioManager exists.
 */
export class StageLoadingState extends BaseState {
    enter({ stageId }) {
        const { stageManager, assets, pets } = this.game;
        this.stageId = stageId;
        this.def = stageManager.getDefinition(stageId);
        this.progress = 0;
        this.ready = false;
        this.token = {};
        const token = this.token;
        assets.load(stageManifest(this.def, { equippedPets: pets.activePets() }), (p) => { this.progress = p; })
            .catch((err) => console.warn('StageLoadingState: asset loading failed', err))
            .finally(() => { if (this.token === token) this.ready = true; });
    }

    update() {
        if (!this.ready) return;
        this.ready = false;
        this.game.stageManager.load(this.stageId);
        this.game.states.change(GameStates.SPELL_SELECT);
    }

    exit() {
        this.token = null;
        super.exit();
    }

    render() {
        const { renderer } = this.game;
        renderer.renderAmbientBackground();
        const { ctx, width, height } = renderer;
        const w = 420;
        const x = (width - w) / 2;
        const y = height / 2 + 20;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd9a0';
        ctx.font = 'bold 30px Georgia, serif';
        ctx.fillText(this.def.name, width / 2, y - 40);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x, y, w, 12);
        ctx.fillStyle = '#e0a045';
        ctx.fillRect(x, y, w * this.progress, 12);
        ctx.strokeStyle = '#5a4632';
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 11);
        ctx.font = 'italic 15px Georgia, serif';
        ctx.fillStyle = '#a8998a';
        ctx.fillText('Stitching the world together…', width / 2, y + 38);
        ctx.restore();
    }
}
