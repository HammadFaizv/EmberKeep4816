/**
 * Pet definitions. Pets are adopted from the Animal Caretaker and equipped into
 * pet slots (slot count comes from the `petSlots` stat, raised by upgrades).
 *
 * `effects` use the shared effect format understood by progression/EffectRegistry.js,
 * so a pet can grant anything a card or upgrade can (stat bonuses today; e.g.
 * `{ type: 'petAttack', ... }` once a pet-attack effect handler exists).
 */
export const PETS = Object.freeze({
    fire_sprite: {
        id: 'fire_sprite',
        name: 'Ember Sprite',
        element: 'fire',
        description: '+15% Fire damage.',
        costs: [{ type: 'currency', id: 'gold', amount: 120 }],
        effects: [{ type: 'stat', stat: 'elementDamage.fire', op: 'add', value: 0.15 }],
        render: { shape: 'pet', color: '#ff7a2f' },
    },
    thunder_hound: {
        id: 'thunder_hound',
        name: 'Storm Pup',
        element: 'thunder',
        description: '+15% Thunder damage.',
        costs: [{ type: 'currency', id: 'gold', amount: 120 }],
        effects: [{ type: 'stat', stat: 'elementDamage.thunder', op: 'add', value: 0.15 }],
        render: { shape: 'pet', color: '#ffe14d' },
    },
    wind_hawk: {
        id: 'wind_hawk',
        name: 'Gale Hawk',
        element: 'wind',
        description: '+15% Wind damage.',
        costs: [{ type: 'currency', id: 'gold', amount: 120 }],
        effects: [{ type: 'stat', stat: 'elementDamage.wind', op: 'add', value: 0.15 }],
        render: { shape: 'pet', color: '#7fe3c4' },
    },
});
