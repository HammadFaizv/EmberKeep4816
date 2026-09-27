import { Entity } from './Entity.js';
import { Events } from '../core/EventBus.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * Pickup — collectible dropped in a stage (gold coins, EXP orbs, souls).
 *
 * Flies to the player when inside their pickup radius, or always when the
 * stage rule `autoCollectPickups` is set (DEFENSE stages, where the player
 * cannot walk to it) or the stage has just been won. On contact it emits the
 * kind's collection event; the matching system (GoldSystem, SoulSystem,
 * ExperienceSystem) credits it.
 *
 * To add a pickup kind: Pickup.registerKind('heart', { event, lifetime, sprite }).
 */
const KINDS = new Map();

export class Pickup extends Entity {
    static registerKind(kind, def) { KINDS.set(kind, def); }

    constructor({ kind, amount, x, y }) {
        const def = KINDS.get(kind);
        if (!def) throw new Error(`Pickup: unknown kind "${kind}"`);
        super({ x, y, radius: def.radius ?? 7, team: 'neutral', render: { shape: `pickup_${kind}`, sprite: def.sprite(amount), color: def.color?.(amount) } });
        this.kind = kind;
        this.amount = amount;
        this.magnetized = false;
        this.lifetime = def.lifetime ?? 30;
        this.event = def.event;
        // Scatter a little so multiple drops from one kill don't overlap exactly.
        this.vel.set((Math.random() - 0.5) * 90, (Math.random() - 0.5) * 90);
    }

    update(dt, ctx) {
        super.update(dt, ctx);
        const player = ctx.player;
        const dist = this.pos.distanceTo(player.pos);
        if (ctx.rules.autoCollectPickups || ctx.status === 'won' || dist < player.stats.get('pickupRadius')) this.magnetized = true;

        if (this.magnetized) {
            const speed = 260 + this.age * 200;
            this.vel.copy(this.pos.directionTo(player.pos)).scale(speed);
        } else {
            this.vel.scale(Math.max(0, 1 - dt * 6)); // settle after the spawn scatter
        }
        this.pos.addScaled(this.vel, dt);

        if (dist < player.radius + this.radius) {
            this.alive = false;
            ctx.bus.emit(this.event, { amount: this.amount, kind: this.kind });
        } else if (this.age > this.lifetime && !this.magnetized) {
            this.alive = false;
        }
    }
}

const expTier = (amount) => [...GAME_CONFIG.expOrbs.tiers].reverse().find((t) => amount >= t.min);

Pickup.registerKind('gold', { event: Events.GOLD_COLLECTED, sprite: () => 'coin', color: () => '#f5c542' });
Pickup.registerKind('exp', {
    event: Events.EXP_COLLECTED,
    lifetime: GAME_CONFIG.expOrbs.lifetime,
    radius: 6,
    sprite: (amount) => expTier(amount).sprite,
    color: (amount) => expTier(amount).color,
});
Pickup.registerKind('soul', { event: Events.SOULS_COLLECTED, lifetime: 40, radius: 8, sprite: () => 'soul', color: () => '#b89cff' });
