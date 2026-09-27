import { ELEMENTS } from '../config/elementConfig.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * ElementSystem — the ONLY place elemental math happens.
 *
 * RESISTANCE: target.resistances[element] (0.4 = takes 40% less, -0.25 = weakness).
 *             Normal enemies are capped at `maxNormalEnemyResistance`, so they can
 *             never be fully immune even if misconfigured.
 * IMMUNITY:   target.immunities includes element AND target.canBeImmune
 *             (bosses/minibosses only) -> elemental damage is exactly 0.
 *
 * New elements (poison, ice...) only need an entry in elementConfig.js.
 */
export class ElementSystem {
    constructor({ elements = ELEMENTS, limits = GAME_CONFIG.limits } = {}) {
        this.elements = elements;
        this.limits = limits;
    }

    get(elementId) { return this.elements[elementId]; }
    color(elementId) { return this.elements[elementId]?.color ?? '#ffffff'; }

    isImmune(target, element) {
        return Boolean(target.canBeImmune && target.immunities?.includes(element));
    }

    /** Damage multiplier for `element` against `target` (0 when immune). */
    getMultiplier(target, element) {
        if (!element) return 1;
        if (this.isImmune(target, element)) return 0;
        let resistance = target.resistances?.[element] ?? 0;
        if (!target.canBeImmune) resistance = Math.min(resistance, this.limits.maxNormalEnemyResistance);
        return 1 - resistance;
    }

    /**
     * @returns {{ amount: number, immune: boolean, multiplier: number }}
     */
    resolve(element, amount, target) {
        if (!element || amount <= 0) return { amount: 0, immune: false, multiplier: 1 };
        const multiplier = this.getMultiplier(target, element);
        return { amount: amount * multiplier, immune: multiplier === 0, multiplier };
    }
}
