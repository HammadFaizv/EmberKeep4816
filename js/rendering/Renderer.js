import { clamp } from '../utils/MathUtils.js';
import { EntityRenderer } from './EntityRenderer.js';
import { SpellRenderer } from './SpellRenderer.js';
import { EffectsRenderer } from './EffectsRenderer.js';
import { UIOverlayRenderer } from './UIOverlayRenderer.js';
import { StageRenderer } from './StageRenderer.js';
import { MapRenderer } from './MapRenderer.js';
import { SpriteLibrary } from '../assets/SpriteLibrary.js';
import { TextureFactory } from '../assets/TextureFactory.js';

/**
 * Renderer — owns the canvas context and camera, and composes the
 * specialised renderers. Rendering READS game state and never changes it.
 *
 * Art: entities with a `render.sprite` key are drawn from the SpriteLibrary
 * (procedural pixel art, or loaded sprite sheets); everything else falls back
 * to the shape painters in EntityRenderer/SpellRenderer/EffectsRenderer.
 * Ground textures come from the TextureFactory. No gameplay file changes when
 * art changes.
 */
export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false; // crisp pixel art
        this.width = canvas.width;
        this.height = canvas.height;
        this.camera = { x: 0, y: 0 };
        this.time = 0;

        this.sprites = new SpriteLibrary();
        this.textures = new TextureFactory();
        this.entities = new EntityRenderer(this.sprites);
        this.spells = new SpellRenderer();
        this.effects = new EffectsRenderer();
        this.overlay = new UIOverlayRenderer(this);
        this.stage = new StageRenderer(this);
        this.map = new MapRenderer(this);
        this._embers = Array.from({ length: 60 }, () => this._newEmber(true));
    }

    beginFrame(dt) { this.time += dt; }

    clear(color = '#0b0a10') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /** Centres the camera on a target, clamped to world bounds (centred if the world is smaller). */
    followCamera(target, world) {
        this.camera.x = world.width <= this.width
            ? (world.width - this.width) / 2
            : clamp(target.x - this.width / 2, 0, world.width - this.width);
        this.camera.y = world.height <= this.height
            ? (world.height - this.height) / 2
            : clamp(target.y - this.height / 2, 0, world.height - this.height);
    }

    withCamera(fn) {
        const { ctx } = this;
        ctx.save();
        ctx.translate(-Math.round(this.camera.x), -Math.round(this.camera.y));
        fn(ctx);
        ctx.restore();
    }

    worldToScreen(pos) {
        return { x: pos.x - this.camera.x, y: pos.y - this.camera.y };
    }

    renderStage(stage) { this.stage.render(stage); }
    renderMap(worldMap, view) { this.map.render(worldMap, view); }

    /** Drifting embers used behind menus and story screens. */
    renderAmbientBackground(dt = 1 / 60) {
        const { ctx } = this;
        const g = ctx.createLinearGradient(0, 0, 0, this.height);
        g.addColorStop(0, '#0d0b14');
        g.addColorStop(1, '#2a0f0a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.width, this.height);
        for (const e of this._embers) {
            e.y -= e.speed * dt;
            e.x += Math.sin(this.time * e.wobble + e.seed) * 12 * dt;
            if (e.y < -10) Object.assign(e, this._newEmber(false));
            ctx.globalAlpha = e.alpha * (0.6 + 0.4 * Math.sin(this.time * 3 + e.seed));
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    _newEmber(anywhere) {
        return {
            x: Math.random() * this.width,
            y: anywhere ? Math.random() * this.height : this.height + 10,
            size: 1 + Math.random() * 2.5,
            speed: 15 + Math.random() * 45,
            wobble: 0.5 + Math.random() * 2,
            seed: Math.random() * 100,
            alpha: 0.3 + Math.random() * 0.6,
            color: Math.random() < 0.7 ? '#ff8a3d' : '#ffd27a',
        };
    }
}
