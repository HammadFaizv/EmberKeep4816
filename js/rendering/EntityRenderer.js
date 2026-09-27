/**
 * EntityRenderer — draws combatants and pickups from their `render` descriptor.
 *
 * Painters are registered per `shape` key. To switch an enemy to a sprite:
 *   entityRenderer.register('skeleton', (ctx, e) => ctx.drawImage(sheet, ...));
 * Gameplay code keeps using `render: { shape: 'skeleton' }` unchanged.
 */
const TAU = Math.PI * 2;

export class EntityRenderer {
    constructor() {
        this.painters = new Map(Object.entries(DEFAULT_PAINTERS));
    }

    register(shape, painter) { this.painters.set(shape, painter); }

    draw(ctx, entity, time) {
        const shape = entity.render?.shape;
        const painter = this.painters.get(shape) ?? this.painters.get('default');
        ctx.save();
        ctx.translate(entity.pos.x, entity.pos.y);
        painter(ctx, entity, time);
        if (entity.flashTime > 0) {
            ctx.globalAlpha = 0.55;
            circle(ctx, 0, 0, entity.radius, '#ffffff');
        }
        ctx.restore();
        if (entity.statuses?.length) this._drawStatuses(ctx, entity, time);
    }

    drawHealthBar(ctx, entity) {
        if (entity.isBoss || entity.hp >= entity.maxHp || entity.hp <= 0) return;
        const w = entity.radius * 2;
        const x = entity.pos.x - entity.radius;
        const y = entity.pos.y - entity.radius - 8;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x, y, w, 3);
        ctx.fillStyle = entity.isElite ? '#ffb347' : '#e04848';
        ctx.fillRect(x, y, w * entity.hpRatio, 3);
    }

    _drawStatuses(ctx, e, time) {
        for (const s of e.statuses) {
            if (s.type === 'burn') {
                ctx.fillStyle = '#ff8a3d';
                for (let i = 0; i < 3; i++) {
                    const a = time * 5 + i * 2.1;
                    ctx.globalAlpha = 0.7;
                    ctx.beginPath();
                    ctx.arc(e.pos.x + Math.cos(a) * e.radius * 0.7, e.pos.y - Math.abs(Math.sin(a)) * e.radius, 2.5, 0, TAU);
                    ctx.fill();
                }
            } else if (s.type === 'slow') {
                ctx.strokeStyle = '#8fd8ff';
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.arc(e.pos.x, e.pos.y, e.radius + 3, 0, TAU);
                ctx.stroke();
            } else if (s.type === 'stun') {
                ctx.fillStyle = '#ffe14d';
                for (let i = 0; i < 3; i++) {
                    const a = time * 6 + (i * TAU) / 3;
                    ctx.fillRect(e.pos.x + Math.cos(a) * 10 - 1.5, e.pos.y - e.radius - 6 + Math.sin(a) * 3 - 1.5, 3, 3);
                }
            }
            ctx.globalAlpha = 1;
        }
    }
}

function circle(ctx, x, y, r, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
}

const DEFAULT_PAINTERS = {
    default(ctx, e) {
        circle(ctx, 0, 0, e.radius, e.render?.color ?? '#ff00ff');
    },

    /** The possessed doll: stitched body, button eyes, faint soul glow. */
    doll(ctx, e, time) {
        const r = e.radius;
        if (e.invulnerableTime > 0 && e.invulnerableTime < 10 && Math.floor(time * 20) % 2) ctx.globalAlpha = 0.5;
        const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 2.2);
        glow.addColorStop(0, 'rgba(120,180,255,0.35)');
        glow.addColorStop(1, 'rgba(120,180,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.2, 0, TAU);
        ctx.fill();
        // body
        ctx.fillStyle = '#8b5a3c';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.55, r * 0.65, r * 0.7, 0, 0, TAU);
        ctx.fill();
        // head
        circle(ctx, 0, -r * 0.3, r * 0.75, e.render.color);
        // stitch
        ctx.strokeStyle = '#6b4a3a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, -r * 0.95);
        ctx.lineTo(r * 0.2, -r * 0.95);
        ctx.stroke();
        // button eyes
        circle(ctx, -r * 0.28 * e.facing, -r * 0.35, r * 0.14, '#1a1a2a');
        circle(ctx, r * 0.28 * e.facing, -r * 0.35, r * 0.14, '#1a1a2a');
        ctx.globalAlpha = 1;
    },

    skeleton(ctx, e) {
        const r = e.radius;
        circle(ctx, 0, 0, r, e.render.accent ?? '#3a3a3a');
        circle(ctx, 0, -r * 0.2, r * 0.8, e.render.color);
        ctx.fillStyle = '#1a1414';
        ctx.fillRect(-r * 0.45, -r * 0.4, r * 0.3, r * 0.3);
        ctx.fillRect(r * 0.15, -r * 0.4, r * 0.3, r * 0.3);
        ctx.fillRect(-r * 0.3, r * 0.2, r * 0.6, r * 0.12);
    },

    goblin(ctx, e) {
        const r = e.radius;
        ctx.fillStyle = e.render.color;
        ctx.beginPath();
        ctx.moveTo(-r * 1.4, -r * 0.4);
        ctx.lineTo(-r * 0.5, -r * 0.2);
        ctx.lineTo(-r * 0.5, -r * 0.6);
        ctx.moveTo(r * 1.4, -r * 0.4);
        ctx.lineTo(r * 0.5, -r * 0.2);
        ctx.lineTo(r * 0.5, -r * 0.6);
        ctx.fill();
        circle(ctx, 0, 0, r, e.render.color);
        if (e.render.accent) circle(ctx, 0, r * 0.5, r * 0.5, e.render.accent);
        circle(ctx, -r * 0.35, -r * 0.2, r * 0.18, '#ff3030');
        circle(ctx, r * 0.35, -r * 0.2, r * 0.18, '#ff3030');
    },

    bat(ctx, e, time) {
        const r = e.radius;
        const flap = Math.sin(time * 18 + e.id) * 0.6;
        ctx.fillStyle = e.render.color;
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(side * r * 2, -r * (0.6 + flap));
            ctx.lineTo(side * r * 1.4, r * 0.4);
            ctx.closePath();
            ctx.fill();
        }
        circle(ctx, 0, 0, r * 0.7, e.render.color);
        circle(ctx, -r * 0.25, -r * 0.15, r * 0.12, '#ffdd55');
        circle(ctx, r * 0.25, -r * 0.15, r * 0.12, '#ffdd55');
    },

    snake(ctx, e, time) {
        const r = e.radius;
        const angle = Math.atan2(e.vel.y, e.vel.x) || 0;
        ctx.rotate(angle);
        for (let i = 3; i >= 1; i--) {
            circle(ctx, -i * r * 0.8, Math.sin(time * 8 - i) * r * 0.4, r * (1 - i * 0.18), i % 2 ? '#4a8a64' : e.render.color);
        }
        circle(ctx, 0, 0, r, e.render.color);
        circle(ctx, r * 0.4, -r * 0.35, r * 0.15, '#ffe14d');
        circle(ctx, r * 0.4, r * 0.35, r * 0.15, '#ffe14d');
    },

    boss(ctx, e, time) {
        const r = e.radius;
        const pulse = 1 + Math.sin(time * 3) * 0.03;
        ctx.globalAlpha = e.dying ? Math.max(0, 1 - e.controller.machine.timeInState / 1.4) : 1;
        const aura = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.6);
        aura.addColorStop(0, e.render.accent + '66');
        aura.addColorStop(1, e.render.accent + '00');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.6, 0, TAU);
        ctx.fill();
        circle(ctx, 0, 0, r * pulse, e.render.color);
        // horns / crown
        ctx.fillStyle = e.render.accent;
        for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(side * r * 0.4, -r * 0.8);
            ctx.lineTo(side * r * 0.9, -r * 1.5);
            ctx.lineTo(side * r * 0.8, -r * 0.55);
            ctx.fill();
        }
        const eyeColor = e.invulnerable ? '#ffffff' : e.render.accent;
        circle(ctx, -r * 0.35, -r * 0.15, r * 0.14, eyeColor);
        circle(ctx, r * 0.35, -r * 0.15, r * 0.14, eyeColor);
        ctx.globalAlpha = 1;
    },

    pet(ctx, e, time) {
        const r = e.radius;
        const bob = Math.sin(time * 5) * 2;
        const glow = ctx.createRadialGradient(0, bob, 1, 0, bob, r * 2);
        glow.addColorStop(0, e.render.color);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, bob, r * 2, 0, TAU);
        ctx.fill();
        circle(ctx, 0, bob, r * 0.7, '#fff6e0');
    },

    pickup_gold(ctx, e, time) {
        const s = 0.6 + Math.abs(Math.sin(time * 4 + e.id)) * 0.4;
        ctx.scale(s, 1);
        circle(ctx, 0, 0, 6, '#f5c542');
        circle(ctx, -1.5, -1.5, 2, '#fff2b0');
    },
};
