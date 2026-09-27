/**
 * EntityRenderer — draws combatants, pets, structures and pickups from their
 * `render` descriptor.
 *
 *   render.sprite  pixel-art key in the SpriteLibrary (preferred)
 *   render.shape   procedural fallback painter (registered below)
 *
 * Sprites get a drop shadow, a walk bob, horizontal flipping toward their
 * movement, animation frames, a white hit flash and an icy tint when frozen.
 * Per-kind extras (boss aura, doll glow, pickup spin) are "decorators" keyed
 * by shape. Rendering only READS entities; per-entity visual memory (last
 * facing) lives in a WeakMap here.
 */
const TAU = Math.PI * 2;

export class EntityRenderer {
    constructor(sprites = null) {
        this.sprites = sprites;
        this.painters = new Map(Object.entries(DEFAULT_PAINTERS));
        this.decorators = new Map(Object.entries(SPRITE_DECORATORS));
        this._facing = new WeakMap();
    }

    register(shape, painter) { this.painters.set(shape, painter); }
    registerDecorator(shape, fn) { this.decorators.set(shape, fn); }

    draw(ctx, entity, time) {
        const sprite = this.sprites?.get(entity.render?.sprite);
        ctx.save();
        ctx.translate(entity.pos.x, entity.pos.y);
        if (sprite) {
            this._drawSprite(ctx, entity, sprite, time);
        } else {
            const painter = this.painters.get(entity.render?.shape) ?? this.painters.get('default');
            painter(ctx, entity, time);
            if (entity.flashTime > 0) {
                ctx.globalAlpha = 0.55;
                circle(ctx, 0, 0, entity.radius, '#ffffff');
            }
        }
        ctx.restore();
        if (entity.statuses?.length) this._drawStatuses(ctx, entity, time);
    }

    _drawSprite(ctx, e, sprite, time) {
        const shape = e.render.shape;
        const decorate = this.decorators.get(shape);
        const opts = decorate?.(ctx, e, time) ?? {};
        if (opts.skip) return;

        const frame = sprite.frames[sprite.fps ? Math.floor(time * sprite.fps + e.id * 0.37) % sprite.frames.length : 0];
        const scale = Math.max(1, Math.round(((e.radius * 2 * sprite.fit) / sprite.height) * 2) / 2) * (opts.scale ?? 1);
        const w = sprite.width * scale;
        const h = sprite.height * scale;
        const moving = e.vel && e.vel.x * e.vel.x + e.vel.y * e.vel.y > 25;
        const bob = opts.bob ?? (moving ? -Math.abs(Math.sin(time * 12 + e.id)) * scale : 0);

        if (opts.shadow !== false) {
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(0, e.radius * 0.85, e.radius * 0.95, e.radius * 0.35, 0, 0, TAU);
            ctx.fill();
        }

        ctx.save();
        if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
        ctx.scale(this._facingOf(e) * (opts.scaleX ?? 1), 1);
        const x = -w / 2;
        const y = -h * sprite.anchorY + bob;
        ctx.drawImage(frame.canvas, x, y, w, h);
        if (e.frozen) {
            ctx.globalAlpha = 0.55 * (opts.alpha ?? 1);
            ctx.drawImage(frame.frost, x, y, w, h);
        }
        // The hit flash fades with flashTime, so rapid multi-hits (orbiting
        // blades, poison ticks) flicker instead of washing the sprite out.
        const flash = opts.flash ? 0.6 : Math.max(0, e.flashTime ?? 0) / 0.1 * (e.isBoss ? 0.35 : 0.6);
        if (flash > 0.02) {
            ctx.globalAlpha = Math.min(0.7, flash) * (opts.alpha ?? 1);
            ctx.drawImage(frame.flash, x, y, w, h);
        }
        ctx.restore();
    }

    /** -1 or 1. Player/pets expose `facing`; others face their horizontal velocity. */
    _facingOf(e) {
        if (e.facing !== undefined) return e.facing < 0 ? -1 : 1;
        let facing = this._facing.get(e) ?? 1;
        if (e.vel?.x > 2) facing = 1;
        else if (e.vel?.x < -2) facing = -1;
        this._facing.set(e, facing);
        return facing;
    }

    drawHealthBar(ctx, entity) {
        if (entity.isBoss || entity.hp >= entity.maxHp || entity.hp <= 0) return;
        const w = entity.radius * 2;
        const x = entity.pos.x - entity.radius;
        const y = entity.pos.y - entity.radius - 8;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x, y, w, 3);
        ctx.fillStyle = entity.isStructure ? '#6fd39a' : entity.isElite ? '#ffb347' : '#e04848';
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
            } else if (s.type === 'poison') {
                ctx.fillStyle = '#9be15d';
                for (let i = 0; i < Math.min(4, s.stacks ?? 1) + 1; i++) {
                    const a = time * 2 + i * 1.7 + e.id;
                    const rise = (time * 20 + i * 9) % 16;
                    ctx.globalAlpha = 0.8 * (1 - rise / 16);
                    ctx.beginPath();
                    ctx.arc(e.pos.x + Math.cos(a) * e.radius * 0.6, e.pos.y - rise, 2, 0, TAU);
                    ctx.fill();
                }
            } else if (s.type === 'chill') {
                ctx.fillStyle = '#cfefff';
                for (let i = 0; i < s.stacks; i++) {
                    const a = time * 3 + (i * TAU) / Math.max(1, s.stacks);
                    ctx.globalAlpha = 0.8;
                    ctx.fillRect(e.pos.x + Math.cos(a) * (e.radius + 4) - 1, e.pos.y + Math.sin(a) * (e.radius + 4) - 1, 2, 2);
                }
            } else if (s.type === 'freeze') {
                ctx.strokeStyle = '#e8f8ff';
                ctx.globalAlpha = 0.8;
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (i / 6) * TAU;
                    ctx.moveTo(e.pos.x + Math.cos(a) * e.radius * 0.9, e.pos.y + Math.sin(a) * e.radius * 0.9);
                    ctx.lineTo(e.pos.x + Math.cos(a) * (e.radius + 6), e.pos.y + Math.sin(a) * (e.radius + 6));
                }
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

    pickup_exp(ctx, e, time) {
        circle(ctx, 0, Math.sin(time * 4 + e.id) * 2, 5, e.render.color ?? '#6fd3ff');
    },

    pickup_soul(ctx, e, time) {
        circle(ctx, 0, Math.sin(time * 3 + e.id) * 3, 6, '#b89cff');
    },

    structure(ctx, e) {
        ctx.fillStyle = e.render.color;
        ctx.fillRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
    },
};

/**
 * Sprite decorators: extras drawn under a sprite, keyed by `render.shape`.
 * Return options for the sprite pass: { alpha, bob, scaleX, flash, shadow, skip }.
 */
const SPRITE_DECORATORS = {
    doll(ctx, e, time) {
        const r = e.radius;
        const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 2.4);
        glow.addColorStop(0, 'rgba(120,180,255,0.35)');
        glow.addColorStop(1, 'rgba(120,180,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.4, 0, TAU);
        ctx.fill();
        const blink = e.invulnerableTime > 0 && e.invulnerableTime < 10 && Math.floor(time * 20) % 2;
        return { alpha: blink ? 0.5 : 1 };
    },

    boss(ctx, e, time) {
        const r = e.radius;
        const alpha = e.dying ? Math.max(0, 1 - e.controller.machine.timeInState / 1.4) : 1;
        const aura = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.8);
        aura.addColorStop(0, e.render.accent + '55');
        aura.addColorStop(1, e.render.accent + '00');
        ctx.globalAlpha = alpha * (0.8 + Math.sin(time * 3) * 0.2);
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.8, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
        return { alpha, flash: e.invulnerable && Math.floor(time * 8) % 2 === 0, bob: e.vel.lengthSq() > 25 ? -Math.abs(Math.sin(time * 6)) * 3 : 0 };
    },

    pet(ctx, e, time) {
        const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, e.radius * 2.2);
        glow.addColorStop(0, e.render.color + '88');
        glow.addColorStop(1, e.render.color + '00');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 2.2, 0, TAU);
        ctx.fill();
        return { bob: Math.sin(time * 5 + e.id) * 2, shadow: false };
    },

    pickup_gold(ctx, e, time) {
        return { scaleX: 0.35 + Math.abs(Math.sin(time * 4 + e.id)) * 0.65, shadow: false };
    },

    pickup_exp(ctx, e, time) {
        const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 12);
        glow.addColorStop(0, e.render.color + '99');
        glow.addColorStop(1, e.render.color + '00');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, TAU);
        ctx.fill();
        return { bob: Math.sin(time * 4 + e.id) * 2, shadow: false };
    },

    pickup_soul(ctx, e, time) {
        const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 16);
        glow.addColorStop(0, 'rgba(184,156,255,0.6)');
        glow.addColorStop(1, 'rgba(184,156,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, TAU);
        ctx.fill();
        return { bob: Math.sin(time * 3 + e.id) * 3, shadow: false };
    },

    structure(ctx, e) {
        if (e.hp < e.maxHp * 0.4) ctx.globalAlpha = 0.85;
        return {};
    },
};
