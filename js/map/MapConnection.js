/**
 * MapConnection — a directed path between two nodes, optionally blocked by a
 * ProgressionGate (broken bridge, sealed gate...).
 */
export class MapConnection {
    constructor({ from, to, gate = null }) {
        this.from = from;      // MapNode
        this.to = to;          // MapNode
        this.gate = gate;      // ProgressionGate | null
    }

    /** Travellable: the source is completed and any gate is open. */
    isOpen(profile) {
        return this.from.completed && (!this.gate || this.gate.isOpen(profile));
    }
}
