/**
 * Structures buildable in DEFENSE stages (through level-up cards).
 *
 *   slot     'lane' = placed ON a lane (blocks it), 'side' = beside a lane
 *   blocks   enemies following the lane must destroy it to pass
 *   spell    hidden spell id fired automatically (uses the player's stats,
 *            so damage upgrades and elemental bonuses apply to towers too)
 */
export const STRUCTURES = Object.freeze({
    barricade: {
        id: 'barricade',
        name: 'Barricade',
        slot: 'lane',
        hp: 260,
        defense: 12,
        radius: 22,
        blocks: true,
        render: { shape: 'structure', sprite: 'barricade', color: '#8b6a45' },
    },
    arrow_tower: {
        id: 'arrow_tower',
        name: 'Arrow Tower',
        slot: 'side',
        hp: 180,
        defense: 6,
        radius: 18,
        blocks: false,
        spell: 'tower_bolt',
        render: { shape: 'structure', sprite: 'tower', color: '#9a8c7a' },
    },
});
