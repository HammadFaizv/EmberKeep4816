import { Boss } from './Boss.js';

/**
 * MiniBoss — a Boss flagged as a miniboss. Shares the FSM architecture but
 * emits MINIBOSS_DEFEATED and satisfies `defeatMiniboss` completion conditions.
 *
 * TODO: Miniboss-specific rules (e.g. fleeing at low HP to return later in
 * another stage) belong here as overrides, or as an extra 'FLEE' BossState
 * listed in the miniboss's `fsm.states`.
 */
export class MiniBoss extends Boss {
    constructor(def, options) {
        super({ ...def, kind: 'miniboss' }, options);
    }
}
