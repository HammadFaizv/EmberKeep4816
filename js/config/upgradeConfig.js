/**
 * Permanent upgrade tree (bought with Gold, persists between runs).
 *
 * Node model:
 *   id, name, description, category
 *   position   { x, y } in tree grid units (UpgradeTreeUI lays these out)
 *   requires   parent node ids; ALL must be purchased first
 *   requirements optional extra ProgressionRequirements (e.g. { type: 'completeStage', id })
 *   costs      generic cost list (see CostSystem)
 *   effects    shared effect format (see EffectRegistry) applied at the start of
 *              every stage, or `unlockFeature` effects applied on purchase.
 *
 * Adding an upgrade = adding a node here. A new *kind* of effect is a new
 * handler in EffectRegistry.js.
 */
const gold = (amount) => [{ type: 'currency', id: 'gold', amount }];

export const UPGRADE_CATEGORIES = Object.freeze({
    core: { name: 'Core', color: '#e8d9b0' },
    vitality: { name: 'Vitality', color: '#e05a5a' },
    arcane: { name: 'Arcane', color: '#8f7cff' },
    elements: { name: 'Elements', color: '#ff9a3d' },
    fortune: { name: 'Fortune', color: '#f5c542' },
    companion: { name: 'Companion', color: '#6fd39a' },
});

export const UPGRADES = Object.freeze([
    { id: 'awakening', name: 'Soul Awakening', category: 'core', position: { x: 0, y: 0 },
        description: 'The doll remembers how to fight. +10 max HP.',
        requires: [], costs: gold(10),
        effects: [{ type: 'stat', stat: 'maxHp', op: 'add', value: 10 }] },

    // ---- Vitality branch --------------------------------------------------
    { id: 'hp_1', name: 'Reinforced Seams I', category: 'vitality', position: { x: -3, y: 1 },
        description: '+15 max HP.', requires: ['awakening'], costs: gold(25),
        effects: [{ type: 'stat', stat: 'maxHp', op: 'add', value: 15 }] },
    { id: 'hp_2', name: 'Reinforced Seams II', category: 'vitality', position: { x: -4, y: 2 },
        description: '+25 max HP.', requires: ['hp_1'], costs: gold(70),
        effects: [{ type: 'stat', stat: 'maxHp', op: 'add', value: 25 }] },
    { id: 'regen_1', name: 'Self-Mending', category: 'vitality', position: { x: -4, y: 3 },
        description: 'Regenerate 0.5 HP/s.', requires: ['hp_2'], costs: gold(120),
        effects: [{ type: 'stat', stat: 'regen', op: 'add', value: 0.5 }] },
    { id: 'defense_1', name: 'Porcelain Plating', category: 'vitality', position: { x: -3, y: 2 },
        description: '+3 defense.', requires: ['hp_1'], costs: gold(60),
        effects: [{ type: 'stat', stat: 'defense', op: 'add', value: 3 }] },
    { id: 'defense_2', name: 'Iron Plating', category: 'vitality', position: { x: -3, y: 3 },
        description: '+5 defense.', requires: ['defense_1'], costs: gold(140),
        effects: [{ type: 'stat', stat: 'defense', op: 'add', value: 5 }] },
    { id: 'lifesteal_1', name: 'Soul Siphon', category: 'vitality', position: { x: -3.5, y: 4 },
        description: 'Heal for 2% of damage dealt.', requires: ['regen_1', 'defense_2'], costs: gold(250),
        effects: [{ type: 'stat', stat: 'lifesteal', op: 'add', value: 0.02 }] },
    { id: 'resist_1', name: 'Warded Stitching', category: 'vitality', position: { x: -2.5, y: 4 },
        description: '+10% resistance to every element.', requires: ['defense_2'], costs: gold(180),
        effects: [{ type: 'stat', stat: 'resist.all', op: 'add', value: 0.1 }] },

    // ---- Arcane branch ----------------------------------------------------
    { id: 'damage_1', name: 'Arcane Focus I', category: 'arcane', position: { x: -1, y: 1 },
        description: '+8% spell damage.', requires: ['awakening'], costs: gold(30),
        effects: [{ type: 'stat', stat: 'damageMult', op: 'add', value: 0.08 }] },
    { id: 'damage_2', name: 'Arcane Focus II', category: 'arcane', position: { x: -1.5, y: 2 },
        description: '+12% spell damage.', requires: ['damage_1'], costs: gold(90),
        effects: [{ type: 'stat', stat: 'damageMult', op: 'add', value: 0.12 }] },
    { id: 'attack_speed_1', name: 'Quickened Casting', category: 'arcane', position: { x: -0.5, y: 2 },
        description: '+10% attack speed.', requires: ['damage_1'], costs: gold(80),
        effects: [{ type: 'stat', stat: 'attackSpeedMult', op: 'add', value: 0.1 }] },
    { id: 'cdr_1', name: 'Flowing Mana I', category: 'arcane', position: { x: -1.5, y: 3 },
        description: '5% global spell cooldown reduction.', requires: ['damage_2'], costs: gold(130),
        effects: [{ type: 'stat', stat: 'cooldownReduction', op: 'add', value: 0.05 }] },
    { id: 'spell_slot_1', name: 'Second Spell Slot', category: 'arcane', position: { x: -0.5, y: 3 },
        description: '+1 spell slot.', requires: ['attack_speed_1'], costs: gold(150),
        effects: [{ type: 'stat', stat: 'spellSlots', op: 'add', value: 1 }] },
    { id: 'spell_slot_2', name: 'Third Spell Slot', category: 'arcane', position: { x: -0.5, y: 4 },
        description: '+1 spell slot.', requires: ['spell_slot_1'], costs: gold(400),
        effects: [{ type: 'stat', stat: 'spellSlots', op: 'add', value: 1 }] },
    { id: 'spell_combos', name: 'Spell Resonance', category: 'arcane', position: { x: -1.5, y: 4 },
        description: 'Unlocks spell combos: elemental reactions such as Melt (fire on frozen), Wildfire (wind on burning) and Shatter.',
        requires: ['cdr_1', 'spell_slot_1'], costs: gold(500),
        effects: [{ type: 'unlockFeature', id: 'spellCombos' }] },
    { id: 'spell_fusion', name: 'Soul Weaving', category: 'arcane', position: { x: -1.5, y: 5 },
        description: 'Unlocks spell fusion: level-ups may offer to merge two equipped spells into a stronger one.',
        requires: ['spell_combos'], costs: gold(650),
        effects: [{ type: 'unlockFeature', id: 'spellFusion' }] },

    // ---- Elements branch --------------------------------------------------
    { id: 'fire_1', name: 'Fire Attunement', category: 'elements', position: { x: 1, y: 1 },
        description: '+10% Fire damage.', requires: ['awakening'], costs: gold(40),
        effects: [{ type: 'stat', stat: 'elementDamage.fire', op: 'add', value: 0.1 }] },
    { id: 'thunder_1', name: 'Thunder Attunement', category: 'elements', position: { x: 1, y: 2 },
        description: '+10% Thunder damage.', requires: ['fire_1'], costs: gold(60),
        effects: [{ type: 'stat', stat: 'elementDamage.thunder', op: 'add', value: 0.1 }] },
    { id: 'wind_1', name: 'Wind Attunement', category: 'elements', position: { x: 2, y: 2 },
        description: '+10% Wind damage.', requires: ['fire_1'], costs: gold(60),
        effects: [{ type: 'stat', stat: 'elementDamage.wind', op: 'add', value: 0.1 }] },
    { id: 'ice_1', name: 'Ice Attunement', category: 'elements', position: { x: 0.25, y: 2 },
        description: '+10% Ice damage.', requires: ['fire_1'], costs: gold(60),
        effects: [{ type: 'stat', stat: 'elementDamage.ice', op: 'add', value: 0.1 }] },
    { id: 'poison_1', name: 'Poison Attunement', category: 'elements', position: { x: 0.5, y: 3 },
        description: '+10% Poison damage.', requires: ['ice_1'], costs: gold(80),
        effects: [{ type: 'stat', stat: 'elementDamage.poison', op: 'add', value: 0.1 }] },
    { id: 'elements_2', name: 'Elemental Mastery', category: 'elements', position: { x: 1.5, y: 3 },
        description: '+10% damage for every element.', requires: ['thunder_1', 'wind_1'], costs: gold(220),
        effects: ['fire', 'thunder', 'wind', 'ice', 'poison']
            .map((element) => ({ type: 'stat', stat: `elementDamage.${element}`, op: 'add', value: 0.1 })) },

    // ---- Fortune branch ---------------------------------------------------
    { id: 'gold_1', name: 'Grave Robber I', category: 'fortune', position: { x: 3, y: 1 },
        description: '+3% gold drop chance.', requires: ['awakening'], costs: gold(35),
        effects: [{ type: 'stat', stat: 'goldDropChance', op: 'add', value: 0.03 }] },
    { id: 'gold_value_1', name: 'Gilded Stitch', category: 'fortune', position: { x: 4, y: 1 },
        description: 'Gold coins are worth 20% more.', requires: ['gold_1'], costs: gold(90),
        effects: [{ type: 'stat', stat: 'goldValue', op: 'add', value: 0.2 }] },
    { id: 'gold_2', name: 'Grave Robber II', category: 'fortune', position: { x: 3, y: 2 },
        description: '+5% gold drop chance.', requires: ['gold_1'], costs: gold(110),
        effects: [{ type: 'stat', stat: 'goldDropChance', op: 'add', value: 0.05 }] },
    { id: 'exp_1', name: 'Quick Study', category: 'fortune', position: { x: 4, y: 2 },
        description: '+15% EXP gained in stages.', requires: ['gold_1'], costs: gold(80),
        effects: [{ type: 'stat', stat: 'expGain', op: 'add', value: 0.15 }] },
    { id: 'move_1', name: 'Light Stuffing', category: 'fortune', position: { x: 4, y: 3 },
        description: '+8% movement speed.', requires: ['exp_1'], costs: gold(100),
        effects: [{ type: 'stat', stat: 'moveSpeed', op: 'mul', value: 1.08 }] },
    { id: 'exp_2', name: 'Prodigy', category: 'fortune', position: { x: 3, y: 3 },
        description: '+25% EXP gained in stages.', requires: ['gold_2', 'exp_1'], costs: gold(260),
        effects: [{ type: 'stat', stat: 'expGain', op: 'add', value: 0.25 }] },

    // ---- Companion branch -------------------------------------------------
    { id: 'pet_slot_1', name: 'Kindred Bond', category: 'companion', position: { x: 2.5, y: 4 },
        description: 'Unlocks your first pet slot.', requires: ['elements_2'],
        requirements: [{ type: 'featureUnlocked', id: 'pets' }], costs: gold(150),
        effects: [{ type: 'stat', stat: 'petSlots', op: 'add', value: 1 }] },
    { id: 'pet_slot_2', name: 'Pack Leader', category: 'companion', position: { x: 2.5, y: 5 },
        description: '+1 pet slot.', requires: ['pet_slot_1'], costs: gold(450),
        effects: [{ type: 'stat', stat: 'petSlots', op: 'add', value: 1 }] },
]);
