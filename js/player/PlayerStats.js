import { applyOp } from '../utils/MathUtils.js';

/**
 * PlayerStats — base values plus stackable modifiers.
 *
 *   final = (base + Σadd) × Πmul        ('set' modifiers override everything)
 *
 * Stat keys are open-ended strings, so `elementDamage.poison` or `resist.ice`
 * work the moment something grants them (unknown stats default to 0). Every
 * modifier carries a `source` ('upgrade:hp_1', 'card:focus', 'pet:fire_sprite')
 * so it can be inspected or removed.
 *
 * Timed modifiers (card buffs like "Frenzy") carry `remaining` seconds and
 * expire through tick(dt), which the Player calls every update.
 */
export class PlayerStats {
    constructor(baseStats = {}) {
        this.base = { ...baseStats };
        this.modifiers = [];
        this._cache = new Map();
    }

    setBase(stat, value) {
        this.base[stat] = value;
        this._cache.clear();
    }

    addModifier({ stat, op = 'add', value, source = 'unknown', duration = null, label = null }) {
        this.modifiers.push({ stat, op, value, source, remaining: duration, duration, label });
        this._cache.clear();
    }

    removeBySource(source) {
        this.modifiers = this.modifiers.filter((m) => m.source !== source);
        this._cache.clear();
    }

    /** Counts down timed modifiers. Returns the labels of buffs that just expired. */
    tick(dt) {
        let expired = null;
        for (const m of this.modifiers) {
            if (m.remaining === null) continue;
            m.remaining -= dt;
            if (m.remaining <= 0) (expired ??= []).push(m.label ?? m.source);
        }
        if (!expired) return null;
        this.modifiers = this.modifiers.filter((m) => m.remaining === null || m.remaining > 0);
        this._cache.clear();
        return [...new Set(expired)];
    }

    /** Active timed buffs grouped by source, for the HUD. */
    activeBuffs() {
        const bySource = new Map();
        for (const m of this.modifiers) {
            if (m.remaining === null) continue;
            const current = bySource.get(m.source);
            if (!current || m.remaining > current.remaining) {
                bySource.set(m.source, { source: m.source, label: m.label ?? m.source, remaining: m.remaining, duration: m.duration });
            }
        }
        return [...bySource.values()];
    }

    get(stat) {
        if (this._cache.has(stat)) return this._cache.get(stat);
        let value = this.base[stat] ?? 0;
        const mods = this.modifiers.filter((m) => m.stat === stat);
        const setMod = mods.findLast((m) => m.op === 'set');
        if (setMod) {
            value = setMod.value;
        } else {
            for (const m of mods) if (m.op === 'add') value = applyOp(value, 'add', m.value);
            for (const m of mods) if (m.op === 'mul') value = applyOp(value, 'mul', m.value);
        }
        this._cache.set(stat, value);
        return value;
    }

    /** Elemental damage bonus for an element, e.g. 0.15 = +15%. */
    elementBonus(element) {
        return this.get(`elementDamage.${element}`);
    }

    clone() {
        const copy = new PlayerStats(this.base);
        copy.modifiers = this.modifiers.map((m) => ({ ...m }));
        return copy;
    }
}
