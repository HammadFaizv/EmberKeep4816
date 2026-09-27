import { GAME_CONFIG } from '../config/gameConfig.js';
import { ProgressionRequirement } from '../progression/ProgressionRequirement.js';

/**
 * StageRules — player rules, difficulty scaling and completion conditions.
 *
 * Everything here is data-driven and shared by all stage types:
 *   resolveRules()      type defaults <- stage overrides
 *   resolveScaling()    difficulty tier <- stage `scaling` overrides
 *   CompletionConditions registry of "is the stage won?" checks
 */

/** Default player rules. Stage types override some; stage data may override any. */
export const BASE_RULES = Object.freeze({
    canMove: true,
    autoCollectPickups: false,
    allowPets: true,
    bannedSpells: [],
    allowedSpells: null,        // null = every unlocked spell
    completionDelay: 1.5,       // seconds between "won" and the results screen
});

export function resolveRules(typeDefaults = {}, overrides = {}) {
    return { ...BASE_RULES, ...typeDefaults, ...overrides };
}

export function resolveScaling(def) {
    const tiers = GAME_CONFIG.difficultyTiers;
    const tier = tiers[Math.min(def.difficulty ?? 1, tiers.length - 1)];
    return { ...tier, ...(def.scaling ?? {}) };
}

/**
 * Completion conditions: `check(condition, stage) -> boolean`.
 * A stage's `completion` list must ALL pass.
 *
 * To add one (e.g. 'escortSurvives', 'solvePuzzle'):
 *   CompletionConditions.register('escortSurvives', { check, describe });
 */
const CONDITIONS = new Map();

export const CompletionConditions = {
    register(type, def) { CONDITIONS.set(type, def); },

    check(conditions, stage) {
        return conditions.length > 0 && conditions.every((c) => {
            const def = CONDITIONS.get(c.type);
            if (!def) console.warn(`CompletionConditions: unknown "${c.type}"`);
            return def ? def.check(c, stage) : false;
        });
    },

    describe(condition) {
        return CONDITIONS.get(condition.type)?.describe(condition) ?? condition.type;
    },
};

CompletionConditions.register('surviveAllWaves', {
    check: (c, stage) => stage.spawner.allWavesComplete,
    describe: () => 'Survive every wave',
});
CompletionConditions.register('defeatBoss', {
    check: (c, stage) => stage.defeated.some((b) => b.kind === 'boss' && (!c.id || b.id === c.id)),
    describe: () => 'Defeat the boss',
});
CompletionConditions.register('defeatMiniboss', {
    check: (c, stage) => stage.defeated.some((b) => b.kind === 'miniboss' && (!c.id || b.id === c.id)),
    describe: () => 'Defeat the miniboss',
});
CompletionConditions.register('reachObjective', {
    check: (c, stage) => {
        const obj = stage.environment.objective;
        return Boolean(obj) && stage.player.pos.distanceTo(obj) <= obj.radius;
    },
    describe: () => 'Reach the objective',
});
CompletionConditions.register('surviveTime', {
    check: (c, stage) => stage.elapsed >= c.seconds,
    describe: (c) => `Survive for ${c.seconds} seconds`,
});
CompletionConditions.register('killCount', {
    check: (c, stage) => stage.stats.kills >= c.count,
    describe: (c) => `Defeat ${c.count} enemies`,
});
CompletionConditions.register('requirement', {
    // Bridges to persistent requirements, e.g. { type: 'requirement', requirement: { type: 'hasItem', id } }
    check: (c, stage) => ProgressionRequirement.check(c.requirement, stage.services.profile),
    describe: (c) => ProgressionRequirement.describe(c.requirement),
});
