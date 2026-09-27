import { Hazard } from '../entities/Hazard.js';
import { Effect } from '../entities/Effect.js';

/**
 * ArenaHazards — environmental dangers driven by stage data:
 *
 *   environment.hazards: [
 *     { type: 'lavaPools', start: 5, interval: 6, count: 2, radius: 55, damage: 9, duration: 5, warmup: 1.2 },
 *     { type: 'closingRing', start: 20, duration: 40, minRadius: 0.45, damage: 6 },
 *   ]
 *
 * Each type is a small class registered here; the Stage owns one director
 * and updates it every tick. Damage always goes through Hazard entities or
 * CombatSystem.damagePlayer, never directly.
 *
 * To add a type (e.g. 'fallingRocks'): ArenaHazards.register('fallingRocks', class { update(dt, stage) {} }).
 */
const TYPES = new Map();

export class ArenaHazards {
    static register(type, cls) { TYPES.set(type, cls); }

    constructor(stage, configs = []) {
        this.stage = stage;
        this.hazards = configs
            .map((cfg) => {
                const Cls = TYPES.get(cfg.type);
                if (!Cls) console.warn(`ArenaHazards: unknown type "${cfg.type}"`);
                return Cls ? new Cls(cfg, stage) : null;
            })
            .filter(Boolean);
    }

    update(dt) {
        if (this.stage.status !== 'running') return;
        for (const h of this.hazards) h.update(dt, this.stage);
    }

    /** Spawns hazards on demand (boss phase events use this). */
    add(cfg) {
        const Cls = TYPES.get(cfg.type);
        if (Cls) this.hazards.push(new Cls(cfg, this.stage));
    }
}

/** Lava pools erupt near the player after a telegraph, then linger and burn. */
class LavaPools {
    constructor(cfg) {
        this.cfg = { start: 4, interval: 6, count: 2, radius: 55, damage: 9, duration: 5, warmup: 1.2, spread: 220, ...cfg };
        this.timer = this.cfg.start;
    }

    update(dt, stage) {
        this.timer -= dt;
        if (this.timer > 0) return;
        this.timer += this.cfg.interval;
        const { count, radius, damage, duration, warmup, spread } = this.cfg;
        for (let i = 0; i < count; i++) {
            // First pool targets the player's position to force movement.
            const angle = stage.rng.angle();
            const dist = i === 0 ? stage.rng.range(0, 40) : stage.rng.range(80, spread);
            const x = Math.max(radius, Math.min(stage.world.width - radius, stage.player.pos.x + Math.cos(angle) * dist));
            const y = Math.max(radius, Math.min(stage.world.height - radius, stage.player.pos.y + Math.sin(angle) * dist));
            stage.spawnHazard(new Hazard({
                x, y, radius, duration, warmup,
                team: 'enemy',
                tick: { base: 0, element: 'fire', elemental: damage },
                tickInterval: 0.5,
                statusEffects: [{ type: 'burn', duration: 2, dps: damage * 0.3 }],
                visual: { kind: 'lava' },
            }));
        }
    }
}

/**
 * The arena closes in: a ring of fire shrinks toward the centre and burns
 * anyone outside it. Exposes stage.arenaRing for the renderer.
 */
class ClosingRing {
    constructor(cfg, stage) {
        this.cfg = { start: 20, duration: 40, minRadius: 0.45, damage: 6, ...cfg };
        const { width, height } = stage.world;
        this.center = { x: width / 2, y: height / 2 };
        this.maxRadius = Math.hypot(width, height) / 2;
        this.elapsed = 0;
        this.tick = 0;
        stage.arenaRing = { x: this.center.x, y: this.center.y, radius: this.maxRadius, active: false };
    }

    update(dt, stage) {
        this.elapsed += dt;
        const ring = stage.arenaRing;
        if (this.elapsed < this.cfg.start) return;
        if (!ring.active) {
            ring.active = true;
            stage.spawnEffect(new Effect({ kind: 'ring', x: ring.x, y: ring.y, duration: 1, data: { radius: ring.radius, color: '#ff5a1f' } }));
        }
        const t = Math.min(1, (this.elapsed - this.cfg.start) / this.cfg.duration);
        const minR = Math.min(stage.world.width, stage.world.height) * this.cfg.minRadius;
        ring.radius = this.maxRadius + (minR - this.maxRadius) * t;

        this.tick -= dt;
        if (this.tick <= 0) {
            this.tick = 0.5;
            if (stage.player.pos.distanceTo(ring) > ring.radius) {
                stage.combat.damagePlayer({ base: 0, element: 'fire', elemental: this.cfg.damage });
            }
        }
    }
}

ArenaHazards.register('lavaPools', LavaPools);
ArenaHazards.register('closingRing', ClosingRing);
