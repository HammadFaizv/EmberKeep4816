import { OpenFieldStage } from './OpenFieldStage.js';
import { DefenseStage } from './DefenseStage.js';
import { BossArenaStage } from './BossArenaStage.js';

/**
 * StageRegistry — maps a stage `type` string to its class (plugin-style).
 *
 * StageManager/StageFactory never branch on type; adding a new stage type is:
 *   1. class EscortStage extends Stage (or OpenFieldStage) { static type = 'ESCORT'; ... }
 *   2. StageRegistry.register(EscortStage)
 *   3. use `type: 'ESCORT'` in stageConfig.js
 *   4. (optional) register a backdrop painter in rendering/StageRenderer.js
 *
 * Planned types and the hooks they will need:
 *   ESCORT            escort NPC entity + 'escortSurvives' completion condition
 *   SURVIVAL          endless spawner + 'surviveTime' condition (already registered)
 *   TIMED_CHALLENGE   onUpdate() fails the stage when a timer expires
 *   PUZZLE            interactable entities + custom completion condition
 *   DUNGEON           multiple rooms: createWorld() builds a room graph
 *   MOVING            onUpdate() scrolls the camera/arena bounds
 *   OBJECTIVE         capture points: reuse 'reachObjective' or add 'holdObjective'
 */
const TYPES = new Map();

export const StageRegistry = {
    register(StageClass, type = StageClass.type) {
        TYPES.set(type, StageClass);
    },

    get(type) {
        const cls = TYPES.get(type);
        if (!cls) throw new Error(`StageRegistry: no stage class registered for type "${type}"`);
        return cls;
    },

    types() { return [...TYPES.keys()]; },
};

StageRegistry.register(OpenFieldStage);
StageRegistry.register(DefenseStage);
StageRegistry.register(BossArenaStage);
