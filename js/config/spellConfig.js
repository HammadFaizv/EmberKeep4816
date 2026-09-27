/**
 * Spell definitions.
 *
 * `behavior` picks the cast implementation registered in spells/SpellEffects.js.
 * `targeting` picks a targeting mode registered in spells/SpellTargeting.js.
 * `statusEffects` are applied on hit by combat/StatusEffectSystem.js.
 *
 * Adding a spell usually means adding one entry here. Only brand-new mechanics
 * need a new behavior in SpellEffects.js.
 *
 * shop.unlockCosts / shop.upgrades use the generic cost format
 *   [{ type: 'currency', id: 'gold', amount }, { type: 'item', id, amount }]
 * so spells can later require boss materials without code changes.
 */
export const SPELLS = Object.freeze({
    fireball: {
        id: 'fireball',
        name: 'Fireball',
        description: 'Hurls a ball of fire at the nearest enemy.',
        behavior: 'projectile',
        targeting: 'nearest',
        element: 'fire',
        baseDamage: 12,
        elementalDamage: 8,
        cooldown: 1.1,
        range: 380,
        projectileSpeed: 420,
        areaRadius: 0,
        targetCount: 1,
        pierce: 0,
        statusEffects: [{ type: 'burn', duration: 2, dps: 3 }],
        visual: { shape: 'orb', color: '#ff7a2f', size: 7 },
        shop: {
            unlockCosts: [],
            upgrades: [
                { costs: [{ type: 'currency', id: 'gold', amount: 40 }], mods: [{ stat: 'elementalDamage', op: 'add', value: 4 }] },
                { costs: [{ type: 'currency', id: 'gold', amount: 90 }], mods: [{ stat: 'cooldown', op: 'mul', value: 0.85 }] },
                { costs: [{ type: 'currency', id: 'gold', amount: 180 }], mods: [{ stat: 'targetCount', op: 'add', value: 1 }] },
            ],
        },
    },

    spark: {
        id: 'spark',
        name: 'Chain Spark',
        description: 'Lightning that leaps between nearby enemies.',
        behavior: 'chain',
        targeting: 'nearest',
        element: 'thunder',
        baseDamage: 7,
        elementalDamage: 10,
        cooldown: 1.25,
        range: 300,
        projectileSpeed: 0,
        areaRadius: 0,
        targetCount: 1,
        chainCount: 3,
        chainRange: 140,
        statusEffects: [{ type: 'stun', duration: 0.25, chance: 0.2 }],
        visual: { shape: 'bolt', color: '#ffe14d', size: 3 },
        shop: {
            unlockCosts: [],
            upgrades: [
                { costs: [{ type: 'currency', id: 'gold', amount: 50 }], mods: [{ stat: 'chainCount', op: 'add', value: 1 }] },
                { costs: [{ type: 'currency', id: 'gold', amount: 110 }], mods: [{ stat: 'elementalDamage', op: 'add', value: 5 }] },
            ],
        },
    },

    wind_blade: {
        id: 'wind_blade',
        name: 'Wind Blade',
        description: 'A fast crescent of wind that pierces through enemies.',
        behavior: 'projectile',
        targeting: 'nearest',
        element: 'wind',
        baseDamage: 9,
        elementalDamage: 5,
        cooldown: 0.9,
        range: 420,
        projectileSpeed: 620,
        areaRadius: 0,
        targetCount: 1,
        pierce: 3,
        knockback: 60,
        statusEffects: [],
        visual: { shape: 'crescent', color: '#7fe3c4', size: 9 },
        shop: {
            unlockCosts: [],
            upgrades: [
                { costs: [{ type: 'currency', id: 'gold', amount: 45 }], mods: [{ stat: 'pierce', op: 'add', value: 2 }] },
                { costs: [{ type: 'currency', id: 'gold', amount: 100 }], mods: [{ stat: 'baseDamage', op: 'add', value: 4 }] },
            ],
        },
    },

    flame_nova: {
        id: 'flame_nova',
        name: 'Flame Nova',
        description: 'Erupts in a ring of fire around the doll.',
        behavior: 'nova',
        targeting: 'self',
        element: 'fire',
        baseDamage: 8,
        elementalDamage: 14,
        cooldown: 3.2,
        range: 130,
        projectileSpeed: 0,
        areaRadius: 130,
        targetCount: 99,
        statusEffects: [{ type: 'burn', duration: 3, dps: 4 }],
        visual: { shape: 'ring', color: '#ff5a1f', size: 130 },
        shop: {
            unlockCosts: [{ type: 'currency', id: 'gold', amount: 120 }],
            upgrades: [
                { costs: [{ type: 'currency', id: 'gold', amount: 120 }], mods: [{ stat: 'areaRadius', op: 'mul', value: 1.2 }, { stat: 'range', op: 'mul', value: 1.2 }] },
            ],
        },
    },

    thunder_strike: {
        id: 'thunder_strike',
        name: 'Thunder Strike',
        description: 'Calls lightning onto the toughest enemy nearby, hitting everything around it.',
        behavior: 'strike',
        targeting: 'strongest',
        element: 'thunder',
        baseDamage: 10,
        elementalDamage: 22,
        cooldown: 2.8,
        range: 450,
        projectileSpeed: 0,
        areaRadius: 70,
        targetCount: 1,
        statusEffects: [{ type: 'stun', duration: 0.5, chance: 0.5 }],
        visual: { shape: 'strike', color: '#fff27a', size: 70 },
        shop: {
            unlockCosts: [{ type: 'currency', id: 'gold', amount: 160 }],
            upgrades: [
                { costs: [{ type: 'currency', id: 'gold', amount: 150 }], mods: [{ stat: 'targetCount', op: 'add', value: 1 }] },
            ],
        },
    },

    gale_ward: {
        id: 'gale_ward',
        name: 'Gale Ward',
        description: 'A whirling barrier of wind that shoves enemies away and slows them.',
        behavior: 'nova',
        targeting: 'self',
        element: 'wind',
        baseDamage: 4,
        elementalDamage: 6,
        cooldown: 2.2,
        range: 95,
        projectileSpeed: 0,
        areaRadius: 95,
        targetCount: 99,
        knockback: 140,
        statusEffects: [{ type: 'slow', duration: 1.5, amount: 0.4 }],
        visual: { shape: 'ring', color: '#9ff5dc', size: 95 },
        shop: {
            // Example of a multi-resource cost: gold plus a boss material.
            unlockCosts: [
                { type: 'currency', id: 'gold', amount: 150 },
                { type: 'item', id: 'bone_crystal', amount: 1 },
            ],
            upgrades: [],
        },
    },
});
