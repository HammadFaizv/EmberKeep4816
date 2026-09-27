/**
 * EffectsRenderer — draws cosmetic Effect entities by `kind`
 * (ring, bolt, strike, text). Register painters for new effect kinds.
 */
const TAU = Math.PI * 2;

export class EffectsRenderer {
    constructor() {
        this.painters = new Map(Object.entries(DEFAULT_PAINTERS));
    }

    register(kind, painter) { this.painters.set(kind, painter); }

    draw(ctx, effect, time) {
        const painter = this.painters.get(effect.kind);
        if (!painter) return;
        ctx.save();
        painter(ctx, effect, time);
        ctx.restore();
    }
}

const DEFAULT_PAINTERS = {
    ring(ctx, e) {
        const t = e.progress;
        const pos = e.data.follow?.pos ?? e.pos;
        const radius = e.data.radius * (0.3 + 0.7 * t);
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = e.data.color ?? '#ffffff';
        ctx.lineWidth = 4 * (1 - t) + 1;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, TAU);
        ctx.stroke();
        if (e.data.fill) {
            ctx.globalAlpha = (1 - t) * 0.3;
            ctx.fillStyle = e.data.color;
            ctx.fill();
        }
    },

    bolt(ctx, e) {
        const from = e.pos;
        const to = e.data.to;
        ctx.globalAlpha = 1 - e.progress;
        ctx.strokeStyle = e.data.color ?? '#ffe14d';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        const segments = 6;
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            ctx.lineTo(from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 14,
                from.y + (to.y - from.y) * t + (Math.random() - 0.5) * 14);
        }
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    },

    strike(ctx, e) {
        const t = e.progress;
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = e.data.color ?? '#fff27a';
        ctx.fillRect(e.pos.x - 4 * (1 - t) - 1, e.pos.y - 400, 8 * (1 - t) + 2, 400);
        ctx.strokeStyle = e.data.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.pos.x, e.pos.y, e.data.radius * (0.5 + t * 0.5), 0, TAU);
        ctx.stroke();
    },

    text(ctx, e) {
        ctx.globalAlpha = 1 - e.progress * e.progress;
        ctx.fillStyle = e.data.color ?? '#ffffff';
        ctx.font = `bold ${e.data.size ?? 14}px Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 3;
        const y = e.pos.y - e.progress * 26;
        ctx.strokeText(e.data.text, e.pos.x, y);
        ctx.fillText(e.data.text, e.pos.x, y);
    },
};
