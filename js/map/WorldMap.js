import { MapNode } from './MapNode.js';
import { MapConnection } from './MapConnection.js';
import { ProgressionGate } from './ProgressionGate.js';
import { MapRequirement } from './MapRequirement.js';
import { MAP_NODES, MAP_CONNECTIONS, MAP_GATES } from '../config/mapConfig.js';

/**
 * WorldMap — the stage graph built from mapConfig.
 *
 * Unlock rule for a node:
 *   start node                                   -> unlocked
 *   otherwise: prerequisites met AND (no incoming paths OR any incoming path open)
 * Once a stage node is unlocked it is stored in profile.unlockedStages and
 * stays unlocked.
 *
 * Completion: stage nodes -> stage completed; NPC nodes -> NPC visited;
 * shops/special nodes count as completed once unlocked (so paths through
 * them open).
 */
export class WorldMap {
    constructor({ profile, nodes = MAP_NODES, connections = MAP_CONNECTIONS, gates = MAP_GATES }) {
        this.profile = profile;
        this.gates = new Map(Object.values(gates).map((g) => [g.id, new ProgressionGate(g)]));
        this.nodes = nodes.map((n) => new MapNode(n));
        this.byId = new Map(this.nodes.map((n) => [n.id, n]));
        this.connections = connections.map((c) => {
            const conn = new MapConnection({
                from: this.byId.get(c.from),
                to: this.byId.get(c.to),
                gate: c.gate ? this.gates.get(c.gate) : null,
            });
            conn.from.connections.push(conn);
            conn.to.incoming.push(conn);
            return conn;
        });
        this.refresh();
    }

    getNode(id) { return this.byId.get(id); }
    getNodeByStage(stageId) { return this.nodes.find((n) => n.stageId === stageId); }

    /**
     * Recomputes unlocked/completed flags. Returns nodes that became unlocked
     * during this call. Iterates until stable because completing/unlocking a
     * node (e.g. a shop) can open further paths.
     */
    refresh() {
        const newlyUnlocked = [];
        let changed = true;
        while (changed) {
            changed = false;
            this._updateCompleted();
            for (const node of this.nodes) {
                const wasUnlocked = node.unlocked;
                node.unlocked = this._computeUnlocked(node);
                if (node.unlocked && !wasUnlocked) {
                    changed = true;
                    newlyUnlocked.push(node);
                    if (node.stageId && !this.profile.isStageUnlocked(node.stageId)) {
                        this.profile.data.unlockedStages.push(node.stageId);
                    }
                }
            }
        }
        this._updateCompleted();
        // First call (construction) should not report everything as "new".
        const report = this._initialised ? newlyUnlocked : [];
        this._initialised = true;
        return report;
    }

    lockReasons(node) { return MapRequirement.lockReasons(node, this.profile); }

    _computeUnlocked(node) {
        if (node.start) return true;
        if (node.stageId && this.profile.isStageUnlocked(node.stageId)) return true;
        if (!MapRequirement.nodePrerequisitesMet(node, this.profile)) return false;
        return node.incoming.length === 0 || node.incoming.some((c) => c.isOpen(this.profile));
    }

    _updateCompleted() {
        for (const node of this.nodes) node.completed = node.unlocked && this._computeCompleted(node);
    }

    _computeCompleted(node) {
        if (node.stageId) return this.profile.isStageCompleted(node.stageId);
        if (node.npcId) return this.profile.hasVisitedNpc(node.npcId);
        return true;
    }
}
