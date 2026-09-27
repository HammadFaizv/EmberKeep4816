/**
 * Pet definitions. Pets are adopted from the Animal Caretaker and equipped into
 * pet slots (slot count comes from the `petSlots` stat, raised by upgrades).
 *
 * `effects` use the shared effect format understood by progression/EffectRegistry.js,
 * so a pet can grant anything a card or upgrade can.
 * `ability` is a hidden spell id (spellConfig.js) the pet casts on its own;
 * it uses the doll's stats, so damage upgrades strengthen pets too.
 */
export const PETS = Object.freeze({
    fire_sprite: {
        id: 'fire_sprite',
        name: 'Ember Sprite',
        element: 'fire',
        description: '+15% Fire damage. Spits small fireballs.',
        costs: [{ type: 'currency', id: 'gold', amount: 120 }],
        effects: [{ type: 'stat', stat: 'elementDamage.fire', op: 'add', value: 0.15 }],
        ability: 'pet_ember',
        render: { shape: 'pet', sprite: 'pet_ember', color: '#ff7a2f' },
    },
    thunder_hound: {
        id: 'thunder_hound',
        name: 'Storm Pup',
        element: 'thunder',
        description: '+15% Thunder damage. Zaps nearby enemies.',
        costs: [{ type: 'currency', id: 'gold', amount: 120 }],
        effects: [{ type: 'stat', stat: 'elementDamage.thunder', op: 'add', value: 0.15 }],
        ability: 'pet_zap',
        render: { shape: 'pet', sprite: 'pet_pup', color: '#ffe14d' },
    },
    wind_hawk: {
        id: 'wind_hawk',
        name: 'Gale Hawk',
        element: 'wind',
        description: '+15% Wind damage. Dives at enemies with gusts.',
        costs: [{ type: 'currency', id: 'gold', amount: 120 }],
        effects: [{ type: 'stat', stat: 'elementDamage.wind', op: 'add', value: 0.15 }],
        ability: 'pet_gust',
        render: { shape: 'pet', sprite: 'pet_hawk', color: '#7fe3c4' },
    },
    frost_fox: {
        id: 'frost_fox',
        name: 'Frost Fox',
        element: 'ice',
        description: '+15% Ice damage and +10% Ice resistance. Breathes chilling mist.',
        costs: [{ type: 'currency', id: 'gold', amount: 160 }],
        effects: [
            { type: 'stat', stat: 'elementDamage.ice', op: 'add', value: 0.15 },
            { type: 'stat', stat: 'resist.ice', op: 'add', value: 0.1 },
        ],
        ability: 'pet_frost',
        render: { shape: 'pet', sprite: 'pet_fox', color: '#bfeaff' },
    },
});
