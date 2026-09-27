import { BossState } from '../BossState.js';

/**
 * CHASE — moves toward the player and picks the next attack:
 *   1. a ready special attack (cooldown-based)          -> SPECIAL_ATTACK
 *   2. player inside melee reach and basic attack ready -> ATTACK
 */
export class ChaseState extends BossState {
    static id = 'CHASE';

    update(dt, ctx) {
        const special = this.controller.readySpecialAttack();
        if (special && this.time > 0.4) {
            this.machine.change('SPECIAL_ATTACK', { attackId: special });
            return;
        }
        const melee = this.controller.meleeAttack();
        const reach = melee ? this.boss.attacks[melee].reach : 0;
        if (melee && this.distanceToPlayer(ctx) <= reach) {
            this.stop();
            if (this.controller.basicCooldown.ready) this.machine.change('ATTACK', { attackId: melee });
            return;
        }
        this.moveTowardPlayer(ctx);
    }
}
