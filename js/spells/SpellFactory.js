import { Spell } from './Spell.js';
import { SPELLS } from '../config/spellConfig.js';
import { SPELL_BEHAVIORS } from './SpellEffects.js';

/**
 * SpellFactory — creates Spell instances from definitions.
 *
 * Behaviors are looked up by `def.behavior`; spells that need bespoke code can
 * register their own Spell subclass with registerClass(spellId, cls).
 */
export class SpellFactory {
    constructor({ definitions = SPELLS } = {}) {
        this.definitions = definitions;
        this.behaviors = new Map(Object.entries(SPELL_BEHAVIORS));
        this.classes = new Map();
    }

    registerBehavior(name, behavior) { this.behaviors.set(name, behavior); }
    registerClass(spellId, cls) { this.classes.set(spellId, cls); }

    create(spellId, { owner, level = 0 }) {
        const def = this.definitions[spellId];
        if (!def) throw new Error(`SpellFactory: unknown spell "${spellId}"`);
        const behavior = this.behaviors.get(def.behavior);
        if (!behavior) throw new Error(`SpellFactory: unknown behavior "${def.behavior}" for ${spellId}`);
        const Cls = this.classes.get(spellId) ?? Spell;
        return new Cls(def, { owner, level, behavior });
    }
}
