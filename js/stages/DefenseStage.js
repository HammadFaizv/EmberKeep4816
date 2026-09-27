import { Stage } from './Stage.js';

/**
 * DEFENSE — tower-defense style. The doll is rooted at the centre of a
 * single-screen arena; enemies march in from configured directions (north,
 * south, east, west). Pickups fly to the player automatically.
 *
 * TODO: Lanes/paths — add `environment.lanes` (polylines per direction) and a
 * 'followLane' AI behavior so enemies walk set routes instead of straight lines.
 * TODO: Placeable towers/barricades would be new Entity types owned by this
 * stage, targeted by enemies via a 'nearestStructure' AI behavior.
 */
const DIRECTIONS = ['north', 'south', 'east', 'west'];

export class DefenseStage extends Stage {
    static type = 'DEFENSE';
    static defaultRules = { canMove: false, autoCollectPickups: true };

    getSpawnPosition({ directions } = {}) {
        const { width, height } = this.world;
        const side = this.rng.pick(directions?.length ? directions : DIRECTIONS);
        const margin = 30;
        switch (side) {
            case 'north': return { x: this.rng.range(0, width), y: -margin };
            case 'south': return { x: this.rng.range(0, width), y: height + margin };
            case 'east': return { x: width + margin, y: this.rng.range(0, height) };
            default: return { x: -margin, y: this.rng.range(0, height) };
        }
    }

    getBossSpawnPosition() {
        return { x: this.world.width / 2, y: 60 };
    }
}
