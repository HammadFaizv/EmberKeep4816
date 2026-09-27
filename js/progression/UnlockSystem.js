import { Events } from '../core/EventBus.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { ProgressionRequirement } from './ProgressionRequirement.js';

/**
 * UnlockSystem — owns every "is X unlocked" mutation in the persistent profile:
 * stages (through the WorldMap graph), gates, features, spells, pets and NPC visits.
 *
 * refresh() re-evaluates gates, feature requirements and the map graph after
 * any progression change and emits GATE_OPENED / FEATURE_UNLOCKED /
 * PATH_UNLOCKED for anything new.
 */
export class UnlockSystem {
    constructor({ profile, bus, worldMap, items = null }) {
        this.profile = profile;
        this.bus = bus;
        this.worldMap = worldMap;
        this.items = items; // needed to consume gate items
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

    /**
     * Opens item-consuming gates whose requirements are met: the items are
     * removed and the gate is remembered as open for good.
     */
    openGates() {
        for (const gate of this.worldMap.gates.values()) {
            if (!gate.consumes || this.profile.isGateOpened(gate.id) || !gate.canOpen(this.profile)) continue;
            const consumed = gate.consumedItems();
            consumed.forEach(({ id, amount }) => this.items?.remove(id, amount));
            this.profile.data.openedGates.push(gate.id);
            this.bus.emit(Events.GATE_OPENED, { id: gate.id, name: gate.name, consumed });
        }
    }

    /** Re-evaluates gates, features and map paths. Call after any progression change. */
    refresh() {
        this.openGates();
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
