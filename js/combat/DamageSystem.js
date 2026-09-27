import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * DamageSystem — turns a damage packet into final damage against a target.
 *
 * Packet: { base, element, elemental }
 *   base      physical part, reduced by target defense: base × 100 / (100 + defense)
 *   elemental elemental part, resolved by ElementSystem (resistance / weakness / immunity)
 *
 * Example: Fireball base 20 + fire 15 = 35 before defenses.
 * Against defense 10 and 40% fire resistance: 20×0.909 + 15×0.6 = 27.2
 *
 * Attacker bonuses (damageMult, elemental %) are baked into the packet by
 * whoever builds it (Spell.buildDamagePacket), keeping this system stateless.
 */
export class DamageSystem {
    constructor({ elements, limits = GAME_CONFIG.limits }) {
        this.elements = elements;
        this.limits = limits;
    }

    defenseMultiplier(defense) {
        return 100 / (100 + Math.max(0, defense));
    }

    resolve(packet, target) {
        const physical = (packet.base ?? 0) * this.defenseMultiplier(target.defense ?? 0);
        const elemental = this.elements.resolve(packet.element, packet.elemental ?? 0, target);
        const raw = physical + elemental.amount;
        const total = raw > 0 ? Math.max(this.limits.minDamage, Math.round(raw)) : 0;
        return {
            total,
            physical,
            elemental: elemental.amount,
            element: packet.element,
            immune: elemental.immune,
            weakness: elemental.multiplier > 1,
            resisted: elemental.multiplier < 1 && !elemental.immune,
        };
    }
}
