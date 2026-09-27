/**
 * EnemyBehavior — base class for enemy AI behaviors.
 *
 * A behavior sets `enemy.vel` and triggers attacks; it never deals damage
 * directly (it asks ctx.combat) and never removes entities.
 */
export class EnemyBehavior {
    constructor(enemy, params = {}) {
        this.enemy = enemy;
        this.params = params;
    }

    /** Gap between the enemy's edge and the player's edge. */
    edgeDistance(target) {
        return this.enemy.pos.distanceTo(target.pos) - this.enemy.radius - target.radius;
    }

    /** Melee attack if in reach and off cooldown. Returns true when in reach. */
    tryMelee(ctx) {
        const { enemy } = this;
        if (this.edgeDistance(ctx.player) > enemy.attackRange) return false;
        if (enemy.attackCooldown.ready) {
            ctx.combat.enemyMeleeHit(enemy);
            enemy.attackCooldown.trigger();
        }
        return true;
    }

    update(dt, ctx) {}
}
