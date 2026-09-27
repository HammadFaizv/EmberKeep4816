/**
 * Stage definitions (15 placeholder stages).
 *
 * Stage model:
 *   id, name, description
 *   type         stage type registered in stages/StageRegistry.js ('OPEN_FIELD', 'DEFENSE', 'BOSS_ARENA')
 *   difficulty   index into GAME_CONFIG.difficultyTiers; `scaling` may override single values
 *   startingLevel temporary stage level on entry (almost always 0)
 *   rules        player rules merged over the type defaults (see stages/StageRules.js)
 *   environment  visual theme + arena size + optional objective
 *                + optional `hazards` (stages/ArenaHazards.js: lavaPools, closingRing)
 *                + optional `lanes` for DEFENSE stages (generated when omitted)
 *   waves        [{ duration, spawns: [{ enemy, count, interval, delay, directions }], boss, miniboss }]
 *                A wave with a boss/miniboss lasts until that boss is defeated.
 *   completion   list of conditions that must ALL be met (see StageRules.js COMPLETION_CONDITIONS)
 *   rewards      granted on completion through RewardSystem
 *   isFinal      completing it triggers VICTORY
 *
 * Map placement/progression is NOT defined here — see mapConfig.js.
 */
const spawn = (enemy, count, interval, delay = 0, directions) => ({ enemy, count, interval, delay, directions });
const goldReward = (amount) => ({ type: 'currency', id: 'gold', amount });

export const STAGES = Object.freeze({
    stage_01: {
        id: 'stage_01', name: 'Forgotten Hut',
        description: 'The witch\'s hut at the edge of the world. The dead are already stirring.',
        type: 'OPEN_FIELD', difficulty: 1, startingLevel: 0,
        environment: { theme: 'meadow', ground: '#2f3b2a', accent: '#3b4a33', width: 1800, height: 1200 },
        waves: [
            { duration: 20, spawns: [spawn('skeleton', 8, 2.2), spawn('bat', 3, 4, 6)] },
            { duration: 25, spawns: [spawn('skeleton', 12, 1.8), spawn('bat', 6, 3, 4)] },
            { duration: 25, spawns: [spawn('skeleton', 12, 1.6), spawn('snake', 6, 3, 5), spawn('bat', 6, 3)] },
            { duration: 30, spawns: [spawn('skeleton', 16, 1.36), spawn('snake', 8, 2.55, 5), spawn('bat', 8, 2.55)] },
            { duration: 35, spawns: [spawn('skeleton', 19, 1.2), spawn('snake', 10, 2.25, 5), spawn('bat', 10, 2.25)] },
        ],
        completion: [{ type: 'surviveAllWaves' }],
        rewards: [goldReward(15)],
    },

    stage_02: {
        id: 'stage_02', name: 'Whispering Fields',
        description: 'Hold your ground in the tall grass as the dead close in from every side.',
        type: 'DEFENSE', difficulty: 1, startingLevel: 0,
        environment: { theme: 'fields', ground: '#3d4526', accent: '#4c5630' },
        waves: [
            { duration: 22, spawns: [spawn('skeleton', 8, 2.4, 0, ['north', 'east']), spawn('bat', 4, 3, 5, ['west'])] },
            { duration: 25, spawns: [spawn('skeleton', 10, 2, 0, ['south', 'west']), spawn('snake', 5, 3, 4, ['north'])] },
            { duration: 28, spawns: [spawn('skeleton', 14, 1.6), spawn('bat', 8, 2.6)] },
            { duration: 33, spawns: [spawn('skeleton', 18, 1.36), spawn('bat', 10, 2.21)] },
            { duration: 38, spawns: [spawn('skeleton', 22, 1.2), spawn('bat', 13, 1.95)] },
        ],
        completion: [{ type: 'surviveAllWaves' }],
        rewards: [goldReward(20)],
    },

    stage_03: {
        id: 'stage_03', name: 'Old Graveyard',
        description: 'Something enormous sleeps beneath the graves. It is waking up.',
        type: 'OPEN_FIELD', difficulty: 2, startingLevel: 0,
        environment: { theme: 'graveyard', ground: '#272a30', accent: '#343842', width: 1600, height: 1100 },
        waves: [
            { duration: 25, spawns: [spawn('skeleton', 14, 1.5), spawn('bat', 6, 3)] },
            { duration: 20, spawns: [spawn('skeleton', 10, 1.4), spawn('skeleton_knight', 1, 1, 10)] },
            { duration: 25, spawns: [spawn('skeleton', 13, 1.19), spawn('skeleton_knight', 1, 0.85, 10)] },
            { duration: 30, spawns: [spawn('skeleton', 16, 1.05), spawn('skeleton_knight', 2, 0.75, 10)] },
            { boss: 'bone_warden', spawns: [spawn('skeleton', 6, 4, 8)] },
        ],
        completion: [{ type: 'defeatBoss' }],
        rewards: [goldReward(40)],
    },

    stage_04: {
        id: 'stage_04', name: 'Goblin Woods',
        description: 'Goblin warbands roam these woods, eager to smash a little doll.',
        type: 'OPEN_FIELD', difficulty: 2, startingLevel: 0,
        environment: { theme: 'forest', ground: '#1f3322', accent: '#29422c', width: 1800, height: 1300 },
        waves: [
            { duration: 25, spawns: [spawn('goblin', 12, 1.8), spawn('goblin_archer', 3, 5, 5)] },
            { duration: 25, spawns: [spawn('goblin', 16, 1.4), spawn('goblin_archer', 5, 4)] },
            { duration: 30, spawns: [spawn('goblin', 20, 1.2), spawn('snake', 8, 3), spawn('goblin_archer', 6, 4)] },
            { duration: 35, spawns: [spawn('goblin', 26, 1.02), spawn('snake', 10, 2.55), spawn('goblin_archer', 8, 3.4)] },
            { duration: 40, spawns: [spawn('goblin', 32, 0.9), spawn('snake', 13, 2.25), spawn('goblin_archer', 10, 3.0)] },
        ],
        completion: [{ type: 'surviveAllWaves' }],
        rewards: [goldReward(35)],
    },

    stage_05: {
        id: 'stage_05', name: 'Broken Bridge',
        description: 'Guard the ruined bridgehead. The bridge north is broken; you will need logs to repair it.',
        type: 'DEFENSE', difficulty: 3, startingLevel: 0,
        environment: { theme: 'river', ground: '#27343a', accent: '#2f4a55' },
        waves: [
            { duration: 25, spawns: [spawn('goblin', 12, 1.6, 0, ['east', 'west']), spawn('bat', 8, 2, 3, ['north'])] },
            { duration: 30, spawns: [spawn('skeleton', 16, 1.3, 0, ['south']), spawn('goblin_archer', 5, 4, 5, ['east', 'west'])] },
            { duration: 30, spawns: [spawn('goblin', 18, 1.1), spawn('skeleton_knight', 2, 10, 5)] },
            { duration: 35, spawns: [spawn('goblin', 23, 0.94), spawn('skeleton_knight', 3, 8.5, 5)] },
            { duration: 40, spawns: [spawn('goblin', 29, 0.83), spawn('skeleton_knight', 3, 7.5, 5)] },
        ],
        completion: [{ type: 'surviveAllWaves' }],
        rewards: [goldReward(50)],
    },

    stage_06: {
        id: 'stage_06', name: 'Rotten Marsh',
        description: 'A swollen horror rules the southern marsh. The villagers say she swallowed a key.',
        type: 'OPEN_FIELD', difficulty: 3, startingLevel: 0,
        environment: { theme: 'marsh', ground: '#2a3324', accent: '#3a4a2a', width: 1700, height: 1200 },
        waves: [
            { duration: 25, spawns: [spawn('snake', 16, 1.4), spawn('bat', 8, 2.5)] },
            { duration: 25, spawns: [spawn('snake', 18, 1.2), spawn('skeleton', 10, 2)] },
            { duration: 30, spawns: [spawn('snake', 23, 1.02), spawn('skeleton', 13, 1.7)] },
            { duration: 35, spawns: [spawn('snake', 29, 0.9), spawn('skeleton', 16, 1.5)] },
            { boss: 'rot_mother', spawns: [spawn('snake', 8, 4, 6)] },
        ],
        completion: [{ type: 'defeatBoss' }],
        rewards: [goldReward(60)],
    },

    stage_07: {
        id: 'stage_07', name: 'Eastern Ruins',
        description: 'The Goblin Chieftain hoards timber in these ruins — exactly what the bridge needs.',
        type: 'OPEN_FIELD', difficulty: 3, startingLevel: 0,
        environment: { theme: 'ruins', ground: '#3a3530', accent: '#48413a', width: 1800, height: 1200 },
        waves: [
            { duration: 25, spawns: [spawn('goblin', 16, 1.4), spawn('goblin_archer', 6, 3.5)] },
            { duration: 30, spawns: [spawn('goblin', 21, 1.19), spawn('goblin_archer', 8, 2.98)] },
            { duration: 35, spawns: [spawn('goblin', 26, 1.05), spawn('goblin_archer', 10, 2.62)] },
            { miniboss: 'goblin_chieftain', spawns: [spawn('goblin', 10, 3, 5)] },
        ],
        completion: [{ type: 'defeatMiniboss' }],
        rewards: [goldReward(55)],
    },

    stage_08: {
        id: 'stage_08', name: 'Cursed Fortress',
        description: 'A fortress whose garrison never stopped standing guard, even after death.',
        type: 'OPEN_FIELD', difficulty: 4, startingLevel: 0,
        environment: { theme: 'fortress', ground: '#2b2b33', accent: '#3a3a46', width: 1600, height: 1100 },
        waves: [
            { duration: 30, spawns: [spawn('skeleton', 20, 1.1), spawn('skeleton_knight', 3, 8)] },
            { duration: 30, spawns: [spawn('skeleton_knight', 6, 4), spawn('bat', 14, 1.6)] },
            { duration: 35, spawns: [spawn('skeleton_knight', 8, 3.4), spawn('bat', 18, 1.36)] },
            { duration: 40, spawns: [spawn('skeleton_knight', 10, 3.0), spawn('bat', 22, 1.2)] },
            { boss: 'iron_revenant', spawns: [spawn('skeleton', 10, 3, 5)] },
        ],
        completion: [{ type: 'defeatBoss' }],
        rewards: [goldReward(90)],
    },

    stage_09: {
        id: 'stage_09', name: 'Sunken Village',
        description: 'Half-drowned houses and things that crawl out of the water at night.',
        type: 'OPEN_FIELD', difficulty: 4, startingLevel: 0,
        environment: { theme: 'village', ground: '#24323a', accent: '#2d4350', width: 1900, height: 1300 },
        waves: [
            { duration: 30, spawns: [spawn('snake', 20, 1.1), spawn('bat', 14, 1.5)] },
            { duration: 30, spawns: [spawn('goblin', 20, 1.1), spawn('goblin_archer', 8, 3)] },
            { duration: 35, spawns: [spawn('snake', 20, 1), spawn('skeleton_knight', 4, 6), spawn('bat', 16, 1.4)] },
            { duration: 40, spawns: [spawn('snake', 26, 0.85), spawn('skeleton_knight', 5, 5.1), spawn('bat', 21, 1.19)] },
            { duration: 45, spawns: [spawn('snake', 32, 0.75), spawn('skeleton_knight', 6, 4.5), spawn('bat', 26, 1.05)] },
        ],
        completion: [{ type: 'surviveAllWaves' }],
        rewards: [goldReward(80)],
    },

    stage_10: {
        id: 'stage_10', name: 'Ancient Gate',
        description: 'Beyond the unsealed gate, the corruption thickens. Hold the gatehouse.',
        type: 'DEFENSE', difficulty: 5, startingLevel: 0,
        environment: { theme: 'gate', ground: '#2e2a26', accent: '#3d3731' },
        waves: [
            { duration: 30, spawns: [spawn('skeleton_knight', 6, 4, 0, ['north']), spawn('skeleton', 20, 1.1)] },
            { duration: 30, spawns: [spawn('goblin', 24, 0.9), spawn('goblin_archer', 8, 3)] },
            { duration: 35, spawns: [spawn('skeleton_knight', 8, 3.5), spawn('bat', 20, 1.2)] },
            { duration: 40, spawns: [spawn('skeleton_knight', 10, 2.98), spawn('bat', 26, 1.02)] },
            { duration: 45, spawns: [spawn('skeleton_knight', 13, 2.62), spawn('bat', 32, 0.9)] },
        ],
        completion: [{ type: 'surviveAllWaves' }],
        rewards: [goldReward(110)],
    },

    stage_11: {
        id: 'stage_11', name: 'Deadlands',
        description: 'Nothing grows here. The ground is made of old bones.',
        type: 'OPEN_FIELD', difficulty: 5, startingLevel: 0,
        environment: { theme: 'deadlands', ground: '#332d27', accent: '#403830', width: 2000, height: 1400 },
        waves: [
            { duration: 35, spawns: [spawn('skeleton', 30, 0.8), spawn('skeleton_knight', 5, 5)] },
            { duration: 35, spawns: [spawn('bat', 30, 0.8), spawn('snake', 20, 1.2)] },
            { duration: 40, spawns: [spawn('skeleton_knight', 12, 2.5), spawn('skeleton', 30, 0.8)] },
            { duration: 45, spawns: [spawn('skeleton_knight', 16, 2.12), spawn('skeleton', 39, 0.68)] },
            { duration: 50, spawns: [spawn('skeleton_knight', 19, 1.88), spawn('skeleton', 48, 0.6)] },
        ],
        completion: [{ type: 'surviveAllWaves' }],
        rewards: [goldReward(130)],
    },

    stage_12: {
        id: 'stage_12', name: 'Soul Wastes',
        description: 'The souls sent before you drifted here. Something is harvesting them.',
        type: 'OPEN_FIELD', difficulty: 6, startingLevel: 0,
        environment: {
            theme: 'wastes', ground: '#221f2e', accent: '#2d2940', width: 1800, height: 1200,
            // The wastes close in on the doll while the Reaper hunts.
            hazards: [{ type: 'closingRing', start: 35, duration: 45, minRadius: 0.42, damage: 7 }],
        },
        waves: [
            { duration: 30, spawns: [spawn('bat', 30, 0.7), spawn('skeleton', 20, 1)] },
            { duration: 35, spawns: [spawn('bat', 39, 0.59), spawn('skeleton', 26, 0.85)] },
            { duration: 40, spawns: [spawn('bat', 48, 0.52), spawn('skeleton', 32, 0.75)] },
            { miniboss: 'soul_reaper', spawns: [spawn('skeleton', 12, 2.5, 4)] },
        ],
        completion: [{ type: 'defeatMiniboss' }],
        rewards: [goldReward(150)],
    },

    stage_13: {
        id: 'stage_13', name: 'Demon Pass',
        description: 'The only road to the mountains. Demons pour down from above.',
        type: 'DEFENSE', difficulty: 7, startingLevel: 0,
        environment: { theme: 'pass', ground: '#35231e', accent: '#452c24' },
        waves: [
            { duration: 30, spawns: [spawn('imp', 20, 1.2, 0, ['north']), spawn('skeleton_knight', 6, 4, 0, ['east', 'west'])] },
            { duration: 35, spawns: [spawn('imp', 30, 0.9), spawn('goblin_archer', 10, 3)] },
            { duration: 40, spawns: [spawn('imp', 36, 0.8), spawn('skeleton_knight', 10, 3)] },
            { duration: 45, spawns: [spawn('imp', 47, 0.68), spawn('skeleton_knight', 13, 2.55)] },
            { duration: 50, spawns: [spawn('imp', 58, 0.6), spawn('skeleton_knight', 16, 2.25)] },
        ],
        completion: [{ type: 'surviveAllWaves' }],
        rewards: [goldReward(180)],
    },

    stage_14: {
        id: 'stage_14', name: 'Lava Foothills',
        description: 'Reach the mountain path at the top of the foothills while the land burns around you.',
        type: 'OPEN_FIELD', difficulty: 7, startingLevel: 0,
        environment: {
            theme: 'lava', ground: '#3a1f18', accent: '#4a271d', width: 1400, height: 2200,
            playerStart: { x: 700, y: 2050 },
            objective: { x: 700, y: 160, radius: 70, label: 'Mountain Path' },
            hazards: [{ type: 'lavaPools', start: 8, interval: 7, count: 2, radius: 50, damage: 8, duration: 4.5, warmup: 1.3 }],
        },
        waves: [
            { duration: 35, spawns: [spawn('imp', 18, 1.6), spawn('skeleton_knight', 4, 7)] },
            { duration: 35, spawns: [spawn('imp', 22, 1.3), spawn('goblin_archer', 6, 4)] },
            { duration: 40, spawns: [spawn('imp', 26, 1.2)] },
            { duration: 45, spawns: [spawn('imp', 34, 1.02)] },
            { duration: 50, spawns: [spawn('imp', 42, 0.9)] },
        ],
        // The mountain path only opens after 90 seconds; both conditions must hold.
        completion: [{ type: 'surviveTime', seconds: 90 }, { type: 'reachObjective' }],
        rewards: [goldReward(200)],
    },

    stage_15: {
        id: 'stage_15', name: 'Lava Mountains',
        description: 'The Demon Lord waits at the summit. Every soul before you fell here.',
        type: 'BOSS_ARENA', difficulty: 8, startingLevel: 0, isFinal: true,
        environment: { theme: 'summit', ground: '#2a1210', accent: '#3d1914', width: 1400, height: 1000 },
        waves: [
            { duration: 30, spawns: [spawn('imp', 31, 1.42), spawn('skeleton_knight', 4, 5.1)] },
            { duration: 35, spawns: [spawn('imp', 38, 1.25), spawn('skeleton_knight', 5, 4.5)] },
            { boss: 'demon_lord', spawns: [spawn('imp', 12, 5, 10)] },
        ],
        completion: [{ type: 'defeatBoss' }],
        rewards: [goldReward(500)],
    },
});
