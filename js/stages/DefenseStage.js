import { Stage } from './Stage.js';
import { Random } from '../utils/Random.js';
import { Structure } from '../entities/Structure.js';
import { LaneBehavior } from '../enemies/behaviors/LaneBehavior.js';
import { STRUCTURES } from '../config/structureConfig.js';
import { Events } from '../core/EventBus.js';
import { Effect } from '../entities/Effect.js';

/**
 * DEFENSE — tower-defense style. The doll is rooted at the centre of a
 * single-screen arena; enemies march in from configured directions along
 * winding LANES. Pickups fly to the player automatically.
 *
 * Lanes: `environment.lanes` may give explicit polylines per direction
 * ({ north: [[x, y], ...] }); otherwise winding lanes are generated from the
 * stage id (deterministic). Ground enemies follow their lane (LaneBehavior);
 * flying enemies and bosses ignore lanes.
 *
 * Structures: level-up cards build barricades (on a lane, blocking it) and
 * arrow towers (beside a lane) on predefined build slots.
 */
const DIRECTIONS = ['north', 'south', 'east', 'west'];

export class DefenseStage extends Stage {
    static type = 'DEFENSE';
    static defaultRules = { canMove: false, autoCollectPickups: true };

    onInit() {
        this.lanes = this.environment.lanes ?? this._generateLanes();
        this.buildSlots = this._buildSlotsFromLanes();
    }

    getSpawnPosition({ directions } = {}) {
        const side = this.rng.pick(directions?.length ? directions : DIRECTIONS);
        const lane = this.lanes[side];
        const [x, y] = lane[0];
        return { x: x + this.rng.range(-12, 12), y: y + this.rng.range(-12, 12), lane };
    }

    getBossSpawnPosition() {
        return { x: this.world.width / 2, y: 60 };
    }

    onEnemySpawned(enemy, spawnInfo) {
        if (!spawnInfo.lane || enemy.isBoss || enemy.tags.has('flying')) return;
        enemy.ai = new LaneBehavior(enemy, { lane: spawnInfo.lane, inner: enemy.ai });
    }

    // ---- Structures -------------------------------------------------------
    freeBuildSlots(kind = null) {
        return this.buildSlots.filter((s) => !s.occupant?.alive && (!kind || s.kind === kind));
    }

    buildStructure(structureId) {
        const def = STRUCTURES[structureId];
        const slot = this.rng.pick(this.freeBuildSlots(def.slot));
        if (!slot) return null;
        const structure = new Structure(def, { x: slot.x, y: slot.y, slot, stats: this.player.stats });
        if (def.spell) structure.spell = this.services.spellFactory.create(def.spell, { owner: structure });
        slot.occupant = structure;
        this.addStructure(structure);
        this.spawnEffect(new Effect({ kind: 'ring', x: slot.x, y: slot.y, duration: 0.5, data: { radius: 40, color: '#e8d9b0' } }));
        this.bus.emit(Events.STRUCTURE_BUILT, { structure });
        return structure;
    }

    // ---- Lane generation ----------------------------------------------------
    /** Winding polylines from each edge to the doll's platform, seeded by stage id. */
    _generateLanes() {
        const rng = new Random([...this.id].reduce((s, c) => s * 31 + c.charCodeAt(0), 11));
        const { width, height } = this.world;
        const c = this.getPlayerStart();
        const end = 70; // stop at the edge of the doll's platform
        const edge = {
            north: { start: [c.x + rng.range(-200, 200), -30], dir: [0, 1] },
            south: { start: [c.x + rng.range(-200, 200), height + 30], dir: [0, -1] },
            east: { start: [width + 30, c.y + rng.range(-120, 120)], dir: [-1, 0] },
            west: { start: [-30, c.y + rng.range(-120, 120)], dir: [1, 0] },
        };
        const lanes = {};
        for (const [side, { start }] of Object.entries(edge)) {
            const points = [start];
            const bends = 3;
            for (let i = 1; i <= bends; i++) {
                const t = i / (bends + 1);
                const x = start[0] + (c.x - start[0]) * t;
                const y = start[1] + (c.y - start[1]) * t;
                const wobble = rng.range(-90, 90) * (1 - t);
                // Offset perpendicular to the lane's main direction.
                points.push(side === 'north' || side === 'south' ? [x + wobble, y] : [x, y + wobble]);
            }
            const last = points[points.length - 1];
            const dx = c.x - last[0];
            const dy = c.y - last[1];
            const d = Math.hypot(dx, dy) || 1;
            points.push([c.x - (dx / d) * end, c.y - (dy / d) * end]);
            lanes[side] = points;
        }
        return lanes;
    }

    /** One barricade slot on each lane and two tower slots beside it. */
    _buildSlotsFromLanes() {
        const slots = [];
        for (const [side, lane] of Object.entries(this.lanes)) {
            const i = Math.max(1, lane.length - 2);
            const [ax, ay] = lane[i - 1];
            const [bx, by] = lane[i];
            const mx = (ax + bx) / 2;
            const my = (ay + by) / 2;
            const len = Math.hypot(bx - ax, by - ay) || 1;
            const px = -(by - ay) / len;
            const py = (bx - ax) / len;
            slots.push({ kind: 'lane', side, x: mx, y: my, occupant: null });
            slots.push({ kind: 'side', side, x: mx + px * 55, y: my + py * 55, occupant: null });
            slots.push({ kind: 'side', side, x: mx - px * 55, y: my - py * 55, occupant: null });
        }
        return slots;
    }
}
