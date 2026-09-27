import { Stage } from './Stage.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { clamp } from '../utils/MathUtils.js';

/**
 * OPEN_FIELD — the player roams a large arena (bigger than the screen, camera
 * follows). Enemies spawn just outside the visible area around the player
 * and close in.
 */
const DIRECTION_ANGLES = { east: 0, south: Math.PI / 2, west: Math.PI, north: -Math.PI / 2 };

export class OpenFieldStage extends Stage {
    static type = 'OPEN_FIELD';
    static defaultRules = { canMove: true, autoCollectPickups: false };

    createWorld() {
        return {
            width: this.environment.width ?? 1800,
            height: this.environment.height ?? 1200,
        };
    }

    getSpawnPosition({ directions } = {}) {
        const { width, height } = GAME_CONFIG.canvas;
        const distance = Math.hypot(width, height) / 2 + 40;
        const angle = directions?.length
            ? DIRECTION_ANGLES[this.rng.pick(directions)] + this.rng.range(-0.6, 0.6)
            : this.rng.angle();
        const p = this.player.pos;
        return {
            x: clamp(p.x + Math.cos(angle) * distance, 20, this.world.width - 20),
            y: clamp(p.y + Math.sin(angle) * distance, 20, this.world.height - 20),
        };
    }
}
