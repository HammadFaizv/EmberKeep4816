/**
 * MapNode — one location on the world map (stage, shop, NPC, special place).
 *
 * Holds static data from mapConfig plus runtime flags (`unlocked`,
 * `completed`) that WorldMap recomputes from the profile. The node never
 * decides its own unlock state.
 */
export class MapNode {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type;
        this.position = { ...data.position };
        this.stageId = data.stageId ?? null;
        this.shopId = data.shopId ?? null;
        this.npcId = data.npcId ?? null;
        this.start = Boolean(data.start);
        this.optional = Boolean(data.optional);
        this.prerequisites = data.prerequisites ?? [];
        this.rewards = data.rewards ?? [];
        this.specialRequirements = data.specialRequirements ?? [];
        this.incoming = [];      // MapConnection[]
        this.connections = [];   // outgoing MapConnection[]
        this.unlocked = false;
        this.completed = false;
    }

    get isStage() { return this.stageId !== null; }
}
