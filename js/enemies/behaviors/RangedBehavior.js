import { EnemyBehavior } from './EnemyBehavior.js';
import { Projectile } from '../../entities/Projectile.js';

/**
 * Keeps its distance and fires projectiles at the player.
 * params: preferredRange (fraction of attackRange it tries to hold).
 */
export class RangedBehavior extends EnemyBehavior {
    update(dt, ctx) {
        const { enemy, params } = this;
        const dist = this.edgeDistance(ctx.player);
        const dir = enemy.pos.directionTo(ctx.player.pos);
        const preferred = enemy.attackRange * params.preferredRange;
        const speed = enemy.moveSpeed * enemy.moveMult;

        if (dist > enemy.attackRange) enemy.vel.copy(dir).scale(speed);
        else if (dist < preferred * 0.6) enemy.vel.copy(dir).scale(-speed * 0.7);
        else enemy.vel.set(0, 0);

        if (dist <= enemy.attackRange && enemy.attackCooldown.ready) {
            enemy.attackCooldown.trigger();
            ctx.spawnProjectile(new Projectile({
                x: enemy.pos.x,
                y: enemy.pos.y,
                vx: dir.x * enemy.projectileSpeed,
                vy: dir.y * enemy.projectileSpeed,
                radius: 5,
                team: 'enemy',
                damage: { base: enemy.damage },
                lifetime: (enemy.attackRange * 1.5) / enemy.projectileSpeed,
                visual: { shape: 'arrow', color: '#c9b27a' },
                source: enemy,
            }));
        }
    }
}
