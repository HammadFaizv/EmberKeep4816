import { EnemyBehavior } from './EnemyBehavior.js';

/** Walks straight at the player and attacks on contact. */
export class ChaseBehavior extends EnemyBehavior {
    update(dt, ctx) {
        const { enemy } = this;
        if (this.tryMelee(ctx)) {
            enemy.vel.set(0, 0);
            return;
        }
        enemy.vel.copy(enemy.pos.directionTo(ctx.player.pos)).scale(enemy.moveSpeed * enemy.moveMult);
    }
}
