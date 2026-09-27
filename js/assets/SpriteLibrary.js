import { buildSprite } from './PixelArt.js';
import { SPRITES } from './spriteData.js';

/**
 * SpriteLibrary — builds pixel-art sprites on demand and caches them.
 *
 * get(key) builds lazily, so nothing breaks if a stage forgets to preload;
 * AssetLoader preloads a stage's sprites up front to avoid first-use hitches.
 * register(key, def) adds sprites at runtime (mods, future content packs), and
 * registerImage(key, image, frames) wraps an external sprite sheet so painted
 * PNG art can replace any procedural sprite without touching the renderer.
 */
export class SpriteLibrary {
    constructor(definitions = SPRITES) {
        this.definitions = new Map(Object.entries(definitions));
        this.cache = new Map();
    }

    has(key) { return this.cache.has(key) || this.definitions.has(key); }
    isBuilt(key) { return this.cache.has(key); }
    keys() { return [...this.definitions.keys()]; }

    register(key, def) {
        this.definitions.set(key, def);
        this.cache.delete(key);
    }

    /** Uses a loaded image (horizontal strip of `frames` equal cells) as a sprite. */
    registerImage(key, image, { frames = 1, fps = 0, fit = 1.3, anchorY = 0.55 } = {}) {
        const w = image.width / frames;
        const cells = Array.from({ length: frames }, (_, i) => {
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = image.height;
            canvas.getContext('2d').drawImage(image, i * w, 0, w, image.height, 0, 0, w, image.height);
            return { canvas, flash: canvas, frost: canvas };
        });
        this.cache.set(key, { frames: cells, width: w, height: image.height, fps, fit, anchorY });
    }

    get(key) {
        if (!key) return null;
        let sprite = this.cache.get(key);
        if (!sprite && this.definitions.has(key)) {
            sprite = buildSprite(this.definitions.get(key));
            this.cache.set(key, sprite);
        }
        return sprite ?? null;
    }
}
