import { OpenFieldStage } from './OpenFieldStage.js';

/**
 * BOSS_ARENA — a compact open field built around a single boss fight.
 * Demonstrates extending an existing stage type: only spawn placement and
 * rules change; everything else is inherited.
 *
 * Arena hazards (lava pools, a closing ring of fire) are data-driven:
 * `environment.hazards` on the stage, or `arenaHazard` phase events on the
 * boss (the Demon Lord floods the summit with lava in his second phase).
 * See stages/ArenaHazards.js; damage always goes through Hazard entities.
 */
export class BossArenaStage extends OpenFieldStage {
    static type = 'BOSS_ARENA';
    static defaultRules = { canMove: true, autoCollectPickups: true, completionDelay: 2.5 };

    getPlayerStart() {
        return { x: this.world.width / 2, y: this.world.height * 0.8 };
    }

    getBossSpawnPosition() {
        return { x: this.world.width / 2, y: this.world.height * 0.25 };
    }
}
