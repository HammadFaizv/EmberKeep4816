import { Random } from '../utils/Random.js';

/**
 * StageRenderer — draws a Stage: backdrop, entities, projectiles, effects,
 * then the screen-space overlay.
 *
 * Backdrops are registered per stage TYPE (tower platform for DEFENSE, etc.)
 * and decorations per environment THEME, so a new stage type or biome adds a
 * painter instead of editing this render loop.
 */
const TAU = Math.PI * 2;

const THEME_DECOR = {
    meadow: ['tuft', 'tuft', 'stone', 'flower'],
    fields: ['tuft', 'tuft', 'tuft', 'flower'],
    graveyard: ['grave', 'grave', 'stone', 'tuft'],
    forest: ['tree', 'tree', 'tuft', 'stone'],
    river: ['stone', 'tuft', 'reed'],
    marsh: ['reed', 'reed', 'puddle', 'tuft'],
    ruins: ['pillar', 'stone', 'stone', 'tuft'],
    fortress: ['pillar', 'grave', 'stone'],
    village: ['puddle', 'stone', 'reed'],
    gate: ['pillar', 'stone'],
    deadlands: ['bones', 'stone', 'bones'],
    wastes: ['wisp', 'stone', 'bones'],
    pass: ['stone', 'stone', 'crack'],
    lava: ['crack', 'crack', 'stone'],
    summit: ['crack', 'crack', 'stone'],
};

export class StageRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.backdrops = new Map(Object.entries(DEFAULT_BACKDROPS));
        this.decorPainters = new Map(Object.entries(DECOR_PAINTERS));
        this._decorCache = new Map();
    }

    registerBackdrop(stageType, painter) { this.backdrops.set(stageType, painter); }
    registerDecor(kind, painter) { this.decorPainters.set(kind, painter); }

    render(stage) {
        const r = this.renderer;
        const { ctx, time } = r;
        r.clear('#050507');
        r.followCamera(stage.player.pos, stage.world);

        r.withCamera(() => {
            this._drawGround(ctx, stage);
            (this.backdrops.get(stage.type) ?? this.backdrops.get('default'))(ctx, stage, time);
            this._drawObjective(ctx, stage, time);

            for (const p of stage.pickups) r.entities.draw(ctx, p, time);
            for (const e of stage.enemies) if (e.telegraph) this._drawTelegraph(ctx, e);

            const actors = [...stage.enemies, ...stage.pets, stage.player].sort((a, b) => a.pos.y - b.pos.y);
            for (const a of actors) r.entities.draw(ctx, a, time);
            for (const e of stage.enemies) r.entities.drawHealthBar(ctx, e);

            for (const p of stage.projectiles) r.spells.draw(ctx, p, time);
            for (const e of stage.effects) r.effects.draw(ctx, e, time);
        });

        r.overlay.render(stage);
    }

    _drawGround(ctx, stage) {
        const { width, height } = stage.world;
        const env = stage.environment;
        ctx.fillStyle = env.ground ?? '#2a2a2a';
        ctx.fillRect(0, 0, width, height);

        // Soft tiles to give a sense of motion when the camera moves.
        ctx.fillStyle = env.accent ?? '#333';
        const tile = 80;
        for (let x = 0; x < width; x += tile) {
            for (let y = (x / tile) % 2 ? 0 : tile; y < height; y += tile * 2) {
                ctx.globalAlpha = 0.25;
                ctx.fillRect(x, y, tile, tile);
            }
        }
        ctx.globalAlpha = 1;

        for (const d of this._decor(stage)) this.decorPainters.get(d.kind)?.(ctx, d, env);

        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 6;
        ctx.strokeRect(0, 0, width, height);
    }

    /** Deterministic decoration scatter per stage (seeded by stage id). */
    _decor(stage) {
        if (this._decorCache.has(stage.id)) return this._decorCache.get(stage.id);
        const seed = [...stage.id].reduce((s, c) => s * 31 + c.charCodeAt(0), 7);
        const rng = new Random(seed);
        const kinds = THEME_DECOR[stage.environment.theme] ?? ['stone'];
        const count = Math.round((stage.world.width * stage.world.height) / 14000);
        const list = Array.from({ length: count }, () => ({
            kind: rng.pick(kinds),
            x: rng.range(0, stage.world.width),
            y: rng.range(0, stage.world.height),
            size: rng.range(0.7, 1.4),
            seed: rng.next(),
        }));
        this._decorCache.set(stage.id, list);
        return list;
    }

    _drawObjective(ctx, stage, time) {
        const obj = stage.environment.objective;
        if (!obj) return;
        const pulse = 1 + Math.sin(time * 3) * 0.08;
        ctx.strokeStyle = '#7fe3ff';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.radius * pulse, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(127,227,255,0.15)';
        ctx.fill();
        ctx.fillStyle = '#d8f6ff';
        ctx.font = 'bold 16px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(obj.label ?? 'Objective', obj.x, obj.y - obj.radius - 10);
    }

    _drawTelegraph(ctx, boss) {
        const t = boss.telegraph;
        ctx.save();
        ctx.globalAlpha = 0.25 + t.progress * 0.35;
        ctx.strokeStyle = t.special ? '#ffcc33' : '#ff3b3b';
        ctx.fillStyle = t.special ? 'rgba(255,204,51,0.12)' : 'rgba(255,59,59,0.15)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(boss.pos.x, boss.pos.y, t.radius * (t.special ? 0.6 + t.progress * 0.8 : 1), 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(boss.pos.x, boss.pos.y, t.radius * t.progress, 0, TAU);
        ctx.stroke();
        ctx.restore();
    }
}

const DEFAULT_BACKDROPS = {
    default() {},

    /** DEFENSE: radial approach paths and the tower platform the doll stands on. */
    DEFENSE(ctx, stage, time) {
        const c = stage.player.pos;
        const { width, height } = stage.world;
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 60;
        ctx.lineCap = 'round';
        for (const [x, y] of [[c.x, 0], [c.x, height], [0, c.y], [width, c.y]]) {
            ctx.beginPath();
            ctx.moveTo(c.x, c.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        ctx.lineCap = 'butt';
        // tower platform
        ctx.fillStyle = '#4a4038';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 48, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = '#6d6052';
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU;
            ctx.strokeRect(c.x + Math.cos(a) * 44 - 5, c.y + Math.sin(a) * 44 - 5, 10, 10);
        }
        ctx.strokeStyle = `rgba(140,190,255,${0.25 + Math.sin(time * 2) * 0.1})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 36, 0, TAU);
        ctx.stroke();
    },

    BOSS_ARENA(ctx, stage, time) {
        const { width, height } = stage.world;
        ctx.strokeStyle = `rgba(255,80,30,${0.25 + Math.sin(time * 1.5) * 0.1})`;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2, width * 0.45, height * 0.42, 0, 0, TAU);
        ctx.stroke();
    },
};

const DECOR_PAINTERS = {
    tuft(ctx, d) {
        ctx.strokeStyle = 'rgba(120,160,90,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = -1; i <= 1; i++) {
            ctx.moveTo(d.x + i * 3, d.y);
            ctx.lineTo(d.x + i * 5, d.y - 8 * d.size);
        }
        ctx.stroke();
    },
    flower(ctx, d) {
        ctx.fillStyle = d.seed > 0.5 ? '#c9a0dc' : '#e8d27a';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 2.5 * d.size, 0, TAU);
        ctx.fill();
    },
    stone(ctx, d) {
        ctx.fillStyle = 'rgba(90,90,100,0.6)';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 9 * d.size, 6 * d.size, d.seed * 3, 0, TAU);
        ctx.fill();
    },
    grave(ctx, d) {
        ctx.fillStyle = '#4a4d57';
        const w = 16 * d.size;
        const h = 22 * d.size;
        ctx.fillRect(d.x - w / 2, d.y - h, w, h);
        ctx.beginPath();
        ctx.arc(d.x, d.y - h, w / 2, Math.PI, 0);
        ctx.fill();
    },
    tree(ctx, d) {
        ctx.fillStyle = '#3b2a1c';
        ctx.fillRect(d.x - 3, d.y - 10, 6, 14);
        ctx.fillStyle = 'rgba(30,70,35,0.9)';
        ctx.beginPath();
        ctx.arc(d.x, d.y - 18 * d.size, 18 * d.size, 0, TAU);
        ctx.fill();
    },
    reed(ctx, d) {
        ctx.strokeStyle = 'rgba(140,150,80,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 2, d.y - 16 * d.size);
        ctx.stroke();
    },
    puddle(ctx, d) {
        ctx.fillStyle = 'rgba(40,70,90,0.5)';
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 26 * d.size, 12 * d.size, 0, 0, TAU);
        ctx.fill();
    },
    pillar(ctx, d) {
        ctx.fillStyle = '#5a5248';
        ctx.fillRect(d.x - 10 * d.size, d.y - 30 * d.size, 20 * d.size, 30 * d.size);
    },
    bones(ctx, d) {
        ctx.strokeStyle = 'rgba(220,210,190,0.45)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(d.x - 7, d.y - 3);
        ctx.lineTo(d.x + 7, d.y + 3);
        ctx.moveTo(d.x - 7, d.y + 3);
        ctx.lineTo(d.x + 7, d.y - 3);
        ctx.stroke();
    },
    wisp(ctx, d) {
        ctx.fillStyle = 'rgba(180,160,255,0.25)';
        ctx.beginPath();
        ctx.arc(d.x, d.y, 6 * d.size, 0, TAU);
        ctx.fill();
    },
    crack(ctx, d) {
        ctx.strokeStyle = 'rgba(255,90,30,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(d.x - 14 * d.size, d.y);
        ctx.lineTo(d.x - 3, d.y - 5);
        ctx.lineTo(d.x + 4, d.y + 3);
        ctx.lineTo(d.x + 14 * d.size, d.y - 2);
        ctx.stroke();
    },
};
