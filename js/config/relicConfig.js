/**
 * Relics — permanent trinkets sold by the Relic Merchant for Souls and boss
 * materials. Owned relics apply their `effects` (EffectRegistry format) to
 * every stage, exactly like upgrade-tree nodes.
 *
 * `requirements` are ProgressionRequirements that must be met before the relic
 * appears for sale.
 */
const souls = (amount) => ({ type: 'currency', id: 'souls', amount });
const item = (id, amount = 1) => ({ type: 'item', id, amount });

export const RELICS = Object.freeze({
    witch_button: {
        id: 'witch_button',
        name: 'Witch\'s Button',
        element: 'physical',
        description: '+15% EXP gained and 0.5 HP regeneration per second.',
        costs: [souls(12)],
        effects: [
            { type: 'stat', stat: 'expGain', op: 'add', value: 0.15 },
            { type: 'stat', stat: 'regen', op: 'add', value: 0.5 },
        ],
    },
    warden_femur: {
        id: 'warden_femur',
        name: 'Warden\'s Femur',
        element: 'physical',
        description: '+25 max HP and +3 defense.',
        costs: [souls(20), item('bone_crystal')],
        effects: [
            { type: 'stat', stat: 'maxHp', op: 'add', value: 25 },
            { type: 'stat', stat: 'defense', op: 'add', value: 3 },
        ],
    },
    tusk_charm: {
        id: 'tusk_charm',
        name: 'Tusk Charm',
        element: 'wind',
        description: '+10% movement speed and +15% gold value.',
        costs: [souls(20), item('chieftain_tusk')],
        effects: [
            { type: 'stat', stat: 'moveSpeed', op: 'mul', value: 1.1 },
            { type: 'stat', stat: 'goldValue', op: 'add', value: 0.15 },
        ],
    },
    rot_vial: {
        id: 'rot_vial',
        name: 'Vial of Rot',
        element: 'poison',
        description: '+25% Poison damage and +25% Poison resistance.',
        costs: [souls(25), item('rot_gland')],
        effects: [
            { type: 'stat', stat: 'elementDamage.poison', op: 'add', value: 0.25 },
            { type: 'stat', stat: 'resist.poison', op: 'add', value: 0.25 },
        ],
    },
    frost_locket: {
        id: 'frost_locket',
        name: 'Frost Locket',
        element: 'ice',
        description: '+20% Ice damage and +20% Fire resistance.',
        costs: [souls(25)],
        requirements: [{ type: 'completeStageCount', count: 6 }],
        effects: [
            { type: 'stat', stat: 'elementDamage.ice', op: 'add', value: 0.2 },
            { type: 'stat', stat: 'resist.fire', op: 'add', value: 0.2 },
        ],
    },
    iron_core: {
        id: 'iron_core',
        name: 'Iron Core',
        element: 'physical',
        description: '+6 defense and +10% resistance to every element.',
        costs: [souls(35), item('iron_heart')],
        effects: [
            { type: 'stat', stat: 'defense', op: 'add', value: 6 },
            { type: 'stat', stat: 'resist.all', op: 'add', value: 0.1 },
        ],
    },
    reaper_hourglass: {
        id: 'reaper_hourglass',
        name: 'Reaper\'s Hourglass',
        element: 'thunder',
        description: '10% cooldown reduction.',
        costs: [souls(40), item('reaper_shard')],
        effects: [{ type: 'stat', stat: 'cooldownReduction', op: 'add', value: 0.1 }],
    },
    soul_lantern: {
        id: 'soul_lantern',
        name: 'Soul Lantern',
        element: 'physical',
        description: '+1 spell slot.',
        costs: [souls(70), item('soul_shard', 3)],
        effects: [{ type: 'stat', stat: 'spellSlots', op: 'add', value: 1 }],
    },
    heart_ember: {
        id: 'heart_ember',
        name: 'Heart Ember',
        element: 'fire',
        description: '+20% damage for every element. Forged from the Demon Lord\'s heart.',
        costs: [souls(60), item('demon_heart')],
        effects: ['fire', 'thunder', 'wind', 'ice', 'poison']
            .map((el) => ({ type: 'stat', stat: `elementDamage.${el}`, op: 'add', value: 0.2 })),
    },
});
