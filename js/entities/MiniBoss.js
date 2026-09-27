import { Boss } from './Boss.js';

/**
 * MiniBoss — a Boss flagged as a miniboss. Shares the FSM architecture but
 * emits MINIBOSS_DEFEATED and satisfies `defeatMiniboss` completion conditions.
 *
 * Minibosses can FLEE: with `fsm.flee = { at: 0.3, ... }` and 'FLEE' in
 * `fsm.states`, the miniboss breaks off once when its HP drops below `at`,
 * running away, regenerating and calling for help (see bosses/states/FleeState.js).
 */
export class MiniBoss extends Boss {
    constructor(def, options) {
        super({ ...def, kind: 'miniboss' }, options);
        this.hasFled = false;
    }

    wantsToFlee() {
        const flee = this.fsmConfig.flee;
        return Boolean(flee) && !this.hasFled && this.hpRatio <= flee.at;
    }
}
