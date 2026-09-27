import { StageRegistry } from './StageRegistry.js';

/**
 * StageFactory — builds and initialises a Stage from its definition using the
 * StageRegistry. No if/else on stage type anywhere.
 */
export class StageFactory {
    constructor({ services, registry = StageRegistry }) {
        this.services = services;
        this.registry = registry;
    }

    create(def) {
        const StageClass = this.registry.get(def.type);
        return new StageClass(def, this.services).init();
    }
}
