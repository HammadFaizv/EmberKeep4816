import { EnemyBehavior } from './EnemyBehavior.js';

/**
 * Approaches the player in a sine-wave path (bats swoop, snakes slither).
 * params: amplitude (fraction of speed used sideways), frequency (rad/s).
 */
export class WeavingBehavior extends EnemyBehavior {
    constructor(enemy, params) {
        super(enemy, params);
        this.phase = Math.random() * Math.PI * 2;
    }

    update(dt, ctx) {
        const { enemy, params } = this;
        if (this.tryMelee(ctx)) {
            enemy.vel.set(0, 0);
            return;
        }
        const dir = enemy.pos.directionTo(ctx.player.pos);
        const side = Math.sin(enemy.age * params.frequency + this.phase) * params.amplitude;
        const speed = enemy.moveSpeed * enemy.moveMult;
        enemy.vel.set(dir.x - dir.y * side, dir.y + dir.x * side).normalize().scale(speed);
    }
}
