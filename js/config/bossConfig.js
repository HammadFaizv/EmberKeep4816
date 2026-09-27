/**
 * Boss and miniboss definitions.
 *
 * Bosses are Enemies with extra data:
 *   kind        'boss' | 'miniboss' — decides class (Boss / MiniBoss) and events.
 *   immunities  elements dealing 0 damage (bosses only; see ElementSystem).
 *   phases      ordered HP thresholds. Crossing one triggers PHASE_TRANSITION in
 *               the BossStateMachine, and the phase's multipliers apply afterwards.
 *   attacks     named attack definitions executed by bosses/BossAttacks.js.
 *               Phases choose which attacks are active.
 *   fsm         tuning read by the FSM states (ranges, timings).
 *   rewards     persistent rewards granted when the stage is completed.
 *
 * Adding a boss = adding an entry here. Adding a new *kind of attack* =
 * registering it in BossAttacks.js. Adding a new *behavior state* = adding a
 * BossState subclass and listing it in `fsm.states`.
 */
export const BOSSES = Object.freeze({
    bone_warden: {
        id: 'bone_warden',
        name: 'The Bone Warden',
        kind: 'boss',
        stats: { hp: 900, damage: 18, moveSpeed: 72, attackRange: 14, attackCooldown: 1.4, defense: 8, radius: 34 },
        resistances: { fire: -0.2, wind: 0.3 },
        immunities: [],
        phases: [
            { name: 'Risen', threshold: 1.0, speedMult: 1, cooldownMult: 1, attacks: ['slam', 'boneBurst'] },
            { name: 'Enraged', threshold: 0.5, speedMult: 1.35, cooldownMult: 0.7, attacks: ['slam', 'boneBurst', 'raiseDead'] },
        ],
        attacks: {
            slam: { type: 'melee', damage: 18, reach: 22, windup: 0.35 },
            boneBurst: { type: 'radialBurst', count: 12, damage: 10, speed: 230, windup: 0.8, cooldown: 6 },
            raiseDead: { type: 'summon', enemyId: 'skeleton', count: 4, windup: 1.0, cooldown: 10 },
        },
        fsm: {
            states: ['IDLE', 'CHASE', 'ATTACK', 'SPECIAL_ATTACK', 'PHASE_TRANSITION', 'STUNNED', 'DEAD'],
            aggroRange: 900,
            idleTime: 1.2,
            phaseTransitionTime: 1.5,
            stunDuration: 1.2,
        },
        exp: 40,
        drops: { goldChance: 1, gold: [30, 50] },
        rewards: [{ type: 'item', id: 'bone_crystal', amount: 1 }],
        render: { shape: 'boss', color: '#e8e2cf', accent: '#7a1f1f' },
    },

    goblin_chieftain: {
        id: 'goblin_chieftain',
        name: 'Goblin Chieftain',
        kind: 'miniboss',
        stats: { hp: 520, damage: 16, moveSpeed: 95, attackRange: 12, attackCooldown: 1.1, defense: 6, radius: 26 },
        resistances: { fire: -0.15 },
        immunities: ['thunder'],
        phases: [
            { name: 'War Cry', threshold: 1.0, speedMult: 1, cooldownMult: 1, attacks: ['cleave', 'callWarband'] },
            { name: 'Frenzy', threshold: 0.4, speedMult: 1.4, cooldownMult: 0.75, attacks: ['cleave', 'spearVolley', 'callWarband'] },
        ],
        attacks: {
            cleave: { type: 'melee', damage: 16, reach: 20, windup: 0.3 },
            spearVolley: { type: 'radialBurst', count: 8, damage: 9, speed: 260, windup: 0.6, cooldown: 5 },
            callWarband: { type: 'summon', enemyId: 'goblin', count: 3, windup: 0.8, cooldown: 9 },
        },
        fsm: {
            states: ['IDLE', 'CHASE', 'ATTACK', 'SPECIAL_ATTACK', 'PHASE_TRANSITION', 'STUNNED', 'DEAD'],
            aggroRange: 900, idleTime: 0.8, phaseTransitionTime: 1.2, stunDuration: 1.0,
        },
        exp: 30,
        drops: { goldChance: 1, gold: [20, 35] },
        rewards: [{ type: 'item', id: 'bridge_logs', amount: 1 }],
        render: { shape: 'boss', color: '#6fae4a', accent: '#c9a227' },
    },

    rot_mother: {
        id: 'rot_mother',
        name: 'The Rot Mother',
        kind: 'boss',
        stats: { hp: 1400, damage: 20, moveSpeed: 60, attackRange: 16, attackCooldown: 1.5, defense: 10, radius: 38 },
        resistances: { fire: 0.4, wind: -0.25 },
        immunities: [],
        phases: [
            { name: 'Bloated', threshold: 1.0, speedMult: 1, cooldownMult: 1, attacks: ['slam', 'sporeBurst', 'brood'] },
            { name: 'Bursting', threshold: 0.35, speedMult: 1.2, cooldownMult: 0.6, attacks: ['slam', 'sporeBurst', 'brood'] },
        ],
        attacks: {
            slam: { type: 'melee', damage: 20, reach: 22, windup: 0.45 },
            sporeBurst: { type: 'radialBurst', count: 16, damage: 9, speed: 170, windup: 1.0, cooldown: 5 },
            brood: { type: 'summon', enemyId: 'snake', count: 5, windup: 1.0, cooldown: 8 },
        },
        fsm: {
            states: ['IDLE', 'CHASE', 'ATTACK', 'SPECIAL_ATTACK', 'PHASE_TRANSITION', 'STUNNED', 'DEAD'],
            aggroRange: 900, idleTime: 1.5, phaseTransitionTime: 1.5, stunDuration: 0.8,
        },
        exp: 60,
        drops: { goldChance: 1, gold: [50, 80] },
        rewards: [{ type: 'item', id: 'ancient_key', amount: 1 }],
        render: { shape: 'boss', color: '#6a7d3a', accent: '#b5c96a' },
    },

    iron_revenant: {
        id: 'iron_revenant',
        name: 'Iron Revenant',
        kind: 'boss',
        stats: { hp: 2200, damage: 26, moveSpeed: 70, attackRange: 16, attackCooldown: 1.3, defense: 22, radius: 36 },
        resistances: { wind: 0.5, thunder: -0.3 },
        immunities: ['fire'],
        phases: [
            { name: 'Vigil', threshold: 1.0, speedMult: 1, cooldownMult: 1, attacks: ['slam', 'boneBurst'] },
            { name: 'Siege', threshold: 0.6, speedMult: 1.15, cooldownMult: 0.8, attacks: ['slam', 'boneBurst', 'raiseKnights'] },
            { name: 'Last Stand', threshold: 0.25, speedMult: 1.4, cooldownMult: 0.6, attacks: ['slam', 'boneBurst', 'raiseKnights'] },
        ],
        attacks: {
            slam: { type: 'melee', damage: 26, reach: 24, windup: 0.4 },
            boneBurst: { type: 'radialBurst', count: 18, damage: 12, speed: 240, windup: 0.8, cooldown: 5 },
            raiseKnights: { type: 'summon', enemyId: 'skeleton_knight', count: 2, windup: 1.2, cooldown: 12 },
        },
        fsm: {
            states: ['IDLE', 'CHASE', 'ATTACK', 'SPECIAL_ATTACK', 'PHASE_TRANSITION', 'STUNNED', 'DEAD'],
            aggroRange: 900, idleTime: 1.0, phaseTransitionTime: 1.5, stunDuration: 0.6,
        },
        exp: 80,
        drops: { goldChance: 1, gold: [80, 120] },
        rewards: [],
        render: { shape: 'boss', color: '#9aa3b5', accent: '#3b4254' },
    },

    soul_reaper: {
        id: 'soul_reaper',
        name: 'Soul Reaper',
        kind: 'miniboss',
        stats: { hp: 1600, damage: 24, moveSpeed: 110, attackRange: 14, attackCooldown: 1.0, defense: 12, radius: 26 },
        resistances: { thunder: 0.3, fire: 0.3 },
        immunities: ['wind'],
        phases: [
            { name: 'Harvest', threshold: 1.0, speedMult: 1, cooldownMult: 1, attacks: ['scythe', 'soulBurst'] },
        ],
        attacks: {
            scythe: { type: 'melee', damage: 24, reach: 26, windup: 0.3 },
            soulBurst: { type: 'radialBurst', count: 20, damage: 11, speed: 250, windup: 0.7, cooldown: 4 },
        },
        fsm: {
            states: ['IDLE', 'CHASE', 'ATTACK', 'SPECIAL_ATTACK', 'PHASE_TRANSITION', 'STUNNED', 'DEAD'],
            aggroRange: 900, idleTime: 0.6, phaseTransitionTime: 1.0, stunDuration: 0.5,
        },
        exp: 70,
        drops: { goldChance: 1, gold: [70, 100] },
        rewards: [],
        render: { shape: 'boss', color: '#4b3b6b', accent: '#b89cff' },
    },

    demon_lord: {
        id: 'demon_lord',
        name: 'The Demon Lord',
        kind: 'boss',
        stats: { hp: 6000, damage: 34, moveSpeed: 85, attackRange: 18, attackCooldown: 1.2, defense: 25, radius: 46 },
        resistances: { thunder: 0.2, wind: 0.2 },
        immunities: ['fire'],
        phases: [
            { name: 'Sovereign', threshold: 1.0, speedMult: 1, cooldownMult: 1, attacks: ['slam', 'hellfire'] },
            { name: 'Wrath', threshold: 0.66, speedMult: 1.2, cooldownMult: 0.8, attacks: ['slam', 'hellfire', 'legion'] },
            { name: 'Cataclysm', threshold: 0.33, speedMult: 1.4, cooldownMult: 0.6, attacks: ['slam', 'hellfire', 'legion'] },
        ],
        // TODO: Give the Demon Lord unique mechanics beyond reused attack types:
        // e.g. a 'meteorRain' attack type in BossAttacks.js, and removing fire
        // immunity during 'Cataclysm' via a per-phase `immunities` override read by
        // Boss.getImmunities().
        attacks: {
            slam: { type: 'melee', damage: 34, reach: 26, windup: 0.4 },
            hellfire: { type: 'radialBurst', count: 24, damage: 14, speed: 240, windup: 0.8, cooldown: 4.5 },
            legion: { type: 'summon', enemyId: 'imp', count: 5, windup: 1.2, cooldown: 10 },
        },
        fsm: {
            states: ['IDLE', 'CHASE', 'ATTACK', 'SPECIAL_ATTACK', 'PHASE_TRANSITION', 'STUNNED', 'DEAD'],
            aggroRange: 1200, idleTime: 2.0, phaseTransitionTime: 2.0, stunDuration: 0.4,
        },
        exp: 200,
        drops: { goldChance: 1, gold: [300, 400] },
        rewards: [{ type: 'item', id: 'demon_heart', amount: 1 }],
        render: { shape: 'boss', color: '#3a0d0d', accent: '#ff4a1a' },
    },
});
