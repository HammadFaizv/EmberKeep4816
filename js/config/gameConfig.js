/**
 * Global tuning values. Anything a designer might want to tweak that is not
 * specific to one enemy/spell/stage belongs here.
 */
export const GAME_CONFIG = Object.freeze({
    title: 'EmberKeep: Soul 4816',
    canvas: { width: 1280, height: 720 },
    fixedStep: 1 / 60,
    saveKey: 'emberkeep_4816_save',

    /** Base stats for the doll. Permanent upgrades, pets and cards modify these. */
    playerBaseStats: {
        maxHp: 100,
        moveSpeed: 190,
        radius: 14,
        defense: 0,
        damageMult: 1,
        attackSpeedMult: 1,
        cooldownReduction: 0,   // 0.2 = 20% shorter cooldowns (capped below)
        lifesteal: 0,           // fraction of damage dealt returned as HP
        regen: 0,               // HP per second
        goldDropChance: 0,      // added to each enemy's base drop chance
        goldValue: 1,           // multiplier on every gold coin dropped
        expGain: 1,
        pickupRadius: 70,
        spellSlots: 2,
        petSlots: 0,
        // Elemental damage bonuses are open-ended keys: `elementDamage.<element>`.
        // Elemental resistances likewise: `resist.<element>` plus `resist.all`.
        // Adding a new element needs no new stat definitions.
    },

    /**
     * Global enemy density: every wave spawns `countMult` × more enemies and
     * spaces them `1 / rateMult` as far apart, on top of difficulty tiers.
     */
    spawnDensity: { countMult: 1.5, rateMult: 1.5 },

    limits: {
        maxCooldownReduction: 0.6,
        maxNormalEnemyResistance: 0.8, // normal enemies can never be fully immune
        maxPlayerResistance: 0.75,
        minDamage: 1,
    },

    progression: {
        startingSpells: ['fireball', 'spark', 'wind_blade'],
        cardChoices: 3,
        spellChoicesAtStageStart: 3,
        rerollsPerRun: 2,          // card/spell offer rerolls per stage attempt
    },

    /**
     * EXP orbs: enemies drop orbs worth their `exp`; the orb's look is picked
     * from the first tier whose `min` the value reaches.
     */
    expOrbs: {
        lifetime: 45,
        tiers: [
            { min: 0, sprite: 'exp_small', color: '#6fd3ff' },
            { min: 5, sprite: 'exp_medium', color: '#7dff9a' },
            { min: 20, sprite: 'exp_large', color: '#ff8af0' },
        ],
    },

    /**
     * New Game+: every cycle shifts each stage up `tierStep` difficulty tiers
     * (tiers past the table are extrapolated) and multiplies currency rewards.
     */
    newGamePlus: {
        tierStep: 2,
        overflowMult: 0.35,   // extra ×HP/damage per tier beyond the last table entry
        rewardMult: 0.5,      // +50% currency rewards per cycle
    },

    /**
     * Stage-level experience curve: EXP required to go from `level` to `level + 1`.
     * Levels reset every stage (see progression/LevelSystem.js).
     */
    expToNextLevel(level) {
        return Math.round(6 + level * 5 + Math.pow(level, 1.6) * 2);
    },

    /**
     * Features unlocked by meeting progression requirements
     * (evaluated by UnlockSystem after every stage completion).
     * Features can also be unlocked explicitly, e.g. by visiting an NPC.
     */
    features: {
        spellShop: {
            name: 'Spell Shop',
            requirements: [{ type: 'completeStageCount', count: 3 }],
        },
        pets: {
            name: 'Pets',
            // Unlocked by talking to the Animal Caretaker (see mapConfig npc node).
            requirements: [{ type: 'npcVisited', npcId: 'animal_caretaker' }],
        },
        spellCombos: {
            name: 'Spell Combos',
            // Granted by the 'Spell Resonance' upgrade (unlockFeature effect).
            // combat/ComboSystem.js checks it when a stage starts.
            requirements: [{ type: 'never' }],
        },
        spellFusion: {
            name: 'Spell Fusion',
            // Granted by the 'Soul Weaving' upgrade. Enables fusion cards.
            requirements: [{ type: 'never' }],
        },
        relicShop: {
            name: 'Relic Merchant',
            requirements: [{ type: 'defeatBoss', id: 'bone_warden' }],
        },
    },

    /**
     * Difficulty tiers referenced by stage definitions (`difficulty: 3`).
     * Bosses use their own (gentler) multipliers because their base stats are
     * already tuned per boss in bossConfig.js.
     */
    difficultyTiers: [
        { hpMult: 1.0, damageMult: 1.0, spawnRateMult: 1.0, countMult: 1.0, bossHpMult: 1.0, bossDamageMult: 1.0 },
        { hpMult: 1.0, damageMult: 1.0, spawnRateMult: 1.0, countMult: 1.0, bossHpMult: 1.0, bossDamageMult: 1.0 },
        { hpMult: 1.25, damageMult: 1.1, spawnRateMult: 1.1, countMult: 1.15, bossHpMult: 1.0, bossDamageMult: 1.0 },
        { hpMult: 1.6, damageMult: 1.25, spawnRateMult: 1.2, countMult: 1.3, bossHpMult: 1.1, bossDamageMult: 1.1 },
        { hpMult: 2.1, damageMult: 1.45, spawnRateMult: 1.3, countMult: 1.45, bossHpMult: 1.2, bossDamageMult: 1.15 },
        { hpMult: 2.8, damageMult: 1.7, spawnRateMult: 1.4, countMult: 1.6, bossHpMult: 1.3, bossDamageMult: 1.2 },
        { hpMult: 3.6, damageMult: 2.0, spawnRateMult: 1.5, countMult: 1.8, bossHpMult: 1.4, bossDamageMult: 1.3 },
        { hpMult: 4.6, damageMult: 2.4, spawnRateMult: 1.6, countMult: 2.0, bossHpMult: 1.5, bossDamageMult: 1.4 },
        { hpMult: 6.0, damageMult: 2.9, spawnRateMult: 1.75, countMult: 2.2, bossHpMult: 1.6, bossDamageMult: 1.5 },
    ],
});
