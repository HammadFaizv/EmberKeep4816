/**
 * SaveManager — the ONLY module that touches localStorage.
 *
 * Stores the persistent profile (never temporary combat objects). The save is
 * versioned: when the shape changes, bump SAVE_VERSION and add a migration step
 * to MIGRATIONS so old saves upgrade in place instead of being wiped.
 */
export const SAVE_VERSION = 2;

/** Factory for a fresh profile. Keep every persistent field listed here. */
export function createDefaultSave(defaults = {}) {
    return {
        version: SAVE_VERSION,
        currencies: { gold: 0, souls: 0 },
        completedStages: [],
        unlockedStages: [],
        defeatedBosses: [],
        unlockedSpells: [...(defaults.startingSpells ?? [])],
        spellUpgrades: {},          // { [spellId]: level }
        permanentUpgrades: [],      // purchased upgrade node ids
        pets: [],                   // owned pet ids
        equippedPets: [],
        petSlots: 0,                // base slots; upgrades add on top (see PlayerProgression)
        progressionItems: {},       // { [itemId]: count }
        relics: [],                 // owned relic ids (Relic Merchant)
        openedGates: [],            // gates opened for good (item-consuming gates)
        unlockedFeatures: [],       // e.g. 'spellShop', 'pets'
        story: { introSeen: false, visitedNpcs: [], cleared: false, ngPlus: 0 },
        stats: { deaths: 0, stagesPlayed: 0, highestStageLevel: 0 },
        settings: { volume: 0.8, music: 0.6, showDamageNumbers: true, keyBindings: {} },
    };
}

/**
 * Migration steps keyed by the version they upgrade FROM.
 * (deepFill below adds any remaining missing fields afterwards.)
 */
const MIGRATIONS = {
    // v2: Souls currency, relics, item-consuming gates, New Game+, key bindings.
    1: (data) => ({
        ...data,
        version: 2,
        currencies: { souls: 0, ...data.currencies },
        relics: data.relics ?? [],
        openedGates: data.openedGates ?? [],
        story: { cleared: false, ngPlus: 0, ...data.story },
    }),
};

/** Thin storage adapter so tests or a cloud backend can replace localStorage. */
export class LocalStorageAdapter {
    get(key) {
        try { return window.localStorage.getItem(key); } catch { return null; }
    }
    set(key, value) {
        try { window.localStorage.setItem(key, value); return true; } catch { return false; }
    }
    remove(key) {
        try { window.localStorage.removeItem(key); } catch { /* storage unavailable */ }
    }
}

/** In-memory adapter used when localStorage is unavailable (and by tests). */
export class MemoryStorageAdapter {
    constructor() { this.map = new Map(); }
    get(key) { return this.map.get(key) ?? null; }
    set(key, value) { this.map.set(key, value); return true; }
    remove(key) { this.map.delete(key); }
}

export class SaveManager {
    constructor({ key, storage = new LocalStorageAdapter(), defaults = {}, bus = null }) {
        this.key = key;
        this.storage = storage;
        this.defaults = defaults;
        this.bus = bus;
    }

    hasSave() {
        return this.storage.get(this.key) !== null;
    }

    /** Returns the stored profile (migrated) or a fresh default profile. */
    load() {
        const raw = this.storage.get(this.key);
        if (!raw) return createDefaultSave(this.defaults);
        try {
            return this.migrate(JSON.parse(raw));
        } catch (err) {
            console.warn('SaveManager: corrupt save, starting fresh.', err);
            return createDefaultSave(this.defaults);
        }
    }

    save(data) {
        const ok = this.storage.set(this.key, JSON.stringify({ ...data, version: SAVE_VERSION }));
        if (ok) this.bus?.emit('save:written', {});
        return ok;
    }

    reset() {
        this.storage.remove(this.key);
        const fresh = createDefaultSave(this.defaults);
        this.bus?.emit('save:reset', {});
        return fresh;
    }

    /**
     * Upgrades old save data step by step, then fills any fields missing from
     * the default shape so newly added fields never come back undefined.
     */
    migrate(data) {
        let migrated = { ...data };
        let version = migrated.version ?? 0;
        while (version < SAVE_VERSION) {
            const step = MIGRATIONS[version];
            migrated = step ? step(migrated) : { ...migrated, version: version + 1 };
            version = migrated.version;
        }
        return deepFill(migrated, createDefaultSave(this.defaults));
    }
}

function deepFill(target, defaults) {
    for (const [key, value] of Object.entries(defaults)) {
        if (target[key] === undefined) {
            target[key] = structuredClone(value);
        } else if (isPlainObject(value) && isPlainObject(target[key])) {
            deepFill(target[key], value);
        }
    }
    return target;
}

function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}
