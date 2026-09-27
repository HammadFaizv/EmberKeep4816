import { Entity } from './Entity.js';
import { Events } from '../core/EventBus.js';

/**
 * Pickup — collectible dropped in a stage (currently gold).
 *
 * Flies to the player when inside their pickup radius, or always when the
 * stage rule `autoCollectPickups` is set (DEFENSE stages, where the player
 * cannot walk to it). On contact it emits a collection event; the matching
 * persistent system (GoldSystem) credits the profile.
 */
const COLLECT_EVENTS = {
    gold: Events.GOLD_COLLECTED,
};

export class Pickup extends Entity {
    constructor({ kind, amount, x, y }) {
        super({ x, y, radius: 7, team: 'neutral', render: { shape: `pickup_${kind}` } });
        this.kind = kind;
        this.amount = amount;
        this.magnetized = false;
        this.lifetime = 30;
    }

    update(dt, ctx) {
        super.update(dt, ctx);
        const player = ctx.player;
        const dist = this.pos.distanceTo(player.pos);
        if (ctx.rules.autoCollectPickups || dist < player.stats.get('pickupRadius')) this.magnetized = true;

        if (this.magnetized) {
            const speed = 260 + this.age * 200;
            this.vel.copy(this.pos.directionTo(player.pos)).scale(speed);
            this.pos.addScaled(this.vel, dt);
        }

        if (dist < player.radius + this.radius) {
            this.alive = false;
            ctx.bus.emit(COLLECT_EVENTS[this.kind], { amount: this.amount });
        } else if (this.age > this.lifetime && !this.magnetized) {
            this.alive = false;
        }
    }
}
