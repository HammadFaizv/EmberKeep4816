import { Events } from '../core/EventBus.js';
import { Effect } from '../entities/Effect.js';
import { COMBOS } from '../config/comboConfig.js';

/**
 * ComboSystem — elemental reactions between an incoming hit and a status the
 * target already carries (fire + frozen = Melt, wind + burning = Wildfire...).
 *
 * Stage-scoped and only active when the persistent `spellCombos` feature is
 * unlocked (Spell Resonance upgrade). CombatSystem calls beforeHit() for every
 * spell hit; a combo may change the packet (damageMult) and/or trigger side
 * effects. Side-effect damage is applied with combos disabled, so reactions
 * never chain into infinite loops.
 */
const EFFECTS = new Map();

export class ComboSystem {
    static registerEffect(type, fn) { EFFECTS.set(type, fn); }

    constructor({ enabled, statuses, stage, bus, combos = COMBOS }) {
        this.enabled = enabled;
        this.statuses = statuses;
        this.stage = stage;
        this.bus = bus;
        this.combos = combos;
        this.combat = null; // set by CombatSystem
        this.counts = new Map();
    }

    beforeHit(packet, enemy, sourcePos) {
        if (!this.enabled || !packet.element) return packet;
        let result = packet;
        for (const combo of this.combos) {
            if (combo.element !== packet.element) continue;
            const status = this.statuses.get(enemy, combo.status);
            if (!status) continue;
            if (combo.consume) this.statuses.remove(enemy, combo.status);
            for (const effect of combo.effects) {
                result = EFFECTS.get(effect.type)?.(effect, { packet: result, enemy, status, sourcePos, system: this, combo }) ?? result;
            }
            this.counts.set(combo.id, (this.counts.get(combo.id) ?? 0) + 1);
            this.combat.floatingText({ x: enemy.pos.x, y: enemy.pos.y - enemy.radius - 14 }, combo.name, combo.color, 15, 0.8);
            this.bus.emit(Events.COMBO_TRIGGERED, { combo, enemy });
        }
        return result;
    }
}

ComboSystem.registerEffect('damageMult', (e, { packet }) => ({
    ...packet, base: packet.base * e.mult, elemental: packet.elemental * e.mult,
}));

ComboSystem.registerEffect('explode', (e, { enemy, status, system, combo }) => {
    const damage = e.damage + (e.perStack ?? 0) * (status.stacks ?? 1);
    const center = enemy.pos.clone();
    system.stage.spawnEffect(new Effect({ kind: 'ring', x: center.x, y: center.y, duration: 0.35,
        data: { radius: e.radius, color: combo.color, fill: true } }));
    for (const other of system.stage.targeting.inRadius(center, e.radius)) {
        if (other === enemy) continue;
        system.combat.applySpellHit({ base: 0, element: e.element, elemental: damage }, other, center, { combos: false });
    }
    // The target itself takes the burst on top of the triggering hit.
    system.combat.applySpellHit({ base: 0, element: e.element, elemental: damage }, enemy, center, { combos: false });
});

ComboSystem.registerEffect('spread', (e, { enemy, status, system, combo }) => {
    const targets = system.stage.targeting.inRadius(enemy.pos, e.radius)
        .filter((o) => o !== enemy && !system.statuses.has(o, e.status))
        .slice(0, e.max ?? 3);
    for (const other of targets) {
        system.statuses.apply(other, { ...status, remaining: undefined, duration: status.duration ?? 2 }, status.source);
        system.stage.spawnEffect(new Effect({ kind: 'bolt', x: enemy.pos.x, y: enemy.pos.y, duration: 0.2,
            data: { to: other.pos.clone(), color: combo.color } }));
    }
});

ComboSystem.registerEffect('applyStatus', (e, { enemy, system }) => {
    system.statuses.apply(enemy, e.status);
});
