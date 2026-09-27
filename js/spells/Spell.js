import { Cooldown } from '../utils/Timer.js';
import { applyOp } from '../utils/MathUtils.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { SpellTargeting } from './SpellTargeting.js';
import { Events } from '../core/EventBus.js';

/**
 * Spell — a runtime instance of a spell definition inside a stage.
 *
 * Stats resolve in layers:
 *   definition value (spellConfig)
 *   -> persistent shop upgrades (profile.spellUpgrades level)
 *   -> temporary card modifiers (this stage only)
 * Owner stats (damageMult, cooldownReduction, attackSpeed, elemental %) are
 * applied when casting / building damage packets.
 *
 * Spells auto-cast: when the cooldown is ready and SpellTargeting finds a valid
 * target in range, the behavior registered for `def.behavior` runs.
 */
export class Spell {
    constructor(def, { owner, level = 0, behavior }) {
        this.def = def;
        this.id = def.id;
        this.name = def.name;
        this.element = def.element;
        this.owner = owner;
        this.level = level;
        this.behavior = behavior;
        this.modifiers = [];

        // Persistent upgrades bought in the SpellShop.
        (def.shop?.upgrades ?? []).slice(0, level).forEach((upgrade, i) => {
            upgrade.mods.forEach((mod) => this.addModifier({ ...mod, source: `spellUpgrade:${i + 1}` }));
        });

        this.cooldown = new Cooldown(this.effectiveCooldown(), false);
        this.cooldown.remaining = 0.4; // short grace period at stage start
    }

    addModifier({ stat, op = 'add', value, source }) {
        this.modifiers.push({ stat, op, value, source });
    }

    getStat(stat) {
        let value = this.def[stat] ?? 0;
        for (const m of this.modifiers) if (m.stat === stat && m.op === 'add') value = applyOp(value, 'add', m.value);
        for (const m of this.modifiers) if (m.stat === stat && m.op === 'mul') value = applyOp(value, 'mul', m.value);
        return value;
    }

    effectiveCooldown() {
        const stats = this.owner.stats;
        const cdr = Math.min(stats.get('cooldownReduction'), GAME_CONFIG.limits.maxCooldownReduction);
        return (this.getStat('cooldown') * (1 - cdr)) / Math.max(0.1, stats.get('attackSpeedMult'));
    }

    /** Damage packet consumed by DamageSystem via CombatSystem. */
    buildDamagePacket() {
        const stats = this.owner.stats;
        const damageMult = stats.get('damageMult');
        return {
            base: this.getStat('baseDamage') * damageMult,
            element: this.element,
            elemental: this.getStat('elementalDamage') * damageMult * (1 + stats.elementBonus(this.element)),
            knockback: this.getStat('knockback'),
            statusEffects: this.def.statusEffects ?? [],
            bonusVsStatus: this.def.bonusVsStatus,
            source: this,
        };
    }

    update(dt, ctx) {
        this.cooldown.update(dt);
        if (!this.cooldown.ready) return;
        const targets = SpellTargeting.select(this, ctx);
        if (targets.length === 0) return;
        this.behavior.cast(this, targets, ctx);
        this.cooldown.trigger(this.effectiveCooldown());
        ctx.bus.emit(Events.SPELL_CAST, { spell: this });
    }
}
