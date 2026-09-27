import { PlayerStats } from './PlayerStats.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * PlayerProgression — the persistent profile (read model + persistence).
 *
 * Wraps the raw save object and exposes *queries* ("is stage X completed?").
 * Mutations go through the dedicated systems (CurrencySystem, UnlockSystem,
 * UpgradeSystem...), which then call save(). Nothing here is temporary: stage
 * level, EXP, cards and current spells live on the Stage/Player instead.
 */
export class PlayerProgression {
    constructor(saveManager) {
        this.saveManager = saveManager;
        this.data = saveManager.load();
    }

    save() { return this.saveManager.save(this.data); }

    reset() {
        this.data = this.saveManager.reset();
        this.save();
    }

    // ---- Queries used by requirements, UI and systems --------------------
    isStageCompleted(stageId) { return this.data.completedStages.includes(stageId); }
    isStageUnlocked(stageId) { return this.data.unlockedStages.includes(stageId); }
    completedStageCount() { return this.data.completedStages.length; }
    hasDefeatedBoss(bossId) { return this.data.defeatedBosses.includes(bossId); }
    itemCount(itemId) { return this.data.progressionItems[itemId] ?? 0; }
    currency(id) { return this.data.currencies[id] ?? 0; }
    isSpellUnlocked(spellId) { return this.data.unlockedSpells.includes(spellId); }
    spellLevel(spellId) { return this.data.spellUpgrades[spellId] ?? 0; }
    ownsPet(petId) { return this.data.pets.includes(petId); }
    isFeatureUnlocked(id) { return this.data.unlockedFeatures.includes(id); }
    hasVisitedNpc(npcId) { return this.data.story.visitedNpcs.includes(npcId); }
    hasUpgrade(nodeId) { return this.data.permanentUpgrades.includes(nodeId); }
    ownsRelic(relicId) { return this.data.relics.includes(relicId); }
    isGateOpened(gateId) { return this.data.openedGates.includes(gateId); }
    get ngPlus() { return this.data.story.ngPlus ?? 0; }

    /**
     * Builds the permanent (out-of-stage) stat block: base stats + permanent
     * upgrades + relics (+ pets when `includePets`). Stages start from this and
     * then layer temporary card bonuses on top.
     */
    buildPermanentStats({ upgrades, pets, relics, includePets = true }) {
        const stats = new PlayerStats(GAME_CONFIG.playerBaseStats);
        stats.setBase('petSlots', GAME_CONFIG.playerBaseStats.petSlots + this.data.petSlots);
        upgrades?.applyTo({ stats });
        relics?.applyTo({ stats });
        if (includePets) pets?.applyTo({ stats });
        return stats;
    }
}
