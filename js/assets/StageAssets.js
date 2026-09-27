import { EnemyRegistry } from '../enemies/EnemyRegistry.js';
import { PETS } from '../config/petConfig.js';
import { STRUCTURES } from '../config/structureConfig.js';

/**
 * Builds the asset manifest for a stage definition: every sprite that can
 * appear (wave enemies, bosses and whatever they summon, the doll, equipped
 * pets, pickups, Defense structures) plus the ground texture. A stage may
 * also list external sprite sheets in `def.assets` ({ key, url, frames }).
 */
const ALWAYS = ['doll', 'coin', 'exp_small', 'exp_medium', 'exp_large', 'soul'];

export function stageManifest(def, { equippedPets = [] } = {}) {
    const enemyIds = new Set();
    for (const wave of def.waves ?? []) {
        (wave.spawns ?? []).forEach((s) => enemyIds.add(s.enemy));
        if (wave.boss) enemyIds.add(wave.boss);
        if (wave.miniboss) enemyIds.add(wave.miniboss);
    }
    // Bosses summon adds through attacks and phase events.
    for (const id of [...enemyIds]) {
        const enemy = EnemyRegistry.has(id) ? EnemyRegistry.get(id) : null;
        Object.values(enemy?.attacks ?? {}).forEach((a) => a.enemyId && enemyIds.add(a.enemyId));
        (enemy?.phases ?? []).flatMap((p) => p.onEnter ?? []).forEach((e) => e.enemyId && enemyIds.add(e.enemyId));
    }
    const sprites = new Set(ALWAYS);
    for (const id of enemyIds) {
        const sprite = EnemyRegistry.has(id) ? EnemyRegistry.get(id).render?.sprite : null;
        if (sprite) sprites.add(sprite);
    }
    equippedPets.forEach((id) => PETS[id]?.render?.sprite && sprites.add(PETS[id].render.sprite));
    if (def.type === 'DEFENSE') Object.values(STRUCTURES).forEach((s) => sprites.add(s.render.sprite));

    return {
        sprites: [...sprites],
        textures: [def.environment],
        images: def.assets ?? [],
    };
}
