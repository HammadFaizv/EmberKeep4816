/**
 * World map graph. The map is pure data: stage classes know nothing about
 * where they sit or what they unlock.
 *
 * Node model:
 *   id, name, type ('stage' | 'miniboss' | 'boss' | 'final_boss' | 'shop' | 'npc' | 'special')
 *   position     normalised { x, y } (0,0 = top-left, 1,1 = bottom-right); NORTH is up
 *   stageId      for playable nodes
 *   shopId/npcId for shop/NPC nodes
 *   start        the node that is always unlocked
 *   optional     side content, not required to reach the final boss
 *   prerequisites ProgressionRequirements the node itself needs (on top of paths)
 *   rewards      extra rewards for first completion of this node
 *   specialRequirements free-form flags reserved for future map mechanics
 *
 * Connections are directed paths. A node unlocks when ANY incoming path is open:
 * its source node is completed and its gate (if any) is passable.
 *
 * Gates are ProgressionGates with ProgressionRequirements. They are generic — the
 * bridge and key are just two data entries. `consumes: true` gates use up their
 * required items when they open (once, permanently).
 */
export const MAP_NODES = Object.freeze([
    { id: 'n_hut', name: 'Forgotten Hut', type: 'stage', stageId: 'stage_01', position: { x: 0.07, y: 0.95 }, start: true },
    { id: 'n_fields', name: 'Whispering Fields', type: 'stage', stageId: 'stage_02', position: { x: 0.19, y: 0.86 } },
    { id: 'n_graveyard', name: 'Old Graveyard', type: 'boss', stageId: 'stage_03', position: { x: 0.3, y: 0.74 } },
    { id: 'n_shop', name: 'Witch\'s Spell Shop', type: 'shop', shopId: 'spell_shop', position: { x: 0.08, y: 0.72 },
        prerequisites: [{ type: 'featureUnlocked', id: 'spellShop' }] },
    { id: 'n_relics', name: 'Relic Merchant', type: 'shop', shopId: 'relic_shop', position: { x: 0.31, y: 0.93 },
        prerequisites: [{ type: 'featureUnlocked', id: 'relicShop' }] },
    { id: 'n_woods', name: 'Goblin Woods', type: 'stage', stageId: 'stage_04', position: { x: 0.45, y: 0.8 } },
    { id: 'n_marsh', name: 'Rotten Marsh', type: 'boss', stageId: 'stage_06', position: { x: 0.13, y: 0.56 }, optional: true },
    { id: 'n_ruins', name: 'Eastern Ruins', type: 'miniboss', stageId: 'stage_07', position: { x: 0.66, y: 0.84 } },
    { id: 'n_bridge', name: 'Broken Bridge', type: 'stage', stageId: 'stage_05', position: { x: 0.46, y: 0.64 } },
    { id: 'n_caretaker', name: 'Animal Caretaker', type: 'npc', npcId: 'animal_caretaker', position: { x: 0.63, y: 0.64 } },
    { id: 'n_fortress', name: 'Cursed Fortress', type: 'boss', stageId: 'stage_08', position: { x: 0.46, y: 0.4 } },
    { id: 'n_village', name: 'Sunken Village', type: 'stage', stageId: 'stage_09', position: { x: 0.27, y: 0.42 } },
    { id: 'n_gate', name: 'Ancient Gate', type: 'stage', stageId: 'stage_10', position: { x: 0.66, y: 0.42 } },
    { id: 'n_deadlands', name: 'Deadlands', type: 'stage', stageId: 'stage_11', position: { x: 0.27, y: 0.3 } },
    { id: 'n_wastes', name: 'Soul Wastes', type: 'miniboss', stageId: 'stage_12', position: { x: 0.72, y: 0.3 } },
    { id: 'n_pass', name: 'Demon Pass', type: 'stage', stageId: 'stage_13', position: { x: 0.5, y: 0.24 } },
    { id: 'n_foothills', name: 'Lava Foothills', type: 'stage', stageId: 'stage_14', position: { x: 0.5, y: 0.13 } },
    { id: 'n_summit', name: 'Lava Mountains', type: 'final_boss', stageId: 'stage_15', position: { x: 0.5, y: 0.0 } },
]);

export const MAP_CONNECTIONS = Object.freeze([
    { from: 'n_hut', to: 'n_fields' },
    { from: 'n_fields', to: 'n_graveyard' },
    { from: 'n_graveyard', to: 'n_woods' },          // fork: east...
    { from: 'n_graveyard', to: 'n_marsh' },          // ...or the optional southern marsh
    { from: 'n_woods', to: 'n_ruins' },
    { from: 'n_woods', to: 'n_bridge' },
    { from: 'n_bridge', to: 'n_caretaker' },
    { from: 'n_bridge', to: 'n_fortress', gate: 'broken_bridge' },
    { from: 'n_fortress', to: 'n_village' },
    { from: 'n_fortress', to: 'n_gate', gate: 'sealed_gate' },
    { from: 'n_village', to: 'n_deadlands' },
    { from: 'n_gate', to: 'n_wastes' },
    { from: 'n_deadlands', to: 'n_pass' },
    { from: 'n_wastes', to: 'n_pass' },
    { from: 'n_pass', to: 'n_foothills' },
    { from: 'n_foothills', to: 'n_summit' },
]);

export const MAP_GATES = Object.freeze({
    broken_bridge: {
        id: 'broken_bridge',
        name: 'Broken Bridge',
        description: 'The bridge north has collapsed. Logs from the Eastern Ruins could repair it.',
        requirements: [{ type: 'hasItem', id: 'bridge_logs' }],
        consumes: true, // the logs are used up repairing the bridge (UnlockSystem opens it once)
    },
    sealed_gate: {
        id: 'sealed_gate',
        name: 'Sealed Ancient Gate',
        description: 'A massive gate sealed with black iron. The Rot Mother of the southern marsh swallowed its key.',
        requirements: [{ type: 'hasItem', id: 'ancient_key' }],
        consumes: true,
    },
});
