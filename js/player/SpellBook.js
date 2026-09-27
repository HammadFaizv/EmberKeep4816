/**
 * SpellBook — the player's EQUIPPED spells for the current stage.
 *
 * Three separate concepts (never mix them):
 *   UNLOCKED   profile.data.unlockedSpells — owned permanently (SpellShop).
 *   AVAILABLE  spells that may be offered in this stage (SpellManager filters
 *              unlocked spells by stage rules).
 *   EQUIPPED   spells in this SpellBook, limited by the `spellSlots` stat.
 *
 * The SpellBook is temporary and discarded when the stage ends.
 */
export class SpellBook {
    constructor({ owner, spellFactory, profile }) {
        this.owner = owner;
        this.spellFactory = spellFactory;
        this.profile = profile;
        this.spells = [];
    }

    get slots() { return Math.floor(this.owner.stats.get('spellSlots')); }
    hasFreeSlot() { return this.spells.length < this.slots; }
    has(spellId) { return this.spells.some((s) => s.id === spellId); }
    get(spellId) { return this.spells.find((s) => s.id === spellId); }

    addSpell(spellId) {
        if (this.has(spellId) || !this.hasFreeSlot()) return null;
        const spell = this.spellFactory.create(spellId, {
            owner: this.owner,
            level: this.profile.spellLevel(spellId), // persistent shop upgrades
        });
        this.spells.push(spell);
        return spell;
    }

    update(dt, ctx) {
        for (const spell of this.spells) spell.update(dt, ctx);
    }
}
