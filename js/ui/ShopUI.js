import { UIComponent, el, button } from './dom.js';
import { ELEMENTS } from '../config/elementConfig.js';
import { CURRENCIES } from '../config/itemConfig.js';
import { ProgressionRequirement } from '../progression/ProgressionRequirement.js';

/**
 * ShopUI — renders ANY shop that follows the shop interface (see
 * shops/ShopManager.js): the Witch's Spell Shop, the Relic Merchant...
 * Purchases go through the shop; this component only renders and forwards.
 */
export class ShopUI extends UIComponent {
    build() {
        const { shop, costs, profile, onBack } = this.props;
        const summary = shop.getOwnedSummary?.();
        const item = (it) => {
            const affordable = shop.canPurchase(it);
            const unmet = ProgressionRequirement.unmet(it.requirements, profile).map((r) => ProgressionRequirement.describe(r));
            const element = ELEMENTS[it.data.element];
            const done = it.data.maxed || it.data.owned;
            return el('div', { class: `shop-item ${affordable || done ? '' : 'shop-item-disabled'}`, style: { '--element': element?.color } }, [
                el('div', { class: 'shop-item-head' }, [
                    el('span', { class: 'element-dot' }),
                    el('strong', {}, it.name),
                    element?.isElemental ? el('span', { class: 'tag' }, element.name) : null,
                ]),
                el('p', { class: 'small' }, it.description),
                unmet.length ? el('p', { class: 'small warn' }, `Requires: ${unmet.join(', ')}`) : null,
                el('div', { class: 'shop-item-foot' }, done
                    ? [el('span', { class: 'ok small' }, it.data.owned ? 'OWNED' : 'MAX')]
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
                    ...(shop.currencies ?? ['gold']).map((id) =>
                        el('span', { class: 'res-currency', style: { color: CURRENCIES[id]?.color } }, `${CURRENCIES[id]?.icon ?? ''} ${profile.currency(id)}`)),
                    button('Back to Map', onBack, 'btn'),
                ]),
                summary ? el('div', { class: 'shop-owned' }, [
                    el('span', { class: 'muted small' }, summary.label),
                    ...summary.tags.map((t) => el('span', { class: 'tag', style: { borderColor: ELEMENTS[t.element]?.color } }, t.text)),
                ]) : null,
                el('div', { class: 'shop-columns' }, shop.getSections().map((section) =>
                    el('section', {}, [
                        el('h3', {}, section.title),
                        section.items.length
                            ? el('div', { class: 'shop-list' }, section.items.map(item))
                            : el('p', { class: 'muted' }, section.empty ?? ''),
                    ]))),
            ]),
        ]);
    }
}
