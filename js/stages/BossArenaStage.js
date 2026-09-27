import { OpenFieldStage } from './OpenFieldStage.js';

/**
 * BOSS_ARENA — a compact open field built around a single boss fight.
 * Demonstrates extending an existing stage type: only spawn placement and
 * rules change; everything else is inherited.
 *
 * TODO: Arena hazards (lava pools, closing walls) belong in onUpdate() here,
 * implemented as Hazard entities so CombatSystem resolves their damage.
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
