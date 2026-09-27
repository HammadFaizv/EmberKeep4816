import { Random } from '../utils/Random.js';

/**
 * TextureFactory — procedural, seamlessly tiling ground textures.
 *
 * Each stage environment ({ theme, ground, accent }) gets a pixel-art tile:
 * periodic value noise blends the ground and accent colours, speckles add
 * grit, and a theme painter adds details (grass blades, cracks, puddles,
 * bones). Tiles are cached per environment and returned as CanvasPatterns.
 */
const TILE = 96;       // logical pixels per tile edge
const PIXEL = 2;       // each logical pixel is drawn as a 2×2 block

export class TextureFactory {
    constructor() {
        this.cache = new Map();
        this.detailPainters = new Map(Object.entries(DETAILS));
    }

    registerDetail(theme, painter) { this.detailPainters.set(theme, painter); }

    key(env) { return `${env.theme}|${env.ground}|${env.accent}`; }
    isBuilt(env) { return this.cache.has(this.key(env)); }

    /** Returns { canvas, pattern } for an environment (built once). */
    get(env, ctx) {
        const key = this.key(env);
        let tex = this.cache.get(key);
        if (!tex) {
            const canvas = this.build(env);
            tex = { canvas, pattern: ctx?.createPattern(canvas, 'repeat') ?? null };
            this.cache.set(key, tex);
        } else if (!tex.pattern && ctx) {
            tex.pattern = ctx.createPattern(tex.canvas, 'repeat');
        }
        return tex;
    }

    build(env) {
        const rng = new Random([...this.key(env)].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 17));
        const small = document.createElement('canvas');
        small.width = TILE;
        small.height = TILE;
        const ctx = small.getContext('2d');
        const ground = hexToRgb(env.ground ?? '#2a2a2a');
        const accent = hexToRgb(env.accent ?? '#333333');
        const noise = periodicNoise(rng, 6, TILE);
        const img = ctx.createImageData(TILE, TILE);
        for (let y = 0; y < TILE; y++) {
            for (let x = 0; x < TILE; x++) {
                // Posterise the noise into 3 bands for a pixel-art look.
                const n = Math.round(noise(x, y) * 3) / 3;
                const grit = rng.chance(0.06) ? (rng.chance(0.5) ? 14 : -14) : 0;
                const i = (y * TILE + x) * 4;
                img.data[i] = clampByte(ground.r + (accent.r - ground.r) * n + grit);
                img.data[i + 1] = clampByte(ground.g + (accent.g - ground.g) * n + grit);
                img.data[i + 2] = clampByte(ground.b + (accent.b - ground.b) * n + grit);
                img.data[i + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
        this.detailPainters.get(env.theme)?.(ctx, rng, TILE);

        const canvas = document.createElement('canvas');
        canvas.width = TILE * PIXEL;
        canvas.height = TILE * PIXEL;
        const big = canvas.getContext('2d');
        big.imageSmoothingEnabled = false;
        big.drawImage(small, 0, 0, canvas.width, canvas.height);
        return canvas;
    }
}

/** Value noise on a lattice that wraps every `size` pixels (seamless tiling). */
function periodicNoise(rng, cells, size) {
    const grid = Array.from({ length: cells }, () => Array.from({ length: cells }, () => rng.next()));
    const smooth = (t) => t * t * (3 - 2 * t);
    return (x, y) => {
        const fx = (x / size) * cells;
        const fy = (y / size) * cells;
        const x0 = Math.floor(fx) % cells;
        const y0 = Math.floor(fy) % cells;
        const x1 = (x0 + 1) % cells;
        const y1 = (y0 + 1) % cells;
        const tx = smooth(fx - Math.floor(fx));
        const ty = smooth(fy - Math.floor(fy));
        const a = grid[y0][x0] + (grid[y0][x1] - grid[y0][x0]) * tx;
        const b = grid[y1][x0] + (grid[y1][x1] - grid[y1][x0]) * tx;
        return a + (b - a) * ty;
    };
}

function hexToRgb(hex) {
    const v = parseInt(hex.replace('#', ''), 16);
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

const clampByte = (v) => Math.max(0, Math.min(255, Math.round(v)));

/** Small pixel details per theme, drawn on the 1× tile (wrapped at edges). */
function dots(ctx, rng, size, count, colors, w = 1, h = 1) {
    for (let i = 0; i < count; i++) {
        ctx.fillStyle = rng.pick(colors);
        ctx.fillRect(Math.floor(rng.range(0, size)), Math.floor(rng.range(0, size)), w, h);
    }
}

function blades(ctx, rng, size, count, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
        const x = Math.floor(rng.range(0, size - 3));
        const y = Math.floor(rng.range(3, size));
        ctx.fillRect(x, y - 2, 1, 2);
        ctx.fillRect(x + 2, y - 3, 1, 3);
        ctx.fillRect(x + 1, y - 1, 1, 1);
    }
}

function cracks(ctx, rng, size, count, color) {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
        let x = Math.floor(rng.range(0, size));
        let y = Math.floor(rng.range(0, size));
        for (let s = 0; s < 10; s++) {
            ctx.fillRect(((x % size) + size) % size, ((y % size) + size) % size, 1, 1);
            x += rng.pick([-1, 0, 1, 1]);
            y += rng.pick([-1, 0, 1]);
        }
    }
}

const DETAILS = {
    meadow: (c, r, s) => { blades(c, r, s, 28, 'rgba(140,190,100,0.55)'); dots(c, r, s, 10, ['#e8d27a', '#c9a0dc']); },
    fields: (c, r, s) => { blades(c, r, s, 40, 'rgba(170,180,90,0.5)'); },
    forest: (c, r, s) => { blades(c, r, s, 18, 'rgba(70,120,70,0.6)'); dots(c, r, s, 14, ['rgba(60,40,20,0.6)'], 2, 1); },
    graveyard: (c, r, s) => { dots(c, r, s, 30, ['rgba(120,120,140,0.35)', 'rgba(20,20,30,0.4)'], 2, 1); },
    river: (c, r, s) => { dots(c, r, s, 30, ['rgba(120,160,190,0.35)'], 3, 1); },
    marsh: (c, r, s) => { dots(c, r, s, 12, ['rgba(40,70,60,0.6)'], 4, 2); blades(c, r, s, 14, 'rgba(150,160,80,0.5)'); },
    ruins: (c, r, s) => { cracks(c, r, s, 5, 'rgba(20,16,14,0.5)'); dots(c, r, s, 16, ['rgba(160,150,140,0.35)'], 2, 2); },
    fortress: (c, r, s) => {
        c.fillStyle = 'rgba(0,0,0,0.22)';
        for (let y = 0; y < s; y += 12) {
            c.fillRect(0, y, s, 1);
            for (let x = (y / 12) % 2 ? 0 : 12; x < s; x += 24) c.fillRect(x, y, 1, 12);
        }
    },
    village: (c, r, s) => { dots(c, r, s, 20, ['rgba(40,70,90,0.45)'], 3, 2); },
    gate: (c, r, s) => { cracks(c, r, s, 6, 'rgba(15,12,10,0.5)'); },
    deadlands: (c, r, s) => { cracks(c, r, s, 8, 'rgba(20,14,10,0.5)'); dots(c, r, s, 8, ['rgba(220,210,190,0.35)'], 2, 1); },
    wastes: (c, r, s) => { dots(c, r, s, 24, ['rgba(180,160,255,0.18)', 'rgba(10,8,20,0.4)'], 2, 2); },
    pass: (c, r, s) => { cracks(c, r, s, 8, 'rgba(15,8,6,0.55)'); },
    lava: (c, r, s) => { cracks(c, r, s, 10, 'rgba(255,100,30,0.55)'); dots(c, r, s, 10, ['rgba(255,170,60,0.5)']); },
    summit: (c, r, s) => { cracks(c, r, s, 12, 'rgba(255,80,20,0.6)'); dots(c, r, s, 12, ['rgba(255,200,80,0.45)']); },
};
