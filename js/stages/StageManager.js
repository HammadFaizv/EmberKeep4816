import { Events } from '../core/EventBus.js';
import { STAGES } from '../config/stageConfig.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * StageManager — owns the current Stage and converts its outcome into
 * PERSISTENT progress. This is the single bridge between temporary stage
 * state and the profile.
 *
 * On completion: grant stage + boss rewards + loot, record bosses, mark the
 * stage completed, re-evaluate unlocks, save.
 * On defeat: keep everything already persistent (gold was credited on pickup),
 * grant collected rare loot, record the death, save. Stage level/EXP/cards are
 * simply discarded with the Stage object.
 */
export class StageManager {
    constructor({ factory, profile, rewards, unlocks, bus, stages = STAGES }) {
        this.factory = factory;
        this.profile = profile;
        this.rewards = rewards;
        this.unlocks = unlocks;
        this.bus = bus;
        this.stages = stages;
        this.current = null;
    }

    getDefinition(stageId) {
        const def = this.stages[stageId];
        if (!def) throw new Error(`StageManager: unknown stage "${stageId}"`);
        return def;
    }

    load(stageId) {
        this.unload();
        this.current = this.factory.create(this.getDefinition(stageId));
        this.profile.data.stats.stagesPlayed += 1;
        return this.current;
    }

    unload() {
        this.current?.destroy();
        this.current = null;
    }

    update(dt) { this.current?.update(dt); }

    /** Applies a won stage to the profile and returns a summary for the UI. */
    completeCurrent() {
        const stage = this.current;
        const summary = this._baseSummary(stage);
        const firstClear = !this.profile.isStageCompleted(stage.id);
        const newPaths = this._collect(Events.PATH_UNLOCKED, () => {
            const stageRewards = this._ngPlusRewards(firstClear ? stage.def.rewards ?? [] : this._repeatRewards(stage.def.rewards));
            const bossRewards = stage.defeated.flatMap((b) => (this.profile.hasDefeatedBoss(b.id) ? [] : b.rewards));
            this.rewards.grant([...stageRewards, ...bossRewards, ...stage.loot], `stage:${stage.id}`);
            summary.rewards = [...stageRewards, ...bossRewards, ...stage.loot];

            stage.defeated.forEach((b) => this.unlocks.markBossDefeated(b.id));
            this.unlocks.markStageCompleted(stage.id);
            this.unlocks.refresh();
        });
        summary.newPaths = newPaths.map((p) => p.name);
        summary.firstClear = firstClear;
        this.profile.save();
        return summary;
    }

    /** Applies a lost stage (death or abandon) and returns a summary. */
    failCurrent() {
        const stage = this.current;
        const summary = this._baseSummary(stage);
        this.rewards.grant(stage.loot, `stage:${stage.id}`);
        summary.rewards = [...stage.loot];
        this.profile.data.stats.deaths += 1;
        this.profile.save();
        return summary;
    }

    _baseSummary(stage) {
        const stats = this.profile.data.stats;
        stats.highestStageLevel = Math.max(stats.highestStageLevel, stage.levels.level);
        return {
            stageId: stage.id,
            name: stage.name,
            level: stage.levels.level,
            kills: stage.stats.kills,
            gold: stage.stats.goldCollected,
            souls: stage.stats.soulsCollected,
            combos: stage.stats.combos,
            time: stage.elapsed,
            rewards: [],
            newPaths: [],
        };
    }

    /** Replays grant a fraction of the gold reward and no items (anti-exploit). */
    _repeatRewards(rewards = []) {
        return rewards
            .filter((r) => r.type === 'currency')
            .map((r) => ({ ...r, amount: Math.ceil(r.amount * 0.25) }));
    }

    /** New Game+ cycles pay more currency. */
    _ngPlusRewards(rewards) {
        const ng = this.profile.ngPlus;
        if (!ng) return rewards;
        const mult = 1 + ng * GAME_CONFIG.newGamePlus.rewardMult;
        return rewards.map((r) => (r.type === 'currency' ? { ...r, amount: Math.round(r.amount * mult) } : r));
    }

    _collect(event, fn) {
        const collected = [];
        const off = this.bus.on(event, (payload) => collected.push(payload));
        try { fn(); } finally { off(); }
        return collected;
    }
}
