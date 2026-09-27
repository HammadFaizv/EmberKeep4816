import { Random } from '../utils/Random.js';

/**
 * StageRenderer — draws a Stage: textured ground, backdrop, hazards,
 * entities, projectiles, effects, then the screen-space overlay.
 *
 * Backdrops are registered per stage TYPE (lanes + tower platform for
 * DEFENSE, etc.), decorations per environment THEME and hazard visuals per
 * hazard `visual.kind`, so a new stage type, biome or hazard adds a painter
 * instead of editing this render loop.
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
        this.hazardPainters = new Map(Object.entries(HAZARD_PAINTERS));
        this._decorCache = new Map();
    }

    registerBackdrop(stageType, painter) { this.backdrops.set(stageType, painter); }
    registerDecor(kind, painter) { this.decorPainters.set(kind, painter); }
    registerHazard(kind, painter) { this.hazardPainters.set(kind, painter); }

    render(stage) {
        const r = this.renderer;
        const { ctx, time } = r;
        r.clear('#050507');
        r.followCamera(stage.player.pos, stage.world);

        r.withCamera(() => {
            this._drawGround(ctx, stage);
            (this.backdrops.get(stage.type) ?? this.backdrops.get('default'))(ctx, stage, time);
            this._drawObjective(ctx, stage, time);

            this._drawArenaRing(ctx, stage, time);
            for (const h of stage.hazards) this._drawHazard(ctx, h, time);
            for (const p of stage.pickups) r.entities.draw(ctx, p, time);
            for (const e of stage.enemies) if (e.telegraph) this._drawTelegraph(ctx, e);

            const actors = [...stage.structures, ...stage.enemies, ...stage.pets, stage.player].sort((a, b) => a.pos.y - b.pos.y);
            for (const a of actors) r.entities.draw(ctx, a, time);
            for (const e of stage.enemies) r.entities.drawHealthBar(ctx, e);
            for (const s of stage.structures) r.entities.drawHealthBar(ctx, s);

            for (const p of stage.projectiles) r.spells.draw(ctx, p, time);
            for (const e of stage.effects) r.effects.draw(ctx, e, time);
        });

        r.overlay.render(stage);
    }

    _drawGround(ctx, stage) {
        const { width, height } = stage.world;
        const env = stage.environment;
        // Procedural pixel-art ground (assets/TextureFactory.js), tiled seamlessly.
        const texture = this.renderer.textures.get(env, ctx);
        ctx.fillStyle = texture.pattern ?? env.ground ?? '#2a2a2a';
        ctx.fillRect(0, 0, width, height);

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

    _drawHazard(ctx, hazard, time) {
        ctx.save();
        if (!hazard.active) {
            // Telegraph: a filling circle warns where it will land.
            const t = hazard.warmupProgress;
            const color = hazard.team === 'enemy' ? '255,70,40' : '255,220,140';
            ctx.strokeStyle = `rgba(${color},${0.5 + t * 0.4})`;
            ctx.fillStyle = `rgba(${color},${0.08 + t * 0.18})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 5]);
            ctx.beginPath();
            ctx.arc(hazard.pos.x, hazard.pos.y, hazard.radius, 0, TAU);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(hazard.pos.x, hazard.pos.y, hazard.radius * t, 0, TAU);
            ctx.stroke();
            if (hazard.render.kind === 'meteor') {
                // The falling rock.
                const h = (1 - t) * 420;
                ctx.fillStyle = '#ffb36b';
                ctx.beginPath();
                ctx.arc(hazard.pos.x + h * 0.4, hazard.pos.y - h, 10 + t * 6, 0, TAU);
                ctx.fill();
            }
        } else {
            (this.hazardPainters.get(hazard.render.kind) ?? this.hazardPainters.get('fire'))(ctx, hazard, time);
        }
        ctx.restore();
    }

    /** Closing ring of fire (ArenaHazards 'closingRing'). */
    _drawArenaRing(ctx, stage, time) {
        const ring = stage.arenaRing;
        if (!ring?.active) return;
        const { width, height } = stage.world;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.arc(ring.x, ring.y, ring.radius, 0, TAU, true);
        ctx.fillStyle = `rgba(120,20,10,${0.35 + Math.sin(time * 4) * 0.05})`;
        ctx.fill('evenodd');
        ctx.strokeStyle = '#ff6a2a';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#ff4a1a';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, TAU);
        ctx.stroke();
        ctx.restore();
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

    /** DEFENSE: winding dirt lanes, empty build slots and the tower platform the doll stands on. */
    DEFENSE(ctx, stage, time) {
        const c = stage.player.pos;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const lane of Object.values(stage.lanes ?? {})) {
            for (const [width, color] of [[58, 'rgba(0,0,0,0.3)'], [44, 'rgba(110,85,55,0.35)'], [4, 'rgba(0,0,0,0.15)']]) {
                ctx.lineWidth = width;
                ctx.strokeStyle = color;
                ctx.beginPath();
                lane.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
                ctx.lineTo(c.x, c.y);
                ctx.stroke();
            }
        }
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        for (const slot of stage.freeBuildSlots?.() ?? []) {
            ctx.strokeStyle = `rgba(232,217,176,${0.2 + Math.sin(time * 2 + slot.x) * 0.08})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(slot.x, slot.y, slot.kind === 'lane' ? 22 : 18, 0, TAU);
            ctx.stroke();
            ctx.setLineDash([]);
        }
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

/**
 * Hazard painters keyed by `visual.kind` (active phase; the warmup telegraph
 * is shared). `h.lifeProgress` goes 0 -> 1 over the hazard's duration.
 */
const HAZARD_PAINTERS = {
    fire(ctx, h, time) {
        const fade = 1 - h.lifeProgress * 0.6;
        const g = ctx.createRadialGradient(h.pos.x, h.pos.y, h.radius * 0.1, h.pos.x, h.pos.y, h.radius);
        g.addColorStop(0, `rgba(255,170,60,${0.45 * fade})`);
        g.addColorStop(1, 'rgba(255,60,20,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(h.pos.x, h.pos.y, h.radius, 0, TAU);
        ctx.fill();
        flickers(ctx, h, time, ['#ffb347', '#ff6a2a', '#ffe08a'], fade);
    },

    meteor(ctx, h, time) {
        if (h.age - h.warmup < 0.25) {
            ctx.fillStyle = `rgba(255,240,200,${1 - (h.age - h.warmup) / 0.25})`;
            ctx.beginPath();
            ctx.arc(h.pos.x, h.pos.y, h.radius * 1.1, 0, TAU);
            ctx.fill();
        }
        HAZARD_PAINTERS.fire(ctx, h, time);
    },

    lava(ctx, h, time) {
        const fade = h.lifeProgress > 0.8 ? (1 - h.lifeProgress) / 0.2 : 1;
        ctx.globalAlpha = fade;
        ctx.fillStyle = '#5a1208';
        ctx.beginPath();
        ctx.ellipse(h.pos.x, h.pos.y, h.radius, h.radius * 0.8, 0, 0, TAU);
        ctx.fill();
        const g = ctx.createRadialGradient(h.pos.x, h.pos.y, 2, h.pos.x, h.pos.y, h.radius * 0.9);
        g.addColorStop(0, '#ffd27a');
        g.addColorStop(0.5, '#ff6a1a');
        g.addColorStop(1, 'rgba(180,30,10,0.6)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(h.pos.x, h.pos.y, h.radius * 0.85, h.radius * 0.65, 0, 0, TAU);
        ctx.fill();
        flickers(ctx, h, time, ['#ffe08a', '#ff9a3d'], fade);
    },

    poison(ctx, h, time) {
        const fade = 1 - h.lifeProgress * 0.5;
        for (let i = 0; i < 6; i++) {
            const a = time * 0.6 + i * 1.05 + h.id;
            const x = h.pos.x + Math.cos(a) * h.radius * 0.45;
            const y = h.pos.y + Math.sin(a * 1.3) * h.radius * 0.35;
            ctx.fillStyle = `rgba(140,210,80,${0.16 * fade})`;
            ctx.beginPath();
            ctx.arc(x, y, h.radius * 0.6, 0, TAU);
            ctx.fill();
        }
        flickers(ctx, h, time, ['#c9ff8a', '#7ab83a'], fade, true);
    },

    frost(ctx, h, time) {
        const fade = 1 - h.lifeProgress * 0.6;
        ctx.fillStyle = `rgba(191,234,255,${0.22 * fade})`;
        ctx.strokeStyle = `rgba(255,255,255,${0.5 * fade})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(h.pos.x, h.pos.y, h.radius, 0, TAU);
        ctx.fill();
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU + time * 0.3;
            const d = h.radius * (0.3 + ((i * 37) % 10) / 16);
            ctx.fillStyle = `rgba(255,255,255,${0.8 * fade})`;
            ctx.fillRect(h.pos.x + Math.cos(a) * d - 1.5, h.pos.y + Math.sin(a) * d - 1.5, 3, 3);
        }
    },

    /** Orbiting wind blades. */
    blade(ctx, h, time) {
        ctx.translate(h.pos.x, h.pos.y);
        ctx.rotate(time * 14);
        ctx.fillStyle = h.render.color ?? '#7fe3c4';
        for (let i = 0; i < 3; i++) {
            ctx.rotate(TAU / 3);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(h.radius * 0.6, -h.radius * 0.5, h.radius, 0);
            ctx.quadraticCurveTo(h.radius * 0.5, -h.radius * 0.1, 0, 0);
            ctx.fill();
        }
        ctx.fillStyle = '#e8fff6';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, TAU);
        ctx.fill();
    },
};

/** Little rising sparks/bubbles inside a hazard. */
function flickers(ctx, h, time, colors, alpha, bubbles = false) {
    for (let i = 0; i < 7; i++) {
        const seed = h.id * 7 + i * 13;
        const cycle = (time * (bubbles ? 0.7 : 1.4) + seed * 0.13) % 1;
        const a = seed * 2.4;
        const d = ((seed * 17) % 100) / 100 * h.radius * 0.8;
        ctx.globalAlpha = alpha * (1 - cycle);
        ctx.fillStyle = colors[i % colors.length];
        const size = bubbles ? 3 : 2.5;
        ctx.fillRect(h.pos.x + Math.cos(a) * d, h.pos.y + Math.sin(a) * d * 0.7 - cycle * 18, size, size);
    }
    ctx.globalAlpha = 1;
}
