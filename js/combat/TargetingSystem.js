import { SpatialHash } from '../utils/SpatialHash.js';

/**
 * TargetingSystem — spatial queries over the stage's enemies.
 *
 * Backed by a SpatialHash rebuilt once per tick (Stage.update calls rebuild()
 * after enemies move), so spells, projectiles and hazards query only nearby
 * cells instead of scanning every enemy. Enemies spawned mid-tick are kept in
 * a small "fresh" list until the next rebuild so they are never invisible.
 */
const MAX_RADIUS = 50; // largest enemy radius considered by queries

export class TargetingSystem {
    constructor(stage, cellSize = 96) {
        this.stage = stage;
        this.hash = new SpatialHash(cellSize);
        this.fresh = [];
    }

    get enemies() { return this.stage.enemies; }

    rebuild() {
        this.hash.rebuild(this.stage.enemies);
        this.fresh = [];
    }

    /** Called by Stage.spawnEnemy so new enemies are targetable before the next rebuild. */
    track(enemy) { this.fresh.push(enemy); }

    /** Broad phase: enemies whose centre is roughly within `radius` of pos. */
    query(pos, radius) {
        const found = this.hash.query(pos, radius);
        for (const e of this.fresh) found.push(e);
        return found;
    }

    inRadius(pos, radius) {
        return this.query(pos, radius + MAX_RADIUS)
            .filter((e) => e.targetable && e.pos.distanceSqTo(pos) <= (radius + e.radius) ** 2);
    }

    nearest(pos, range, exclude = null) {
        let best = null;
        let bestD = Infinity;
        for (const e of this.query(pos, range + MAX_RADIUS)) {
            if (!e.targetable || exclude?.has(e.id)) continue;
            const d = e.pos.distanceSqTo(pos);
            if (d < bestD && d <= (range + e.radius) ** 2) {
                best = e;
                bestD = d;
            }
        }
        return best;
    }

    /** Enemies within range sorted by a comparator, capped at `count`. */
    sorted(pos, range, count, compare) {
        return this.inRadius(pos, range).sort(compare).slice(0, count);
    }
}
