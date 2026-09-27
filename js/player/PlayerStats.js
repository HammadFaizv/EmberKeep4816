import { applyOp } from '../utils/MathUtils.js';

/**
 * PlayerStats — base values plus stackable modifiers.
 *
 *   final = (base + Σadd) × Πmul        ('set' modifiers override everything)
 *
 * Stat keys are open-ended strings, so `elementDamage.poison` works the moment
 * something grants it (unknown stats default to 0). Every modifier carries a
 * `source` ('upgrade:hp_1', 'card:focus', 'pet:fire_sprite') so it can be
 * inspected or removed.
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

    addModifier({ stat, op = 'add', value, source = 'unknown' }) {
        this.modifiers.push({ stat, op, value, source });
        this._cache.clear();
    }

    removeBySource(source) {
        this.modifiers = this.modifiers.filter((m) => m.source !== source);
        this._cache.clear();
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
        copy.modifiers = [...this.modifiers];
        return copy;
    }
}
