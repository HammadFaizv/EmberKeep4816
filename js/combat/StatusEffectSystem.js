/**
 * StatusEffectSystem — timed conditions on combatants (burn, slow, stun...).
 *
 * Each status type is registered with hooks:
 *   onApply(target, status)      optional
 *   tick(target, status, dt, ctx) called every update while active
 * Status instances live on `target.statuses`. Every update the system resets
 * derived flags (moveMult, stunned) and lets active statuses re-apply them, so
 * expiring statuses clean up automatically.
 *
 * To add a status (e.g. 'poison', 'freeze'), call StatusEffectSystem.register().
 */
const TYPES = new Map();

export class StatusEffectSystem {
    static register(type, definition) { TYPES.set(type, definition); }

    constructor({ rng, combat = null }) {
        this.rng = rng;
        this.combat = combat; // set by CombatSystem (for damage-over-time)
    }

    apply(target, def, source = null) {
        if (!target.targetable || !TYPES.has(def.type)) return;
        if (def.chance !== undefined && !this.rng.chance(def.chance)) return;

        const existing = target.statuses.find((s) => s.type === def.type);
        if (existing) {
            existing.remaining = Math.max(existing.remaining, def.duration);
            Object.assign(existing, { ...def, remaining: existing.remaining });
        } else {
            const status = { ...def, remaining: def.duration, tickTimer: 0, source };
            target.statuses.push(status);
            TYPES.get(def.type).onApply?.(target, status);
        }
        target.onStatusApplied?.(def.type, def);
    }

    update(dt, targets, ctx) {
        for (const target of targets) {
            target.moveMult = 1;
            target.stunned = false;
            if (target.statuses.length === 0) continue;
            for (const status of target.statuses) {
                status.remaining -= dt;
                TYPES.get(status.type)?.tick?.(target, status, dt, this);
            }
            target.statuses = target.statuses.filter((s) => s.remaining > 0);
        }
    }
}

StatusEffectSystem.register('burn', {
    // Damage over time; element comes from the spell that applied it.
    tick(target, status, dt, system) {
        status.tickTimer += dt;
        if (status.tickTimer >= 0.5) {
            status.tickTimer -= 0.5;
            system.combat?.applyDamageOverTime(target, status.dps * 0.5, status.element ?? 'fire');
        }
    },
});

StatusEffectSystem.register('slow', {
    tick(target, status) {
        target.moveMult *= 1 - (status.amount ?? 0.3);
    },
});

StatusEffectSystem.register('stun', {
    // Bosses ignore the flag; their FSM receives the stun via onStatusApplied.
    tick(target) {
        if (!target.isBoss) target.stunned = true;
    },
});
