/**
 * SpellRenderer — draws projectiles (player spells and enemy shots) by their
 * `visual.shape`. Register new painters for new spell visuals or sprites.
 */
const TAU = Math.PI * 2;

export class SpellRenderer {
    constructor() {
        this.painters = new Map(Object.entries(DEFAULT_PAINTERS));
    }

    register(shape, painter) { this.painters.set(shape, painter); }

    draw(ctx, projectile, time) {
        const painter = this.painters.get(projectile.render?.shape) ?? this.painters.get('orb');
        ctx.save();
        ctx.translate(projectile.pos.x, projectile.pos.y);
        ctx.rotate(Math.atan2(projectile.vel.y, projectile.vel.x));
        painter(ctx, projectile, time);
        ctx.restore();
    }
}

const DEFAULT_PAINTERS = {
    orb(ctx, p) {
        const r = p.radius;
        const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2);
        g.addColorStop(0, '#fff3d0');
        g.addColorStop(0.4, p.render.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2, 0, TAU);
        ctx.fill();
        // trail
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = p.render.color;
        ctx.beginPath();
        ctx.ellipse(-r * 1.8, 0, r * 1.6, r * 0.6, 0, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    crescent(ctx, p) {
        const r = p.radius;
        ctx.strokeStyle = p.render.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-r * 0.5, 0, r * 1.2, -1.2, 1.2);
        ctx.stroke();
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(-r * 1.3, 0, r * 1.1, -1.1, 1.1);
        ctx.stroke();
        ctx.globalAlpha = 1;
    },

    arrow(ctx, p) {
        ctx.strokeStyle = p.render.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();
        ctx.fillStyle = '#e8e8e8';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(3, -3);
        ctx.lineTo(3, 3);
        ctx.fill();
    },

    shard(ctx, p) {
        const r = p.radius;
        ctx.fillStyle = p.render.color;
        ctx.beginPath();
        ctx.moveTo(r * 1.8, 0);
        ctx.lineTo(0, -r * 0.8);
        ctx.lineTo(-r * 1.4, 0);
        ctx.lineTo(0, r * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-r * 0.2, -r * 0.25, r, r * 0.3);
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = p.render.color;
        ctx.fillRect(-r * 3.4, -r * 0.3, r * 2, r * 0.6);
        ctx.globalAlpha = 1;
    },

    lance(ctx, p) {
        const r = p.radius;
        const g = ctx.createLinearGradient(-r * 5, 0, r * 2, 0);
        g.addColorStop(0, 'rgba(191,234,255,0)');
        g.addColorStop(1, p.render.color);
        ctx.fillStyle = g;
        ctx.fillRect(-r * 5, -r * 0.35, r * 5, r * 0.7);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(r * 2.2, 0);
        ctx.lineTo(0, -r * 0.6);
        ctx.lineTo(0, r * 0.6);
        ctx.closePath();
        ctx.fill();
    },

    dart(ctx, p) {
        const r = p.radius;
        ctx.strokeStyle = p.render.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-r * 2, 0);
        ctx.lineTo(r * 1.2, 0);
        ctx.stroke();
        ctx.fillStyle = '#d8ffb0';
        ctx.beginPath();
        ctx.moveTo(r * 1.8, 0);
        ctx.lineTo(r * 0.6, -r * 0.6);
        ctx.lineTo(r * 0.6, r * 0.6);
        ctx.fill();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = p.render.color;
        ctx.beginPath();
        ctx.arc(-r * 2.4, 0, r * 0.6, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    ember(ctx, p, time) {
        const r = p.radius;
        const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 1.8);
        g.addColorStop(0, '#fff0c0');
        g.addColorStop(0.45, p.render.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.8 * (0.9 + Math.sin(time * 20 + p.id) * 0.1), 0, TAU);
        ctx.fill();
    },

    spore(ctx, p, time) {
        const r = p.radius;
        ctx.fillStyle = p.render.color;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#3a4a1a';
        ctx.rotate(time * 3);
        ctx.fillRect(-1, -r * 0.6, 2, 2);
        ctx.fillRect(r * 0.3, 0, 2, 2);
        ctx.globalAlpha = 1;
    },

    bone(ctx, p, time) {
        ctx.rotate(time * 10);
        ctx.fillStyle = p.render.color;
        ctx.fillRect(-7, -2.5, 14, 5);
        ctx.beginPath();
        ctx.arc(-7, 0, 4, 0, TAU);
        ctx.arc(7, 0, 4, 0, TAU);
        ctx.fill();
    },
};
