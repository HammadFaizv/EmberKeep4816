import { Combatant } from '../entities/Entity.js';
import { clamp } from '../utils/MathUtils.js';

/**
 * Player — the possessed doll inside a stage.
 *
 * Holds the stage's PlayerStats (permanent upgrades + pets + temporary cards)
 * and the stage SpellBook. Movement obeys stage rules (DEFENSE stages lock
 * movement). Spells fire automatically through the SpellBook.
 */
export class Player extends Combatant {
    constructor({ x, y, stats }) {
        super({ x, y, radius: stats.get('radius'), team: 'player', render: { shape: 'doll', color: '#f1dfc4' } });
        this.stats = stats;
        this.hp = this.maxHp;
        this.spellBook = null;
        this.invulnerableTime = 0;
        this.facing = 1;
        this.resistances = {};
        // TODO: Player elemental resistances (from armor/pets/cards) should be read
        // from stats keys `resist.<element>` here so ElementSystem treats the
        // player exactly like an enemy target.
    }

    get maxHp() { return this.stats.get('maxHp'); }
    get defense() { return this.stats.get('defense'); }
    get moveSpeed() { return this.stats.get('moveSpeed') * this.moveMult; }

    /** Call after stat modifiers change (cards) to keep HP consistent. */
    onStatsChanged() {
        this.hp = Math.min(this.hp, this.maxHp);
    }

    takeDamage(amount) {
        if (this.invulnerableTime > 0) return false;
        this.invulnerableTime = 0.25;
        return super.takeDamage(amount);
    }

    update(dt, ctx) {
        super.update(dt, ctx);
        if (this.invulnerableTime > 0) this.invulnerableTime -= dt;

        if (ctx.rules.canMove && !this.stunned) {
            const axis = ctx.input.getMoveAxis();
            this.vel.set(axis.x, axis.y).normalize().scale(this.moveSpeed);
            if (axis.x !== 0) this.facing = Math.sign(axis.x);
            this.pos.addScaled(this.vel, dt);
            this.pos.x = clamp(this.pos.x, this.radius, ctx.world.width - this.radius);
            this.pos.y = clamp(this.pos.y, this.radius, ctx.world.height - this.radius);
        } else {
            this.vel.set(0, 0);
        }

        const regen = this.stats.get('regen');
        if (regen > 0) this.heal(regen * dt);

        this.spellBook?.update(dt, ctx);
    }
}
