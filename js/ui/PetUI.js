import { UIComponent, el, button } from './dom.js';
import { ELEMENTS } from '../config/elementConfig.js';

/** PetUI — adopt pets from the Animal Caretaker and equip them into pet slots. */
export class PetUI extends UIComponent {
    build() {
        const { pets, costs, profile, onBack } = this.props;
        const slots = pets.slots;
        return el('div', { class: 'modal-backdrop' }, [
            el('div', { class: 'panel shop pets' }, [
                el('div', { class: 'screen-header' }, [
                    el('h2', {}, 'Animal Caretaker'),
                    el('span', { class: 'res-gold' }, `● ${profile.currency('gold')}`),
                    button('Back to Map', onBack, 'btn'),
                ]),
                el('p', { class: slots ? 'muted' : 'warn' }, slots
                    ? `Pet slots: ${pets.equipped.length} / ${slots}`
                    : 'You have no pet slots yet. Unlock "Kindred Bond" in the upgrade tree to bring a companion into stages.'),
                el('div', { class: 'shop-list pet-list' }, pets.definitions.map((def) => {
                    const owned = pets.isOwned(def.id);
                    const equipped = pets.isEquipped(def.id);
                    let action;
                    if (!owned) {
                        action = button(`Adopt · ${costs.describe(def.costs)}`, () => { if (pets.adopt(def.id)) this.rerender(); },
                            'btn btn-small btn-primary', { disabled: !costs.canAfford(def.costs) });
                    } else if (equipped) {
                        action = button('Unequip', () => { pets.unequip(def.id); this.rerender(); }, 'btn btn-small');
                    } else {
                        action = button('Equip', () => { pets.equip(def.id); this.rerender(); }, 'btn btn-small btn-primary',
                            { disabled: pets.equipped.length >= slots });
                    }
                    return el('div', { class: 'shop-item', style: { '--element': ELEMENTS[def.element]?.color } }, [
                        el('div', { class: 'shop-item-head' }, [el('span', { class: 'element-dot' }), el('strong', {}, def.name),
                            equipped ? el('span', { class: 'tag ok' }, 'Equipped') : null]),
                        el('p', { class: 'small' }, def.description),
                        el('div', { class: 'shop-item-foot' }, [action]),
                    ]);
                })),
            ]),
        ]);
    }
}
