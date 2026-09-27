import { Events } from '../core/EventBus.js';
import { SPELLS } from '../config/spellConfig.js';
import { ShopItem } from './ShopItem.js';
import { ProgressionRequirement } from '../progression/ProgressionRequirement.js';

/**
 * SpellShop — buy new spells and upgrade owned spells (persistent).
 *
 * Unlock costs / upgrade tiers come from spellConfig `shop` blocks. Items are
 * rebuilt on demand from the profile so the shop has no state of its own.
 * The shop itself becomes accessible through the 'spellShop' feature
 * (GAME_CONFIG.features), unlocked after completing 3 stages.
 */
export class SpellShop {
    constructor({ id = 'spell_shop', profile, costs, unlocks, bus }) {
        this.id = id;
        this.name = 'Witch\'s Spell Shop';
        this.profile = profile;
        this.costs = costs;
        this.unlocks = unlocks;
        this.bus = bus;
    }

    /** Spells not yet owned. */
    getUnlockItems() {
        return Object.values(SPELLS)
            .filter((def) => !this.profile.isSpellUnlocked(def.id))
            .map((def) => new ShopItem({
                id: `unlock:${def.id}`,
                kind: 'unlockSpell',
                name: def.name,
                description: def.description,
                costs: def.shop?.unlockCosts ?? [],
                requirements: def.shop?.unlockRequirements ?? [],
                data: { spellId: def.id, element: def.element },
                onPurchase: () => this.unlocks.unlockSpell(def.id),
            }));
    }

    /** Next upgrade tier for every owned spell (or a maxed marker). */
    getUpgradeItems() {
        return this.profile.data.unlockedSpells.filter((id) => SPELLS[id]).map((id) => {
            const def = SPELLS[id];
            const level = this.profile.spellLevel(id);
            const tier = def.shop?.upgrades?.[level];
            return new ShopItem({
                id: `upgrade:${id}`,
                kind: 'upgradeSpell',
                name: `${def.name} Lv ${level + 1}`,
                description: tier ? tier.mods.map(describeMod).join(', ') : 'Fully upgraded',
                costs: tier?.costs ?? [],
                requirements: tier?.requirements ?? [],
                data: { spellId: id, element: def.element, level, maxed: !tier },
                onPurchase: () => {
                    this.profile.data.spellUpgrades[id] = level + 1;
                    this.bus.emit(Events.SPELL_UPGRADED, { id, level: level + 1 });
                },
            });
        });
    }

    canPurchase(item) {
        return !item.data.maxed
            && ProgressionRequirement.checkAll(item.requirements, this.profile)
            && this.costs.canAfford(item.costs);
    }

    purchase(item) {
        if (!this.canPurchase(item) || !this.costs.pay(item.costs, `shop:${item.id}`)) return false;
        item.onPurchase();
        this.profile.save();
        return true;
    }
}

function describeMod(mod) {
    const label = mod.stat.replace(/([A-Z])/g, ' $1').toLowerCase();
    if (mod.op === 'mul') {
        const pct = Math.round((mod.value - 1) * 100);
        return `${pct > 0 ? '+' : ''}${pct}% ${label}`;
    }
    return `+${mod.value} ${label}`;
}
