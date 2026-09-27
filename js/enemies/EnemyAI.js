import { ChaseBehavior } from './behaviors/ChaseBehavior.js';
import { WeavingBehavior } from './behaviors/WeavingBehavior.js';
import { RangedBehavior } from './behaviors/RangedBehavior.js';

/**
 * EnemyAI — registry of reusable movement/attack behaviors.
 *
 * Enemy definitions name a behavior (`ai: 'swoop'`). A behavior key maps to a
 * class plus default parameters, so one class can back several keys
 * ('swoop' and 'slither' are both WeavingBehavior with different params).
 *
 * To add a behavior: create a class in behaviors/ with update(dt, ctx) and
 * register it here (or from anywhere at startup).
 */
const BEHAVIORS = new Map();

export const EnemyAI = {
    register(key, BehaviorClass, params = {}) {
        BEHAVIORS.set(key, { BehaviorClass, params });
    },

    create(key, enemy) {
        const entry = BEHAVIORS.get(key);
        if (!entry) throw new Error(`EnemyAI: unknown behavior "${key}"`);
        return new entry.BehaviorClass(enemy, { ...entry.params, ...(enemy.def.aiParams ?? {}) });
    },
};

EnemyAI.register('chase', ChaseBehavior);
EnemyAI.register('swoop', WeavingBehavior, { amplitude: 0.8, frequency: 4 });
EnemyAI.register('slither', WeavingBehavior, { amplitude: 0.45, frequency: 7 });
EnemyAI.register('ranged', RangedBehavior, { preferredRange: 0.75 });
