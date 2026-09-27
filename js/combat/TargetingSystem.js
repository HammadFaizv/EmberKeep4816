/**
 * TargetingSystem — spatial queries over the stage's enemies.
 *
 * TODO: Replace the linear scans with a uniform-grid spatial hash rebuilt once
 * per tick when enemy counts exceed a few hundred. Callers only use these
 * methods, so the optimisation stays local to this file.
 */
export class TargetingSystem {
    constructor(stage) {
        this.stage = stage;
    }

    get enemies() { return this.stage.enemies; }

    inRadius(pos, radius) {
        return this.enemies.filter((e) => e.targetable && e.pos.distanceSqTo(pos) <= (radius + e.radius) ** 2);
    }

    nearest(pos, range, exclude = null) {
        let best = null;
        let bestD = Infinity;
        for (const e of this.enemies) {
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
