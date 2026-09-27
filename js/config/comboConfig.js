/**
 * Spell combos (elemental reactions), unlocked by the 'Spell Resonance'
 * upgrade (feature `spellCombos`).
 *
 * A combo triggers when a hit of `element` lands on an enemy carrying
 * `status`. `consume` removes that status. `effects` run through the effect
 * registry in combat/ComboSystem.js:
 *   damageMult  { mult }                     multiply this hit
 *   explode     { radius, element, damage, perStack? } area burst around the target
 *   spread      { radius, status, max }      copy the status to nearby enemies
 *   applyStatus { status: {...} }            add a status to the target
 *
 * Adding a combo is data only. Adding a new kind of reaction is one
 * ComboSystem.registerEffect() call.
 */
export const COMBOS = Object.freeze([
    {
        id: 'melt', name: 'Melt', element: 'fire', status: 'freeze', consume: true, color: '#ffb36b',
        description: 'Fire on a frozen enemy deals double damage.',
        effects: [{ type: 'damageMult', mult: 2 }],
    },
    {
        id: 'thaw', name: 'Thaw', element: 'fire', status: 'chill', consume: true, color: '#ffc58a',
        description: 'Fire on a chilled enemy deals +50% damage.',
        effects: [{ type: 'damageMult', mult: 1.5 }],
    },
    {
        id: 'shatter', name: 'Shatter', element: 'thunder', status: 'freeze', consume: true, color: '#cfefff',
        description: 'Thunder shatters frozen enemies, bursting ice shards around them.',
        effects: [{ type: 'explode', radius: 85, element: 'ice', damage: 22 }],
    },
    {
        id: 'wildfire', name: 'Wildfire', element: 'wind', status: 'burn', consume: false, color: '#ff8a3d',
        description: 'Wind spreads burning to nearby enemies.',
        effects: [{ type: 'spread', radius: 110, status: 'burn', max: 4 }],
    },
    {
        id: 'toxic_blast', name: 'Toxic Blast', element: 'fire', status: 'poison', consume: true, color: '#b6ff6b',
        description: 'Fire ignites poison: an explosion scaling with poison stacks.',
        effects: [{ type: 'explode', radius: 90, element: 'poison', damage: 6, perStack: 7 }],
    },
    {
        id: 'contagion', name: 'Contagion', element: 'wind', status: 'poison', consume: false, color: '#9be15d',
        description: 'Wind carries poison to nearby enemies.',
        effects: [{ type: 'spread', radius: 100, status: 'poison', max: 3 }],
    },
    {
        id: 'conduct', name: 'Conduct', element: 'thunder', status: 'chill', consume: true, color: '#fff27a',
        description: 'Thunder on a chilled enemy stuns it.',
        effects: [{ type: 'applyStatus', status: { type: 'stun', duration: 0.8 } }],
    },
]);
