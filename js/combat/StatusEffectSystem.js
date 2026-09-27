/**
 * StatusEffectSystem — timed conditions on combatants (burn, poison, slow,
 * chill, freeze, stun...).
 *
 * Each status type is registered with hooks:
 *   onApply(target, status, system)          optional, first application
 *   onReapply(target, status, def, system)   optional, status already present
 *                                            (default: refresh duration, merge fields)
 *   tick(target, status, dt, system)         called every update while active
 * Status instances live on `target.statuses`. Every update the system resets
 * derived flags (moveMult, stunned, frozen) and lets active statuses re-apply
 * them, so expiring statuses clean up automatically.
 *
 * The same system runs for enemies AND the player (snake poison, lava burns).
 */
const TYPES = new Map();

export class StatusEffectSystem {
    static register(type, definition) { TYPES.set(type, definition); }

    constructor({ rng, combat = null }) {
        this.rng = rng;
        this.combat = combat; // set by CombatSystem (for damage-over-time)
    }

    has(target, type) { return target.statuses?.some((s) => s.type === type) ?? false; }
    get(target, type) { return target.statuses?.find((s) => s.type === type) ?? null; }

    remove(target, type) {
        target.statuses = target.statuses.filter((s) => s.type !== type);
    }

    apply(target, def, source = null) {
        if (!target.targetable || !TYPES.has(def.type)) return;
        if (def.chance !== undefined && !this.rng.chance(def.chance)) return;
        const type = TYPES.get(def.type);

        const existing = this.get(target, def.type);
        if (existing) {
            if (type.onReapply) type.onReapply(target, existing, def, this);
            else Object.assign(existing, { ...def, remaining: Math.max(existing.remaining, def.duration) });
        } else {
            const status = { stacks: 1, ...def, remaining: def.duration, tickTimer: 0, source };
            target.statuses.push(status);
            type.onApply?.(target, status, this);
        }
        target.onStatusApplied?.(def.type, def);
    }

    update(dt, targets) {
        for (const target of targets) {
            target.moveMult = 1;
            target.stunned = false;
            target.frozen = false;
            if (target.statuses.length === 0) continue;
            for (const status of target.statuses) {
                status.remaining -= dt;
                TYPES.get(status.type)?.tick?.(target, status, dt, this);
            }
            target.statuses = target.statuses.filter((s) => s.remaining > 0);
        }
    }
}

/** Shared damage-over-time tick: `status.dps` (× stacks) every 0.5s. */
function dotTick(defaultElement) {
    return (target, status, dt, system) => {
        status.tickTimer += dt;
        if (status.tickTimer >= 0.5) {
            status.tickTimer -= 0.5;
            system.combat?.applyDamageOverTime(target, status.dps * (status.stacks ?? 1) * 0.5, status.element ?? defaultElement);
        }
    };
}

StatusEffectSystem.register('burn', {
    // Damage over time; element comes from the spell that applied it.
    tick: dotTick('fire'),
});

StatusEffectSystem.register('poison', {
    // Stacks up to `maxStacks`; each re-application adds a stack and refreshes duration.
    onReapply(target, status, def) {
        status.stacks = Math.min(def.maxStacks ?? 5, status.stacks + 1);
        status.remaining = Math.max(status.remaining, def.duration);
        status.dps = Math.max(status.dps, def.dps);
    },
    tick: dotTick('poison'),
});

StatusEffectSystem.register('slow', {
    tick(target, status) {
        target.moveMult *= 1 - (status.amount ?? 0.3);
    },
});

StatusEffectSystem.register('chill', {
    // A stacking slow. Reaching `freezeAt` stacks converts it into a freeze.
    onReapply(target, status, def, system) {
        status.stacks += 1;
        status.remaining = Math.max(status.remaining, def.duration);
        if (def.freezeAt && status.stacks >= def.freezeAt) {
            system.remove(target, 'chill');
            system.apply(target, { type: 'freeze', duration: def.freezeDuration ?? 1.2, element: 'ice' });
        }
    },
    tick(target, status) {
        target.moveMult *= 1 - Math.min(0.6, (status.amount ?? 0.15) * status.stacks);
    },
});

StatusEffectSystem.register('freeze', {
    // Frozen targets cannot move or attack. Bosses are too large to freeze
    // solid: they are heavily slowed instead.
    tick(target) {
        target.frozen = true;
        if (target.isBoss) target.moveMult *= 0.35;
        else target.stunned = true;
    },
});

StatusEffectSystem.register('stun', {
    // Bosses ignore the flag; their FSM receives the stun via onStatusApplied.
    tick(target) {
        if (!target.isBoss) target.stunned = true;
    },
});
