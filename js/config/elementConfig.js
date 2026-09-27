/**
 * Element definitions. ElementSystem reads this table; combat code never
 * mentions a specific element by name.
 *
 * To add POISON: add an entry here, give some spells `element: 'poison'`,
 * optionally add `poison` keys to enemy resistances and a pet/card that
 * boosts `elementDamage.poison`. Nothing in combat/ needs to change.
 */
export const ELEMENTS = Object.freeze({
    physical: { id: 'physical', name: 'Physical', color: '#d8d2c4', isElemental: false },
    fire: { id: 'fire', name: 'Fire', color: '#ff7a2f', isElemental: true },
    thunder: { id: 'thunder', name: 'Thunder', color: '#ffe14d', isElemental: true },
    wind: { id: 'wind', name: 'Wind', color: '#7fe3c4', isElemental: true },
});
