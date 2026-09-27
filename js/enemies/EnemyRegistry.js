import { ENEMIES } from '../config/enemyConfig.js';
import { BOSSES } from '../config/bossConfig.js';

/**
 * EnemyRegistry — lookup of every enemy/boss definition by id, plus optional
 * per-id class overrides for enemies that genuinely need custom code.
 *
 * Definitions come from config by default; mods or future content packs can
 * call registerDefinition() at startup.
 */
const definitions = new Map();
const classOverrides = new Map();

export const EnemyRegistry = {
    registerDefinition(def) {
        definitions.set(def.id, def);
    },

    registerClass(id, cls) {
        classOverrides.set(id, cls);
    },

    get(id) {
        const def = definitions.get(id);
        if (!def) throw new Error(`EnemyRegistry: unknown enemy "${id}"`);
        return def;
    },

    getClass(id) { return classOverrides.get(id) ?? null; },
    has(id) { return definitions.has(id); },
    all() { return [...definitions.values()]; },
};

Object.values(ENEMIES).forEach((def) => EnemyRegistry.registerDefinition(def));
Object.values(BOSSES).forEach((def) => EnemyRegistry.registerDefinition(def));
