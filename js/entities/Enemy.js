import { Combatant } from './Entity.js';
import { Cooldown } from '../utils/Timer.js';

/**
 * Enemy — data-driven hostile combatant.
 *
 * All numbers come from the definition (enemyConfig.js) multiplied by the
 * stage's difficulty scaling. Movement decisions are delegated to an AI
 * behavior (enemies/behaviors/) attached by EnemyFactory, so the Enemy class
 * itself contains no enemy-specific logic.
 */
export class Enemy extends Combatant {
    constructor(def, { x, y, scaling }) {
        super({ x, y, radius: def.stats.radius, team: 'enemy', render: def.render });
        const s = def.stats;
        this.def = def;
        this.typeId = def.id;
        this.name = def.name;
        this.tags = new Set(def.tags ?? []);
        this.isElite = Boolean(def.elite);

        this.maxHp = Math.round(s.hp * scaling.hpMult);
        this.hp = this.maxHp;
        this.damageMult = scaling.damageMult;
        this.damage = s.damage * scaling.damageMult;
        this.moveSpeed = s.moveSpeed;
        this.attackRange = s.attackRange;
        this.projectileSpeed = s.projectileSpeed ?? 250;
        this.defense = s.defense ?? 0;
        this.attackCooldown = new Cooldown(s.attackCooldown, false);
        this.resistances = { ...(def.resistances ?? {}) };
        this.immunities = [...(def.immunities ?? [])];
        this.canBeImmune = false;   // regular enemies can resist but never be immune

        this.exp = def.exp ?? 0;
        this.drops = def.drops ?? {};
        this.ai = null;             // set by EnemyFactory
    }

    get isBoss() { return false; }

    update(dt, ctx) {
        super.update(dt, ctx);
        this.attackCooldown.update(dt);
        if (this.stunned) {
            this.vel.set(0, 0);
        } else {
            this.think(dt, ctx);
        }
        this.pos.addScaled(this.vel, dt);
    }

    /** Decides velocity/attacks. Bosses override this with their FSM. */
    think(dt, ctx) {
        this.ai?.update(dt, ctx);
    }
}
