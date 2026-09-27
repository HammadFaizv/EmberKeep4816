/**
 * Spell fusion recipes (feature `spellFusion`, unlocked by the 'Soul Weaving'
 * upgrade).
 *
 * When both `parts` are equipped in a stage, level-ups may offer a
 * "Fuse: <result>" card. Choosing it removes both parts from the SpellBook and
 * equips the fused spell, freeing a spell slot. Fused spell definitions live
 * in spellConfig.js with `fused: true` and the 'fusion' behavior
 * ({ carrier, payload }, see spells/SpellEffects.js).
 *
 * Adding a fusion = one recipe here + one fused spell definition.
 */
export const FUSIONS = Object.freeze([
    { id: 'steam', parts: ['fireball', 'frost_shard'], result: 'steam_bomb' },
    { id: 'storm', parts: ['wind_blade', 'spark'], result: 'storm_blade' },
    { id: 'shatter', parts: ['thunder_strike', 'glacial_nova'], result: 'shatterstorm' },
    { id: 'plague', parts: ['venom_dart', 'gale_ward'], result: 'plague_wind' },
]);
