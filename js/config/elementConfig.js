/**
 * Element definitions. ElementSystem reads this table; combat code never
 * mentions a specific element by name.
 *
 * Adding an element = an entry here, spells with `element: '<id>'`, optional
 * `<id>` keys in enemy resistances and `elementDamage.<id>` / `resist.<id>`
 * stat bonuses. Nothing in combat/ needs to change.
 */
export const ELEMENTS = Object.freeze({
    physical: { id: 'physical', name: 'Physical', color: '#d8d2c4', isElemental: false },
    fire: { id: 'fire', name: 'Fire', color: '#ff7a2f', isElemental: true },
    thunder: { id: 'thunder', name: 'Thunder', color: '#ffe14d', isElemental: true },
    wind: { id: 'wind', name: 'Wind', color: '#7fe3c4', isElemental: true },
    ice: { id: 'ice', name: 'Ice', color: '#8fd8ff', isElemental: true },
    poison: { id: 'poison', name: 'Poison', color: '#9be15d', isElemental: true },
});

/** Elements that have damage/resistance stats (every elemental entry above). */
export const ELEMENTAL_IDS = Object.freeze(Object.values(ELEMENTS).filter((e) => e.isElemental).map((e) => e.id));
