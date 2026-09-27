/**
 * Currencies and persistent items.
 *
 * CURRENCIES are fungible balances handled by CurrencySystem.
 * ITEMS are counted inventory entries handled by ProgressionItemSystem
 * (progression keys, boss materials, rare drops).
 */
export const CURRENCIES = Object.freeze({
    gold: { id: 'gold', name: 'Gold', icon: '●', color: '#f5c542' },
    // Souls drop from elites, minibosses and bosses; spent at the Relic Merchant.
    souls: { id: 'souls', name: 'Souls', icon: '✦', color: '#b89cff' },
});

export const ITEMS = Object.freeze({
    bridge_logs: {
        id: 'bridge_logs',
        name: 'Bridge Logs',
        category: 'progression',
        description: 'Sturdy logs taken from the Goblin Chieftain\'s camp. Enough to repair a bridge.',
    },
    ancient_key: {
        id: 'ancient_key',
        name: 'Ancient Key',
        category: 'progression',
        description: 'A key of black iron, warm to the touch. It fits the Ancient Gate.',
    },
    bone_crystal: {
        id: 'bone_crystal',
        name: 'Bone Crystal',
        category: 'bossMaterial',
        description: 'Dropped by the Bone Warden. Some spells require it to be unlocked.',
    },
    chieftain_tusk: {
        id: 'chieftain_tusk',
        name: 'Chieftain\'s Tusk',
        category: 'bossMaterial',
        description: 'Dropped by the Goblin Chieftain. Relic Merchants prize it.',
    },
    rot_gland: {
        id: 'rot_gland',
        name: 'Rot Gland',
        category: 'bossMaterial',
        description: 'Dropped by the Rot Mother. Still oozing.',
    },
    iron_heart: {
        id: 'iron_heart',
        name: 'Iron Heart',
        category: 'bossMaterial',
        description: 'The core of the Iron Revenant. Heavy and cold.',
    },
    reaper_shard: {
        id: 'reaper_shard',
        name: 'Reaper Shard',
        category: 'bossMaterial',
        description: 'A splinter of the Soul Reaper\'s scythe.',
    },
    soul_shard: {
        id: 'soul_shard',
        name: 'Soul Shard',
        category: 'rare',
        description: 'A fragment of a broken soul. Rarely dropped by any enemy.',
    },
    demon_heart: {
        id: 'demon_heart',
        name: 'Heart of the Demon Lord',
        category: 'story',
        description: 'Still beating.',
    },
});
