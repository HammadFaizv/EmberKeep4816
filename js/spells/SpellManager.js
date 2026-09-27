import { SPELLS } from '../config/spellConfig.js';

/**
 * SpellManager — decides which spells are AVAILABLE in a stage and builds
 * spell offers (the 3 spell cards shown at stage start).
 *
 *   UNLOCKED  -> profile.data.unlockedSpells
 *   AVAILABLE -> unlocked spells allowed by the stage rules (bannedSpells/allowedSpells)
 *   EQUIPPED  -> the stage SpellBook (see player/SpellBook.js)
 *
 * Fused spells (created by fusion cards) and hidden spells (towers, pets) are
 * never offered.
 */
export class SpellManager {
    constructor({ profile, rng }) {
        this.profile = profile;
        this.rng = rng;
    }

    getAvailableStageSpells(rules = {}) {
        return this.profile.data.unlockedSpells.filter((id) =>
            SPELLS[id]
            && !SPELLS[id].fused && !SPELLS[id].hidden
            && !(rules.bannedSpells ?? []).includes(id)
            && (!rules.allowedSpells || rules.allowedSpells.includes(id)));
    }

    /** Card-shaped offers so the generic CardSelectionUI can render them. */
    generateStageOffer(count, spellBook, rules) {
        const pool = this.getAvailableStageSpells(rules).filter((id) => !spellBook.has(id));
        return this.rng.shuffle(pool).slice(0, count).map((id) => this.toCard(id));
    }

    toCard(spellId) {
        const def = SPELLS[spellId];
        const level = this.profile.spellLevel(spellId);
        return {
            id: `spell:${spellId}`,
            spellId,
            name: def.name,
            description: def.description,
            rarity: 'rare',
            type: 'spell',
            element: def.element,
            meta: `${def.element.toUpperCase()} · ${def.baseDamage}+${def.elementalDamage} dmg · ${def.cooldown}s${level ? ` · Lv ${level}` : ''}`,
            effects: [{ type: 'addSpell', spellId }],
        };
    }
}
