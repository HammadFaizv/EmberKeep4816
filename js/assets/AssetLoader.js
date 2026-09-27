/**
 * AssetLoader — prepares everything a stage needs before it starts.
 *
 * A manifest lists work of three kinds:
 *   sprites   procedural sprite keys (SpriteLibrary)
 *   textures  environments whose ground texture must be generated (TextureFactory)
 *   images    { key, url, frames?, fps? } external sprite sheets; once loaded
 *             they are registered in the SpriteLibrary under `key`, replacing
 *             the procedural sprite of the same name
 *
 * load() yields to the browser between tasks and reports progress (0..1), so
 * StageLoadingState can draw a progress bar. Failed images log a warning and
 * fall back to the procedural sprite instead of blocking the stage.
 */
export class AssetLoader {
    constructor({ sprites, textures, ctx }) {
        this.sprites = sprites;
        this.textures = textures;
        this.ctx = ctx;
        this.images = new Map();
    }

    async load(manifest, onProgress = () => {}) {
        const tasks = [
            ...(manifest.sprites ?? []).filter((k) => !this.sprites.isBuilt(k)).map((k) => () => this.sprites.get(k)),
            ...(manifest.textures ?? []).filter((env) => !this.textures.isBuilt(env)).map((env) => () => this.textures.get(env, this.ctx)),
            ...(manifest.images ?? []).map((img) => () => this.loadImage(img.url).then(
                (image) => this.sprites.registerImage(img.key, image, img),
                (err) => console.warn(`AssetLoader: could not load ${img.url}`, err),
            )),
        ];
        let done = 0;
        onProgress(tasks.length ? 0 : 1);
        for (const task of tasks) {
            await task();
            done += 1;
            onProgress(done / tasks.length);
            await nextFrame();
        }
    }

    loadImage(url) {
        if (this.images.has(url)) return this.images.get(url);
        const promise = new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
        });
        this.images.set(url, promise);
        return promise;
    }
}

const nextFrame = () => new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 0);
});
