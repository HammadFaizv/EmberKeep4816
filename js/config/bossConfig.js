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
 *               A phase may also override `immunities` / `resistances` and list
 *               `onEnter` scripted events (bosses/PhaseEvents.js).
 *   fsm         tuning read by the FSM states (ranges, timings, `flee` for minibosses).
 *   rewards     persistent rewards granted when the stage is completed.
 *   dialogue    { intro, defeat } lines shown by the stage overlay.
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
        resistances: { fire: -0.2, wind: 0.3, poison: 0.5 },
        immunities: [],
        phases: [
            { name: 'Risen', threshold: 1.0, speedMult: 1, cooldownMult: 1, attacks: ['slam', 'boneBurst'] },
            { name: 'Enraged', threshold: 0.5, speedMult: 1.35, cooldownMult: 0.7, attacks: ['slam', 'boneBurst', 'raiseDead'],
                onEnter: [{ type: 'dialogue', text: 'The graves answer me!' }, { type: 'summon', enemyId: 'skeleton', count: 3 }] },
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
        drops: { goldChance: 1, gold: [30, 50], souls: { chance: 1, amount: [4, 6] } },
        rewards: [{ type: 'item', id: 'bone_crystal', amount: 1 }],
        dialogue: { intro: 'Another doll... I will add your stuffing to my bones.' },
        render: { shape: 'boss', sprite: 'bone_warden', color: '#e8e2cf', accent: '#7a1f1f' },
    },

    goblin_chieftain: {
        id: 'goblin_chieftain',
        name: 'Goblin Chieftain',
        kind: 'miniboss',
        stats: { hp: 520, damage: 16, moveSpeed: 95, attackRange: 12, attackCooldown: 1.1, defense: 6, radius: 26 },
        resistances: { fire: -0.15, poison: -0.2 },
        immunities: ['thunder'],
        phases: [
            { name: 'War Cry', threshold: 1.0, speedMult: 1, cooldownMult: 1, attacks: ['cleave', 'callWarband'] },
            { name: 'Frenzy', threshold: 0.4, speedMult: 1.4, cooldownMult: 0.75, attacks: ['cleave', 'boarCharge', 'spearVolley', 'callWarband'],
                onEnter: [{ type: 'dialogue', text: 'WAAAGH! Smash the doll!' }] },
        ],
        attacks: {
            cleave: { type: 'melee', damage: 16, reach: 20, windup: 0.3 },
            spearVolley: { type: 'radialBurst', count: 8, damage: 9, speed: 260, windup: 0.6, cooldown: 5, shape: 'arrow' },
            callWarband: { type: 'summon', enemyId: 'goblin', count: 3, windup: 0.8, cooldown: 9 },
            boarCharge: { type: 'charge', damage: 20, speed: 520, channel: 0.7, windup: 0.7, cooldown: 7, recovery: 0.6 },
        },
        fsm: {
            states: ['IDLE', 'CHASE', 'ATTACK', 'SPECIAL_ATTACK', 'PHASE_TRANSITION', 'STUNNED', 'FLEE', 'DEAD'],
            aggroRange: 900, idleTime: 0.8, phaseTransitionTime: 1.2, stunDuration: 1.0,
            flee: { at: 0.25, duration: 4, speedMult: 1.5, regen: 0.015, summon: 'callWarband', line: 'Boys! Cover me!' },
        },
        exp: 30,
        drops: { goldChance: 1, gold: [20, 35], souls: { chance: 1, amount: [3, 5] } },
        rewards: [{ type: 'item', id: 'bridge_logs', amount: 1 }, { type: 'item', id: 'chieftain_tusk', amount: 1 }],
        render: { shape: 'boss', sprite: 'goblin_chieftain', color: '#6fae4a', accent: '#c9a227' },
    },

    rot_mother: {
        id: 'rot_mother',
        name: 'The Rot Mother',
        kind: 'boss',
        stats: { hp: 1400, damage: 20, moveSpeed: 60, attackRange: 16, attackCooldown: 1.5, defense: 10, radius: 38 },
        resistances: { fire: 0.4, wind: -0.25, poison: 0.6, ice: -0.2 },
        immunities: ['poison'],
        phases: [
            { name: 'Bloated', threshold: 1.0, speedMult: 1, cooldownMult: 1, attacks: ['slam', 'sporeBurst', 'brood'] },
            { name: 'Bursting', threshold: 0.35, speedMult: 1.2, cooldownMult: 0.6, attacks: ['slam', 'sporeBurst', 'brood'],
                onEnter: [{ type: 'shockwave', count: 20, damage: 10, speed: 200 }, { type: 'summon', enemyId: 'snake', count: 4 }] },
        ],
        attacks: {
            slam: { type: 'melee', damage: 20, reach: 22, windup: 0.45 },
            sporeBurst: { type: 'radialBurst', count: 16, damage: 9, speed: 170, windup: 1.0, cooldown: 5, element: 'poison', shape: 'spore', color: '#b5c96a' },
            brood: { type: 'summon', enemyId: 'snake', count: 5, windup: 1.0, cooldown: 8 },
        },
        fsm: {
            states: ['IDLE', 'CHASE', 'ATTACK', 'SPECIAL_ATTACK', 'PHASE_TRANSITION', 'STUNNED', 'DEAD'],
            aggroRange: 900, idleTime: 1.5, phaseTransitionTime: 1.5, stunDuration: 0.8,
        },
        exp: 60,
        drops: { goldChance: 1, gold: [50, 80], souls: { chance: 1, amount: [5, 8] } },
        rewards: [{ type: 'item', id: 'ancient_key', amount: 1 }, { type: 'item', id: 'rot_gland', amount: 1 }],
        render: { shape: 'boss', sprite: 'rot_mother', color: '#6a7d3a', accent: '#b5c96a' },
    },

    iron_revenant: {
        id: 'iron_revenant',
        name: 'Iron Revenant',
        kind: 'boss',
        stats: { hp: 2200, damage: 26, moveSpeed: 70, attackRange: 16, attackCooldown: 1.3, defense: 22, radius: 36 },
        resistances: { wind: 0.5, thunder: -0.3, poison: 0.7, ice: 0.2 },
        immunities: ['fire'],
        phases: [
            { name: 'Vigil', threshold: 1.0, speedMult: 1, cooldownMult: 1, attacks: ['slam', 'boneBurst'] },
            { name: 'Siege', threshold: 0.6, speedMult: 1.15, cooldownMult: 0.8, attacks: ['slam', 'boneBurst', 'raiseKnights'],
                onEnter: [{ type: 'dialogue', text: 'Garrison, to arms!' }, { type: 'summon', enemyId: 'skeleton_knight', count: 2 }] },
            { name: 'Last Stand', threshold: 0.25, speedMult: 1.4, cooldownMult: 0.6, attacks: ['slam', 'boneBurst', 'raiseKnights'],
                // Its armour cracks: the fire immunity is gone in the last phase.
                immunities: [], resistances: { fire: -0.3 },
                onEnter: [{ type: 'dialogue', text: 'My armour... cracks...' }] },
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
        drops: { goldChance: 1, gold: [80, 120], souls: { chance: 1, amount: [6, 10] } },
        rewards: [{ type: 'item', id: 'iron_heart', amount: 1 }],
        render: { shape: 'boss', sprite: 'iron_revenant', color: '#9aa3b5', accent: '#3b4254' },
    },

    soul_reaper: {
        id: 'soul_reaper',
        name: 'Soul Reaper',
        kind: 'miniboss',
        stats: { hp: 1600, damage: 24, moveSpeed: 110, attackRange: 14, attackCooldown: 1.0, defense: 12, radius: 26 },
        resistances: { thunder: 0.3, fire: 0.3, poison: 0.4, ice: -0.2 },
        immunities: ['wind'],
        phases: [
            { name: 'Harvest', threshold: 1.0, speedMult: 1, cooldownMult: 1, attacks: ['scythe', 'soulBurst'] },
            { name: 'Reaping', threshold: 0.5, speedMult: 1.2, cooldownMult: 0.75, attacks: ['scythe', 'soulBurst', 'soulSpiral'],
                onEnter: [{ type: 'dialogue', text: 'Your soul will join the others.' }] },
        ],
        attacks: {
            scythe: { type: 'melee', damage: 24, reach: 26, windup: 0.3 },
            soulBurst: { type: 'radialBurst', count: 20, damage: 11, speed: 250, windup: 0.7, cooldown: 4, shape: 'ember', color: '#b89cff' },
            soulSpiral: { type: 'spiral', damage: 9, speed: 210, arms: 3, turnRate: 2.4, interval: 0.12, channel: 2.2, windup: 0.6, cooldown: 9, color: '#b89cff' },
            wraiths: { type: 'summon', enemyId: 'bat', count: 6, windup: 0.4, cooldown: 99 },
        },
        fsm: {
            states: ['IDLE', 'CHASE', 'ATTACK', 'SPECIAL_ATTACK', 'PHASE_TRANSITION', 'STUNNED', 'FLEE', 'DEAD'],
            aggroRange: 900, idleTime: 0.6, phaseTransitionTime: 1.0, stunDuration: 0.5,
            flee: { at: 0.2, duration: 5, speedMult: 1.4, regen: 0.02, summon: 'wraiths', line: 'Not yet... the harvest is not done!' },
        },
        exp: 70,
        drops: { goldChance: 1, gold: [70, 100], souls: { chance: 1, amount: [10, 15] } },
        rewards: [{ type: 'item', id: 'reaper_shard', amount: 1 }],
        render: { shape: 'boss', sprite: 'soul_reaper', color: '#4b3b6b', accent: '#b89cff' },
    },

    demon_lord: {
        id: 'demon_lord',
        name: 'The Demon Lord',
        kind: 'boss',
        stats: { hp: 6000, damage: 34, moveSpeed: 85, attackRange: 18, attackCooldown: 1.2, defense: 25, radius: 46 },
        resistances: { thunder: 0.2, wind: 0.2, poison: 0.3, ice: 0.1 },
        immunities: ['fire'],
        // Unique mechanics: meteor rain, a hellfire spiral, a charge, arena lava
        // that starts in Wrath, and fire immunity that breaks in Cataclysm.
        phases: [
            { name: 'Sovereign', threshold: 1.0, speedMult: 1, cooldownMult: 1, attacks: ['slam', 'hellfire', 'meteorRain'] },
            { name: 'Wrath', threshold: 0.66, speedMult: 1.2, cooldownMult: 0.8, attacks: ['slam', 'hellfire', 'meteorRain', 'legion', 'infernalCharge'],
                onEnter: [
                    { type: 'dialogue', text: 'You are the 4816th. The others knelt. You will too.' },
                    { type: 'arenaHazard', hazard: { type: 'lavaPools', start: 2, interval: 7, count: 2, radius: 55, damage: 10, duration: 5, warmup: 1.3 } },
                    { type: 'summon', enemyId: 'imp', count: 4 },
                ] },
            { name: 'Cataclysm', threshold: 0.33, speedMult: 1.4, cooldownMult: 0.6, attacks: ['slam', 'hellfireSpiral', 'meteorRain', 'legion', 'infernalCharge'],
                immunities: [], resistances: { fire: -0.25 },
                onEnter: [
                    { type: 'dialogue', text: 'ENOUGH! Burn with me, little doll!' },
                    { type: 'shockwave', count: 32, damage: 16, speed: 230 },
                ] },
        ],
        attacks: {
            slam: { type: 'melee', damage: 34, reach: 26, windup: 0.4 },
            hellfire: { type: 'radialBurst', count: 24, damage: 14, speed: 240, windup: 0.8, cooldown: 4.5, shape: 'ember', element: 'fire' },
            meteorRain: { type: 'meteorRain', count: 6, radius: 60, damage: 26, warmup: 1.1, stagger: 0.15, burn: 2.5, burnDamage: 5, spread: 280, windup: 0.7, cooldown: 8 },
            legion: { type: 'summon', enemyId: 'imp', count: 5, windup: 1.2, cooldown: 10 },
            infernalCharge: { type: 'charge', damage: 30, speed: 620, channel: 0.8, windup: 0.8, cooldown: 7, recovery: 0.7 },
            hellfireSpiral: { type: 'spiral', damage: 13, speed: 230, arms: 4, turnRate: 2.2, interval: 0.1, channel: 3, windup: 0.8, cooldown: 7, element: 'fire' },
        },
        fsm: {
            states: ['IDLE', 'CHASE', 'ATTACK', 'SPECIAL_ATTACK', 'PHASE_TRANSITION', 'STUNNED', 'DEAD'],
            aggroRange: 1200, idleTime: 2.0, phaseTransitionTime: 2.0, stunDuration: 0.4,
        },
        exp: 200,
        drops: { goldChance: 1, gold: [300, 400], souls: { chance: 1, amount: [25, 35] } },
        rewards: [{ type: 'item', id: 'demon_heart', amount: 1 }],
        dialogue: {
            intro: 'So the witch sent another. Come, 4816th. Join the ones who came before.',
            defeat: 'The... dolls... remember...',
        },
        render: { shape: 'boss', sprite: 'demon_lord', color: '#3a0d0d', accent: '#ff4a1a' },
    },
});
