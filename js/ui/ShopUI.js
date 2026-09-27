import { UIComponent, el, button } from './dom.js';
import { ELEMENTS } from '../config/elementConfig.js';
import { SPELLS } from '../config/spellConfig.js';
import { ProgressionRequirement } from '../progression/ProgressionRequirement.js';

/**
 * ShopUI — Spell Shop screen: owned spells, spells for sale, upgrade tiers.
 * Purchases go through SpellShop; this component only renders and forwards.
 */
export class ShopUI extends UIComponent {
    build() {
        const { shop, costs, profile, onBack } = this.props;
        const unlockItems = shop.getUnlockItems();
        const upgradeItems = shop.getUpgradeItems();
        const item = (it) => {
            const affordable = shop.canPurchase(it);
            const unmet = ProgressionRequirement.unmet(it.requirements, profile).map((r) => ProgressionRequirement.describe(r));
            const element = ELEMENTS[it.data.element];
            return el('div', { class: `shop-item ${affordable ? '' : 'shop-item-disabled'}`, style: { '--element': element?.color } }, [
                el('div', { class: 'shop-item-head' }, [
                    el('span', { class: 'element-dot' }),
                    el('strong', {}, it.name),
                    el('span', { class: 'tag' }, element?.name ?? ''),
                ]),
                el('p', { class: 'small' }, it.description),
                unmet.length ? el('p', { class: 'small warn' }, `Requires: ${unmet.join(', ')}`) : null,
                el('div', { class: 'shop-item-foot' }, it.data.maxed
                    ? [el('span', { class: 'ok small' }, 'MAX')]
                    : [
                        el('span', { class: 'cost' }, costs.describe(it.costs)),
                        button('Buy', () => { if (shop.purchase(it)) this.rerender(); }, 'btn btn-small btn-primary', { disabled: !affordable }),
                    ]),
            ]);
        };

        return el('div', { class: 'modal-backdrop' }, [
            el('div', { class: 'panel shop' }, [
                el('div', { class: 'screen-header' }, [
                    el('h2', {}, shop.name),
                    el('span', { class: 'res-gold' }, `● ${profile.currency('gold')}`),
                    button('Back to Map', onBack, 'btn'),
                ]),
                el('div', { class: 'shop-owned' }, [
                    el('span', { class: 'muted small' }, 'Unlocked spells: '),
                    ...profile.data.unlockedSpells.map((id) => el('span', { class: 'tag', style: { borderColor: ELEMENTS[SPELLS[id]?.element]?.color } }, SPELLS[id]?.name ?? id)),
                ]),
                el('div', { class: 'shop-columns' }, [
                    el('section', {}, [el('h3', {}, 'Learn New Spells'),
                        unlockItems.length ? el('div', { class: 'shop-list' }, unlockItems.map(item)) : el('p', { class: 'muted' }, 'You know every spell for sale.')]),
                    el('section', {}, [el('h3', {}, 'Upgrade Spells'), el('div', { class: 'shop-list' }, upgradeItems.map(item))]),
                ]),
            ]),
        ]);
    }
}
