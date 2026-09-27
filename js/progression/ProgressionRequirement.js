import { STAGES } from '../config/stageConfig.js';
import { ITEMS, CURRENCIES } from '../config/itemConfig.js';
import { BOSSES } from '../config/bossConfig.js';
import { SPELLS } from '../config/spellConfig.js';
import { PETS } from '../config/petConfig.js';
import { NPCS } from '../config/npcConfig.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * ProgressionRequirement — generic, data-driven unlock conditions.
 *
 * A requirement is plain data: { type: 'hasItem', id: 'bridge_logs' }.
 * Each type registers a `check(req, profile)` and a human-readable
 * `describe(req)`. Map gates, map nodes, features, upgrade nodes and shop items
 * all share this one system.
 *
 * To add a requirement type (e.g. 'questCompleted'):
 *   ProgressionRequirement.register('questCompleted', { check, describe });
 */
const nameOf = (table, id) => table[id]?.name ?? id;

const TYPES = new Map();

export const ProgressionRequirement = {
    register(type, definition) {
        TYPES.set(type, definition);
    },

    check(req, profile) {
        const def = TYPES.get(req.type);
        if (!def) {
            console.warn(`ProgressionRequirement: unknown type "${req.type}"`);
            return false;
        }
        return def.check(req, profile);
    },

    checkAll(reqs = [], profile) {
        return reqs.every((req) => this.check(req, profile));
    },

    unmet(reqs = [], profile) {
        return reqs.filter((req) => !this.check(req, profile));
    },

    describe(req) {
        return TYPES.get(req.type)?.describe(req) ?? req.type;
    },
};

const builtIns = {
    never: { check: () => false, describe: () => 'Not yet available' },
    completeStage: {
        check: (r, p) => p.isStageCompleted(r.id),
        describe: (r) => `Complete ${nameOf(STAGES, r.id)}`,
    },
    completeStages: {
        check: (r, p) => r.ids.every((id) => p.isStageCompleted(id)),
        describe: (r) => `Complete ${r.ids.map((id) => nameOf(STAGES, id)).join(', ')}`,
    },
    completeStageCount: {
        check: (r, p) => p.completedStageCount() >= r.count,
        describe: (r) => `Complete ${r.count} stages`,
    },
    defeatBoss: {
        check: (r, p) => p.hasDefeatedBoss(r.id),
        describe: (r) => `Defeat ${nameOf(BOSSES, r.id)}`,
    },
    defeatMiniboss: {
        check: (r, p) => p.hasDefeatedBoss(r.id),
        describe: (r) => `Defeat the miniboss ${nameOf(BOSSES, r.id)}`,
    },
    hasItem: {
        check: (r, p) => p.itemCount(r.id) >= (r.amount ?? 1),
        describe: (r) => `Obtain ${nameOf(ITEMS, r.id)}${(r.amount ?? 1) > 1 ? ` ×${r.amount}` : ''}`,
    },
    hasCurrency: {
        check: (r, p) => p.currency(r.id) >= r.amount,
        describe: (r) => `Have ${r.amount} ${nameOf(CURRENCIES, r.id)}`,
    },
    spellUnlocked: {
        check: (r, p) => p.isSpellUnlocked(r.id),
        describe: (r) => `Unlock the spell ${nameOf(SPELLS, r.id)}`,
    },
    petUnlocked: {
        check: (r, p) => p.ownsPet(r.id),
        describe: (r) => `Adopt ${nameOf(PETS, r.id)}`,
    },
    featureUnlocked: {
        check: (r, p) => p.isFeatureUnlocked(r.id),
        describe: (r) => `Unlock ${GAME_CONFIG.features[r.id]?.name ?? r.id}`,
    },
    npcVisited: {
        check: (r, p) => p.hasVisitedNpc(r.npcId),
        describe: (r) => `Meet the ${nameOf(NPCS, r.npcId)}`,
    },
    reachLevel: {
        // Stage levels are temporary; this checks the best level ever reached in a stage.
        check: (r, p) => p.data.stats.highestStageLevel >= r.level,
        describe: (r) => `Reach level ${r.level} in a stage`,
    },
    upgradePurchased: {
        check: (r, p) => p.hasUpgrade(r.id),
        describe: (r) => `Purchase upgrade "${r.id}"`,
    },
};

for (const [type, def] of Object.entries(builtIns)) ProgressionRequirement.register(type, def);
