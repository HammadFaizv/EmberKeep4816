import { BossStateMachine } from './BossStateMachine.js';
import { BossAttacks } from './BossAttacks.js';
import { Cooldown } from '../utils/Timer.js';
import { IdleState } from './states/IdleState.js';
import { ChaseState } from './states/ChaseState.js';
import { AttackState } from './states/AttackState.js';
import { SpecialAttackState } from './states/SpecialAttackState.js';
import { PhaseTransitionState } from './states/PhaseTransitionState.js';
import { StunnedState } from './states/StunnedState.js';
import { FleeState } from './states/FleeState.js';
import { DeadState } from './states/DeadState.js';

/**
 * BossController — builds a boss's FSM from config and owns the shared
 * decision data states need: attack cooldowns and attack selection.
 *
 * To give a boss a unique state, create a BossState subclass, register it
 * with BossController.registerState(), and list its id in the boss's
 * `fsm.states`. No existing state needs to change.
 */
const STATE_CLASSES = new Map(
    [IdleState, ChaseState, AttackState, SpecialAttackState, PhaseTransitionState, StunnedState, FleeState, DeadState]
        .map((cls) => [cls.id, cls]),
);

export class BossController {
    static registerState(StateClass) { STATE_CLASSES.set(StateClass.id, StateClass); }

    constructor(boss) {
        this.boss = boss;
        this.burstCount = 0;
        this.clock = 0;
        this.lastUsed = new Map(); // attackId -> clock time, for variety
        this.basicCooldown = new Cooldown(boss.def.stats.attackCooldown, true);
        this.cooldowns = new Map(
            Object.entries(boss.attacks)
                .filter(([, a]) => a.cooldown)
                .map(([id, a]) => [id, new Cooldown(a.cooldown, false)]),
        );

        this.machine = new BossStateMachine(boss, this);
        const ids = boss.fsmConfig.states ?? [...STATE_CLASSES.keys()].filter((id) => id !== 'FLEE');
        ids.forEach((id) => {
            const cls = STATE_CLASSES.get(id);
            if (cls) this.machine.add(cls);
            else console.warn(`BossController: unknown state "${id}"`);
        });
        this.machine.change('IDLE');
    }

    get cooldownMult() { return this.boss.phase.cooldownMult ?? 1; }

    update(dt, ctx) {
        this.clock += dt;
        this.basicCooldown.update(dt);
        this.cooldowns.forEach((cd) => cd.update(dt));
        if (this.boss.stunImmuneTime > 0) this.boss.stunImmuneTime -= dt;
        this.machine.update(dt, ctx);
    }

    handleEvent(event, data) { this.machine.handleEvent(event, data); }

    /**
     * A special (non-melee) attack from the current phase that is off
     * cooldown. When several are ready, the least recently used one wins, so
     * short-cooldown attacks never starve the rest of the moveset.
     */
    readySpecialAttack() {
        let best = null;
        let bestTime = Infinity;
        for (const id of this.boss.activeAttackIds) {
            if (BossAttacks.isMelee(this.boss, id) || !this.cooldowns.get(id)?.ready) continue;
            const used = this.lastUsed.get(id) ?? -1;
            if (used < bestTime) {
                best = id;
                bestTime = used;
            }
        }
        return best;
    }

    meleeAttack() {
        return this.boss.activeAttackIds.find((id) => BossAttacks.isMelee(this.boss, id)) ?? null;
    }

    triggerCooldown(attackId) {
        const attack = this.boss.attacks[attackId];
        this.lastUsed.set(attackId, this.clock);
        if (BossAttacks.isMelee(this.boss, attackId)) {
            this.basicCooldown.trigger(this.boss.def.stats.attackCooldown * this.cooldownMult);
        } else {
            this.cooldowns.get(attackId)?.trigger(attack.cooldown * this.cooldownMult);
        }
    }
}
