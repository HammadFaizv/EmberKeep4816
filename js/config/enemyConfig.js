/**
 * Regular enemy definitions.
 *
 * `ai` picks a behavior registered in enemies/EnemyAI.js.
 * `resistances` : element -> fraction. Positive = resistance, negative = weakness.
 *                 Normal enemies are clamped below 100% (see GAME_CONFIG.limits);
 *                 only bosses may list `immunities`.
 * `render`      : `sprite` is a pixel-art key from assets/spriteData.js; `shape`
 *                 is the procedural fallback painter in rendering/EntityRenderer.js.
 * `drops`       : gold chance/amount, souls { chance, amount }, rare item chance,
 *                 resolved by CombatSystem.
 * `onHitStatus` : statuses applied to the player by this enemy's melee hits.
 *
 * Adding a new enemy = adding an entry here (plus a new AI behavior only if
 * none of the existing ones fit).
 */
export const ENEMIES = Object.freeze({
    skeleton: {
        id: 'skeleton',
        name: 'Skeleton',
        tags: ['melee', 'undead'],
        ai: 'chase',
        stats: { hp: 22, damage: 8, moveSpeed: 68, attackRange: 6, attackCooldown: 1.0, defense: 3, radius: 13 },
        resistances: { fire: -0.25, wind: 0.2, poison: 0.5 },
        exp: 2,
        drops: { goldChance: 0.10, gold: [1, 3], rareChance: 0.004, rareItem: 'soul_shard' },
        render: { shape: 'skeleton', sprite: 'skeleton', color: '#e8e2cf' },
    },

    goblin: {
        id: 'goblin',
        name: 'Goblin',
        tags: ['melee', 'fast'],
        ai: 'chase',
        stats: { hp: 30, damage: 10, moveSpeed: 96, attackRange: 6, attackCooldown: 0.9, defense: 2, radius: 13 },
        resistances: { thunder: 0.3, fire: -0.1, poison: -0.2 },
        exp: 3,
        drops: { goldChance: 0.15, gold: [2, 4], rareChance: 0.004, rareItem: 'soul_shard' },
        render: { shape: 'goblin', sprite: 'goblin', color: '#6fae4a' },
    },

    bat: {
        id: 'bat',
        name: 'Bat',
        tags: ['fast', 'flying', 'fragile'],
        ai: 'swoop',
        stats: { hp: 10, damage: 5, moveSpeed: 150, attackRange: 4, attackCooldown: 0.8, defense: 0, radius: 10 },
        resistances: { wind: -0.4, thunder: 0.2, ice: -0.2 },
        exp: 1,
        drops: { goldChance: 0.12, gold: [1, 2], rareChance: 0.003, rareItem: 'soul_shard' },
        render: { shape: 'bat', sprite: 'bat', color: '#8a5fb8' },
    },

    snake: {
        id: 'snake',
        name: 'Snake',
        tags: ['melee', 'slow'],
        ai: 'slither',
        stats: { hp: 18, damage: 7, moveSpeed: 78, attackRange: 6, attackCooldown: 1.1, defense: 1, radius: 12 },
        resistances: { fire: 0.3, wind: -0.2, poison: 0.6, ice: -0.3 },
        exp: 2,
        onHitStatus: [{ type: 'poison', duration: 3, dps: 2, maxStacks: 4 }],
        drops: { goldChance: 0.10, gold: [1, 3], rareChance: 0.004, rareItem: 'soul_shard' },
        render: { shape: 'snake', sprite: 'snake', color: '#5fa37a' },
    },

    goblin_archer: {
        id: 'goblin_archer',
        name: 'Goblin Archer',
        tags: ['ranged'],
        ai: 'ranged',
        stats: { hp: 18, damage: 7, moveSpeed: 80, attackRange: 260, attackCooldown: 2.0, defense: 1, radius: 12, projectileSpeed: 260 },
        resistances: { thunder: 0.3 },
        exp: 3,
        drops: { goldChance: 0.15, gold: [2, 4], rareChance: 0.004, rareItem: 'soul_shard' },
        render: { shape: 'goblin', sprite: 'goblin_archer', color: '#9bc25a', accent: '#6b4a2a' },
    },

    skeleton_knight: {
        id: 'skeleton_knight',
        name: 'Skeleton Knight',
        tags: ['melee', 'elite', 'defensive', 'undead'],
        elite: true,
        ai: 'chase',
        stats: { hp: 90, damage: 16, moveSpeed: 58, attackRange: 8, attackCooldown: 1.3, defense: 12, radius: 17 },
        resistances: { fire: -0.1, wind: 0.4, thunder: 0.2, poison: 0.6, ice: 0.2 },
        exp: 8,
        drops: { goldChance: 0.30, gold: [4, 8], souls: { chance: 0.35, amount: [1, 2] }, rareChance: 0.02, rareItem: 'soul_shard' },
        render: { shape: 'skeleton', sprite: 'skeleton_knight', color: '#b9c3d6', accent: '#56607a' },
    },

    imp: {
        id: 'imp',
        name: 'Lava Imp',
        tags: ['fast', 'demon'],
        ai: 'swoop',
        stats: { hp: 26, damage: 11, moveSpeed: 140, attackRange: 5, attackCooldown: 0.8, defense: 4, radius: 11 },
        resistances: { fire: 0.7, wind: -0.3, ice: -0.4 },
        exp: 4,
        drops: { goldChance: 0.14, gold: [2, 5], souls: { chance: 0.05, amount: [1, 1] }, rareChance: 0.006, rareItem: 'soul_shard' },
        render: { shape: 'bat', sprite: 'imp', color: '#e0472b' },
    },
});
