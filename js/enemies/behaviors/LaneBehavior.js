import { EnemyBehavior } from './EnemyBehavior.js';

/**
 * Walks a DEFENSE-stage lane (a polyline of waypoints) toward the doll, then
 * hands control to the enemy's normal behavior (`inner`) at the end of the
 * lane — or earlier for ranged enemies once the doll is within range.
 *
 * Blocking structures (barricades) standing on the lane stop the enemy, which
 * attacks the structure until it breaks.
 */
export class LaneBehavior extends EnemyBehavior {
    constructor(enemy, { lane, inner }) {
        super(enemy, {});
        this.lane = lane;
        this.inner = inner;
        this.index = 1;
        this.offset = (Math.random() - 0.5) * 24; // spread along the lane width
    }

    update(dt, ctx) {
        const { enemy } = this;
        if (this.index >= this.lane.length || this._playerInRange(ctx)) {
            this.inner?.update(dt, ctx);
            return;
        }

        const blocker = this._blockingStructure(ctx);
        if (blocker) {
            enemy.vel.set(0, 0);
            if (enemy.attackCooldown.ready) {
                ctx.combat.damageStructure(blocker, enemy.damage, enemy);
                enemy.attackCooldown.trigger();
            }
            return;
        }

        const [wx, wy] = this.lane[this.index];
        const target = { x: wx + this._perpX() * this.offset, y: wy + this._perpY() * this.offset };
        const dx = target.x - enemy.pos.x;
        const dy = target.y - enemy.pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 14) {
            this.index += 1;
            return;
        }
        const speed = enemy.moveSpeed * enemy.moveMult;
        enemy.vel.set((dx / dist) * speed, (dy / dist) * speed);
    }

    _playerInRange(ctx) {
        return this.enemy.attackRange > 50 && this.edgeDistance(ctx.player) <= this.enemy.attackRange;
    }

    _blockingStructure(ctx) {
        for (const s of ctx.structures) {
            if (!s.blocks || !s.alive) continue;
            if (this.enemy.pos.distanceTo(s.pos) <= this.enemy.radius + s.radius + 6) return s;
        }
        return null;
    }

    // Unit perpendicular of the current lane segment (for the lateral offset).
    _perpX() { return -this._dir().y; }
    _perpY() { return this._dir().x; }
    _dir() {
        const a = this.lane[this.index - 1];
        const b = this.lane[this.index];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        return { x: (b[0] - a[0]) / len, y: (b[1] - a[1]) / len };
    }
}
