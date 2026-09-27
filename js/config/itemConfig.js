/**
 * Currencies and persistent items.
 *
 * CURRENCIES are fungible balances handled by CurrencySystem.
 * ITEMS are counted inventory entries handled by ProgressionItemSystem
 * (progression keys, boss materials, rare drops).
 */
export const CURRENCIES = Object.freeze({
    gold: { id: 'gold', name: 'Gold', icon: '●', color: '#f5c542' },
    // TODO: Souls — a second currency dropped by elites, spent on rebirth
    // upgrades. Add it here; CurrencySystem/CostSystem/SaveManager handle it
    // automatically (add a save migration to initialise the balance).
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
