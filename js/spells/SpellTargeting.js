/**
 * SpellTargeting — registry of targeting modes.
 *
 * A mode returns the targets a spell should cast at this tick (empty array =
 * don't cast yet). Spells reference modes by name (`targeting: 'nearest'`).
 *
 * To add a mode (e.g. 'lowestHp', 'cluster'), call SpellTargeting.register().
 */
const MODES = new Map();

export const SpellTargeting = {
    register(mode, fn) { MODES.set(mode, fn); },

    select(spell, ctx) {
        const mode = MODES.get(spell.def.targeting) ?? MODES.get('nearest');
        return mode(spell, ctx, {
            origin: spell.owner.pos,
            range: spell.getStat('range'),
            count: Math.max(1, Math.round(spell.getStat('targetCount'))),
        });
    },
};

SpellTargeting.register('nearest', (spell, ctx, { origin, range, count }) =>
    ctx.targeting.sorted(origin, range, count, (a, b) => a.pos.distanceSqTo(origin) - b.pos.distanceSqTo(origin)));

SpellTargeting.register('strongest', (spell, ctx, { origin, range, count }) =>
    ctx.targeting.sorted(origin, range, count, (a, b) => b.hp - a.hp));

SpellTargeting.register('weakest', (spell, ctx, { origin, range, count }) =>
    ctx.targeting.sorted(origin, range, count, (a, b) => a.hp - b.hp));

SpellTargeting.register('random', (spell, ctx, { origin, range, count }) =>
    ctx.rng.shuffle(ctx.targeting.inRadius(origin, range)).slice(0, count));

/** 'self' casts centred on the caster, but only when an enemy is in range. */
SpellTargeting.register('self', (spell, ctx, { origin, range }) =>
    (ctx.targeting.nearest(origin, range) ? [spell.owner] : []));
