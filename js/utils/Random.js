/**
 * Random — seedable PRNG (mulberry32) plus common helpers.
 *
 * Gameplay code should use an injected Random instance instead of Math.random
 * so that runs can later be made reproducible (daily seeds, replays, tests).
 */
export class Random {
    constructor(seed = Date.now()) {
        this.seed(seed);
    }

    seed(seed) {
        this._state = seed >>> 0;
    }

    /** Float in [0, 1). */
    next() {
        let t = (this._state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    range(min, max) { return min + this.next() * (max - min); }
    int(min, max) { return Math.floor(this.range(min, max + 1)); }
    chance(probability) { return this.next() < probability; }
    pick(array) { return array[Math.floor(this.next() * array.length)]; }
    angle() { return this.next() * Math.PI * 2; }

    shuffle(array) {
        const a = [...array];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /**
     * Picks up to `count` distinct items, weighted by weightFn(item).
     * Used by card and spell offers.
     */
    weightedSample(items, count, weightFn = () => 1) {
        const pool = [...items];
        const result = [];
        while (result.length < count && pool.length > 0) {
            const total = pool.reduce((sum, item) => sum + weightFn(item), 0);
            let roll = this.next() * total;
            let index = 0;
            for (; index < pool.length - 1; index++) {
                roll -= weightFn(pool[index]);
                if (roll < 0) break;
            }
            result.push(pool.splice(index, 1)[0]);
        }
        return result;
    }
}
