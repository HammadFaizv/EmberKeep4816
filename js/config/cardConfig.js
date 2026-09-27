/**
 * Level-up card definitions (temporary, per-stage bonuses).
 *
 * Card model: { id, name, description, rarity, type, effects, prerequisites }
 *   effects        applied through progression/EffectRegistry.js
 *   prerequisites  evaluated by progression/CardSystem.js against the running stage
 *   template       optional: expands into one card per spell (see CardSystem generators)
 *                  '{spell}' in name/description is replaced with the spell name.
 *
 * Cards never reference UI code; the UI just renders whatever CardSystem returns.
 */
export const RARITIES = Object.freeze({
    common: { id: 'common', weight: 60, color: '#b9b4a8' },
    rare: { id: 'rare', weight: 28, color: '#4ea3ff' },
    epic: { id: 'epic', weight: 10, color: '#b66cff' },
    legendary: { id: 'legendary', weight: 2, color: '#ffb347' },
});

export const CARDS = Object.freeze([
    // ---- Stat upgrades --------------------------------------------------
    { id: 'vitality', name: 'Stitched Heart', rarity: 'common', type: 'health',
        description: '+20 max HP and heal 20.',
        effects: [{ type: 'stat', stat: 'maxHp', op: 'add', value: 20 }, { type: 'heal', amount: 20 }] },
    { id: 'swift_feet', name: 'Swift Feet', rarity: 'common', type: 'movement',
        description: '+10% movement speed.',
        effects: [{ type: 'stat', stat: 'moveSpeed', op: 'mul', value: 1.1 }],
        prerequisites: [{ type: 'canMove' }] },
    { id: 'sharpened_soul', name: 'Sharpened Soul', rarity: 'common', type: 'attack',
        description: '+12% spell damage.',
        effects: [{ type: 'stat', stat: 'damageMult', op: 'add', value: 0.12 }] },
    { id: 'quick_hands', name: 'Quick Hands', rarity: 'common', type: 'attackSpeed',
        description: '+12% attack speed.',
        effects: [{ type: 'stat', stat: 'attackSpeedMult', op: 'add', value: 0.12 }] },
    { id: 'focus', name: 'Focus', rarity: 'rare', type: 'cooldown',
        description: '8% cooldown reduction.',
        effects: [{ type: 'stat', stat: 'cooldownReduction', op: 'add', value: 0.08 }] },
    { id: 'thirsting_doll', name: 'Thirsting Doll', rarity: 'rare', type: 'lifesteal',
        description: 'Heal for 3% of damage dealt.',
        effects: [{ type: 'stat', stat: 'lifesteal', op: 'add', value: 0.03 }] },
    { id: 'mending_thread', name: 'Mending Thread', rarity: 'common', type: 'regen',
        description: 'Regenerate 1 HP per second.',
        effects: [{ type: 'stat', stat: 'regen', op: 'add', value: 1 }] },
    { id: 'porcelain_skin', name: 'Porcelain Skin', rarity: 'common', type: 'defense',
        description: '+4 defense.',
        effects: [{ type: 'stat', stat: 'defense', op: 'add', value: 4 }] },
    { id: 'magnet', name: 'Soul Magnet', rarity: 'common', type: 'utility',
        description: '+40% pickup radius.',
        effects: [{ type: 'stat', stat: 'pickupRadius', op: 'mul', value: 1.4 }] },

    // ---- Elemental bonuses ----------------------------------------------
    { id: 'kindling', name: 'Kindling', rarity: 'rare', type: 'element',
        description: '+20% Fire damage.',
        effects: [{ type: 'stat', stat: 'elementDamage.fire', op: 'add', value: 0.2 }],
        prerequisites: [{ type: 'hasSpellWithElement', element: 'fire' }] },
    { id: 'static', name: 'Static Charge', rarity: 'rare', type: 'element',
        description: '+20% Thunder damage.',
        effects: [{ type: 'stat', stat: 'elementDamage.thunder', op: 'add', value: 0.2 }],
        prerequisites: [{ type: 'hasSpellWithElement', element: 'thunder' }] },
    { id: 'tailwind', name: 'Tailwind', rarity: 'rare', type: 'element',
        description: '+20% Wind damage.',
        effects: [{ type: 'stat', stat: 'elementDamage.wind', op: 'add', value: 0.2 }],
        prerequisites: [{ type: 'hasSpellWithElement', element: 'wind' }] },

    // ---- Temporary stage effects -----------------------------------------
    { id: 'second_wind', name: 'Second Wind', rarity: 'epic', type: 'stageEffect',
        description: 'Fully restore HP.',
        effects: [{ type: 'heal', amount: 'full' }] },
    // TODO: Timed stage effects (e.g. "Frenzy: +50% attack speed for 20s") need a
    // `timedStat` effect handler in EffectRegistry that registers an expiring
    // modifier with PlayerStats (source + remaining time, ticked by Player.update).

    // ---- Spell cards (templates expanded per spell by CardSystem) ----------
    { id: 'new_spell', template: 'perAvailableSpell', name: 'Learn: {spell}', rarity: 'rare', type: 'spell',
        description: 'Add {spell} to your stage loadout.',
        effects: [{ type: 'addSpell' }],
        prerequisites: [{ type: 'freeSpellSlot' }] },
    { id: 'empower_spell', template: 'perEquippedSpell', name: 'Empower: {spell}', rarity: 'common', type: 'spellMod',
        description: '{spell} deals +25% base and elemental damage.',
        effects: [
            { type: 'spellMod', stat: 'baseDamage', op: 'mul', value: 1.25 },
            { type: 'spellMod', stat: 'elementalDamage', op: 'mul', value: 1.25 },
        ] },
    { id: 'hasten_spell', template: 'perEquippedSpell', name: 'Hasten: {spell}', rarity: 'rare', type: 'spellMod',
        description: '{spell} cooldown -15%.',
        effects: [{ type: 'spellMod', stat: 'cooldown', op: 'mul', value: 0.85 }] },
    { id: 'multiply_spell', template: 'perEquippedSpell', name: 'Split: {spell}', rarity: 'epic', type: 'spellMod',
        description: '{spell} hits +1 additional target.',
        effects: [{ type: 'spellMod', stat: 'targetCount', op: 'add', value: 1 }] },
]);
