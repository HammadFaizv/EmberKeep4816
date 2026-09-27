/**
 * SpatialHash — uniform grid for fast "who is near this point?" queries.
 *
 * Rebuilt once per tick from scratch (cheap: one push per entity), then
 * queried many times by spells, projectiles and crowd separation. Entities
 * are bucketed by their centre, so queries pad the search radius by the
 * largest entity radius the caller cares about.
 */
export class SpatialHash {
    constructor(cellSize = 64) {
        this.cellSize = cellSize;
        this.cells = new Map();
        this._result = [];
    }

    _key(cx, cy) { return (cx + 0x8000) * 0x10000 + (cy + 0x8000); }

    rebuild(items) {
        this.cells.clear();
        const size = this.cellSize;
        for (const item of items) {
            const key = this._key(Math.floor(item.pos.x / size), Math.floor(item.pos.y / size));
            let bucket = this.cells.get(key);
            if (!bucket) this.cells.set(key, bucket = []);
            bucket.push(item);
        }
    }

    /**
     * Items whose centre lies in any cell overlapping the query circle.
     * Returns a NEW array (safe to keep); callers do their own exact test.
     */
    query(pos, radius) {
        const size = this.cellSize;
        const minX = Math.floor((pos.x - radius) / size);
        const maxX = Math.floor((pos.x + radius) / size);
        const minY = Math.floor((pos.y - radius) / size);
        const maxY = Math.floor((pos.y + radius) / size);
        const out = [];
        for (let cx = minX; cx <= maxX; cx++) {
            for (let cy = minY; cy <= maxY; cy++) {
                const bucket = this.cells.get(this._key(cx, cy));
                if (bucket) for (const item of bucket) out.push(item);
            }
        }
        return out;
    }
}
