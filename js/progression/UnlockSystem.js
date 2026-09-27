import { Events } from '../core/EventBus.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { ProgressionRequirement } from './ProgressionRequirement.js';

/**
 * UnlockSystem — owns every "is X unlocked" mutation in the persistent profile:
 * stages (through the WorldMap graph), features, spells, pets and NPC visits.
 *
 * refresh() re-evaluates the map graph and feature requirements after any
 * progression change and emits PATH_UNLOCKED / FEATURE_UNLOCKED for anything new.
 */
export class UnlockSystem {
    constructor({ profile, bus, worldMap }) {
        this.profile = profile;
        this.bus = bus;
        this.worldMap = worldMap;
    }

    markStageCompleted(stageId) {
        const { completedStages } = this.profile.data;
        if (!completedStages.includes(stageId)) completedStages.push(stageId);
    }

    markBossDefeated(bossId) {
        const { defeatedBosses } = this.profile.data;
        if (!defeatedBosses.includes(bossId)) defeatedBosses.push(bossId);
    }

    visitNpc(npcId) {
        const { visitedNpcs } = this.profile.data.story;
        if (!visitedNpcs.includes(npcId)) visitedNpcs.push(npcId);
    }

    unlockFeature(id) {
        const { unlockedFeatures } = this.profile.data;
        if (unlockedFeatures.includes(id)) return;
        unlockedFeatures.push(id);
        this.bus.emit(Events.FEATURE_UNLOCKED, { id, name: GAME_CONFIG.features[id]?.name ?? id });
    }

    unlockSpell(id) {
        const { unlockedSpells } = this.profile.data;
        if (unlockedSpells.includes(id)) return;
        unlockedSpells.push(id);
        this.bus.emit(Events.SPELL_UNLOCKED, { id });
    }

    unlockPet(id) {
        const { pets } = this.profile.data;
        if (pets.includes(id)) return;
        pets.push(id);
        this.bus.emit(Events.PET_UNLOCKED, { id });
    }

    isFeatureUnlocked(id) { return this.profile.isFeatureUnlocked(id); }

    /** Re-evaluates features and map paths. Call after any progression change. */
    refresh() {
        for (const [id, feature] of Object.entries(GAME_CONFIG.features)) {
            if (!this.isFeatureUnlocked(id) && ProgressionRequirement.checkAll(feature.requirements, this.profile)) {
                this.unlockFeature(id);
            }
        }
        // Features can open map nodes (e.g. the shop), so evaluate the map last.
        for (const node of this.worldMap.refresh()) {
            this.bus.emit(Events.PATH_UNLOCKED, { nodeId: node.id, name: node.name });
        }
    }
}
