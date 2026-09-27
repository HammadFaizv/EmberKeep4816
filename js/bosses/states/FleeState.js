import { BossState } from '../BossState.js';
import { BossAttacks } from '../BossAttacks.js';
import { Events } from '../../core/EventBus.js';
import { clamp } from '../../utils/MathUtils.js';

/**
 * FLEE — a wounded miniboss breaks off: it runs away from the player, slowly
 * regenerates and may call for help, then turns back (enraged via the next
 * phase if one is due). Entered once, by BossStateMachine, when the boss's
 * wantsToFlee() says so (see MiniBoss).
 *
 * fsm.flee: { at: 0.3, duration: 4, speedMult: 1.6, regen: 0.02, summon: 'attackId', line: 'text' }
 * The player can chase it down: it stays vulnerable the whole time.
 */
export class FleeState extends BossState {
    static id = 'FLEE';

    enter() {
        this.boss.hasFled = true;
        this.flee = { duration: 4, speedMult: 1.6, regen: 0.02, ...this.cfg.flee };
        this.summoned = false;
    }

    update(dt, ctx) {
        const { boss, flee } = this;
        if (!this.summoned) {
            this.summoned = true;
            if (flee.line) ctx.bus.emit(Events.BOSS_DIALOGUE, { boss, speaker: boss.name, text: flee.line });
            if (flee.summon && boss.attacks[flee.summon]) BossAttacks.execute(boss, flee.summon, ctx);
        }
        const away = ctx.player.pos.directionTo(boss.pos);
        boss.vel.copy(away).scale(boss.currentMoveSpeed * flee.speedMult);
        // Slide along walls instead of pinning in a corner.
        const margin = boss.radius + 10;
        if (boss.pos.x < margin || boss.pos.x > ctx.world.width - margin) boss.vel.x *= -0.3;
        if (boss.pos.y < margin || boss.pos.y > ctx.world.height - margin) boss.vel.y *= -0.3;
        boss.pos.x = clamp(boss.pos.x, margin, ctx.world.width - margin);
        boss.pos.y = clamp(boss.pos.y, margin, ctx.world.height - margin);
        boss.heal(boss.maxHp * flee.regen * dt);

        if (this.time >= flee.duration) this.machine.change('CHASE');
    }
}
