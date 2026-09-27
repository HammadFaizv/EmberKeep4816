/**
 * EffectRegistry — one shared vocabulary of effects for cards, permanent
 * upgrades, relics and pets.
 *
 * An effect is data, e.g. { type: 'stat', stat: 'maxHp', op: 'add', value: 20 }.
 * apply(effects, target, source) routes each effect to its handler. The
 * `target` bag carries whatever the context has:
 *   { stats, player, spellBook, spellId, unlocks, stage, bus }
 * Handlers ignore effects whose target pieces are missing, so an upgrade's
 * `unlockFeature` effect is harmless when stats are being built and vice versa.
 *
 * To add a new effect, register a handler:
 *   EffectRegistry.register('summonAlly', (effect, target, source) => { ... });
 */
const HANDLERS = new Map();

export const EffectRegistry = {
    register(type, handler) {
        HANDLERS.set(type, handler);
    },

    apply(effects = [], target = {}, source = 'unknown') {
        for (const effect of effects) {
            const handler = HANDLERS.get(effect.type);
            if (handler) handler(effect, target, source);
            else console.warn(`EffectRegistry: no handler for "${effect.type}"`);
        }
    },
};

EffectRegistry.register('stat', (e, t, source) => {
    t.stats?.addModifier({ stat: e.stat, op: e.op ?? 'add', value: e.value, source });
});

/**
 * Timed stat buff, e.g. Frenzy: { type: 'timedStat', stat: 'attackSpeedMult', value: 0.5, duration: 20, label: 'Frenzy' }.
 * PlayerStats counts it down (ticked by Player.update) and removes it on expiry.
 */
EffectRegistry.register('timedStat', (e, t, source) => {
    t.stats?.addModifier({ stat: e.stat, op: e.op ?? 'add', value: e.value, source, duration: e.duration, label: e.label });
});

EffectRegistry.register('heal', (e, t) => {
    if (!t.player) return;
    t.player.heal(e.amount === 'full' ? t.player.maxHp : e.amount);
});

EffectRegistry.register('addSpell', (e, t) => {
    const spellId = e.spellId ?? t.spellId;
    if (spellId) t.spellBook?.addSpell(spellId);
});

EffectRegistry.register('spellMod', (e, t, source) => {
    const spellId = e.spellId ?? t.spellId;
    const spell = t.spellBook?.get(spellId);
    spell?.addModifier({ stat: e.stat, op: e.op ?? 'add', value: e.value, source });
});

/** Spell fusion: { type: 'fuseSpells', parts: [a, b], result } (see fusionConfig.js). */
EffectRegistry.register('fuseSpells', (e, t) => {
    const fused = t.spellBook?.fuse(e.parts ?? t.fusion?.parts, e.result ?? t.fusion?.result);
    if (fused) t.onFused?.(fused);
});

/** Defense stages: { type: 'buildStructure', structure: 'arrow_tower' } placed on a free build slot. */
EffectRegistry.register('buildStructure', (e, t) => {
    t.stage?.buildStructure?.(e.structure);
});

EffectRegistry.register('unlockFeature', (e, t) => {
    t.unlocks?.unlockFeature(e.id);
});
