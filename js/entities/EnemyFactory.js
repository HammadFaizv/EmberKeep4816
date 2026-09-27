import { Enemy } from './Enemy.js';
import { Boss } from './Boss.js';
import { MiniBoss } from './MiniBoss.js';
import { EnemyRegistry } from '../enemies/EnemyRegistry.js';
import { EnemyAI } from '../enemies/EnemyAI.js';

/**
 * EnemyFactory — turns an enemy/boss id into a ready-to-use instance.
 *
 * Class selection: a per-id override from EnemyRegistry.registerClass(), else
 * the class for the definition's `kind` ('boss', 'miniboss', default Enemy).
 * A unique boss with bespoke code would register its own subclass; everything
 * else stays pure configuration.
 */
const KIND_CLASSES = new Map([
    ['enemy', Enemy],
    ['boss', Boss],
    ['miniboss', MiniBoss],
]);

export class EnemyFactory {
    static registerKind(kind, cls) { KIND_CLASSES.set(kind, cls); }

    create(id, { x, y, scaling }) {
        const def = EnemyRegistry.get(id);
        const Cls = EnemyRegistry.getClass(id) ?? KIND_CLASSES.get(def.kind ?? 'enemy') ?? Enemy;
        const enemy = new Cls(def, { x, y, scaling });
        if (def.ai) enemy.ai = EnemyAI.create(def.ai, enemy);
        return enemy;
    }
}
