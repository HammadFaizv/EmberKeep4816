import { Combatant } from './Entity.js';

/**
 * Structure — a player-built object in DEFENSE stages (barricades, towers).
 *
 * Structures are data-driven (config/structureConfig.js). A structure with a
 * `spell` owns a Spell instance that auto-casts like the player's own spells;
 * the structure borrows the player's PlayerStats so upgrades apply to it.
 * Enemies damage structures through CombatSystem.damageStructure().
 */
export class Structure extends Combatant {
    constructor(def, { x, y, slot, stats }) {
        super({ x, y, radius: def.radius, team: 'player', render: def.render });
        this.def = def;
        this.typeId = def.id;
        this.name = def.name;
        this.maxHp = def.hp;
        this.hp = def.hp;
        this.defense = def.defense ?? 0;
        this.blocks = Boolean(def.blocks);
        this.slot = slot;         // the build slot it occupies
        this.stats = stats;       // shared with the player (tower damage scaling)
        this.spell = null;        // set by DefenseStage.buildStructure
        this.facing = 1;
    }

    get isStructure() { return true; }

    update(dt, ctx) {
        super.update(dt, ctx);
        this.spell?.update(dt, ctx);
    }
}
