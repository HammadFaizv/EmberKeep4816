import { Events } from '../core/EventBus.js';
import { CARDS, RARITIES } from '../config/cardConfig.js';
import { SPELLS } from '../config/spellConfig.js';
import { FUSIONS } from '../config/fusionConfig.js';
import { EffectRegistry } from './EffectRegistry.js';

/**
 * CardSystem — builds level-up card offers and applies the chosen card.
 *
 * Offers are generated from data (cardConfig.js):
 *   1. template cards expand into concrete cards (one per spell, per fusion recipe...),
 *   2. cards whose prerequisites fail for the current stage are dropped,
 *   3. N cards are drawn weighted by rarity.
 * The UI only ever receives plain card objects; it never decides what is offered.
 */

/** Stage-time prerequisites (distinct from persistent ProgressionRequirements). */
const PREREQUISITES = {
    canMove: (r, ctx) => ctx.stage.rules.canMove,
    freeSpellSlot: (r, ctx) => ctx.spellBook.hasFreeSlot(),
    hasSpell: (r, ctx) => ctx.spellBook.has(r.id),
    hasSpellWithElement: (r, ctx) => ctx.spellBook.spells.some((s) => s.element === r.element),
    minLevel: (r, ctx) => ctx.stage.levels.level >= r.level,
    stageType: (r, ctx) => ctx.stage.type === r.stageType,
    featureUnlocked: (r, ctx) => ctx.stage.services.profile.isFeatureUnlocked(r.id),
    freeBuildSlot: (r, ctx) => (ctx.stage.freeBuildSlots?.(r.kind).length ?? 0) > 0,
};

/** Template expanders: turn one card definition into several concrete cards. */
const TEMPLATES = {
    perAvailableSpell: (card, ctx) => ctx.availableSpells
        .filter((id) => !ctx.spellBook.has(id))
        .map((id) => instantiate(card, id)),
    perEquippedSpell: (card, ctx) => ctx.spellBook.spells.map((s) => instantiate(card, s.id)),
    /** One card per fusion recipe whose parts are all equipped. */
    perFusionRecipe: (card, ctx) => FUSIONS
        .filter((f) => f.parts.every((id) => ctx.spellBook.has(id)) && !ctx.spellBook.has(f.result))
        .map((f) => {
            const result = SPELLS[f.result];
            const parts = f.parts.map((id) => SPELLS[id]?.name ?? id).join(' + ');
            return {
                ...card,
                id: `${card.id}:${f.id}`,
                baseId: card.id,
                spellId: f.result,
                element: result.element,
                name: card.name.replace('{spell}', result.name),
                description: card.description.replace('{parts}', parts).replace('{spell}', result.name),
                meta: result.description,
                effects: [{ type: 'fuseSpells', parts: f.parts, result: f.result }],
            };
        }),
};

function instantiate(card, spellId) {
    const spellName = SPELLS[spellId]?.name ?? spellId;
    return {
        ...card,
        id: `${card.id}:${spellId}`,
        baseId: card.id,
        spellId,
        element: SPELLS[spellId]?.element,
        name: card.name.replace('{spell}', spellName),
        description: card.description.replace('{spell}', spellName),
    };
}

export class CardSystem {
    constructor({ bus, rng, cards = CARDS }) {
        this.bus = bus;
        this.rng = rng;
        this.cards = cards;
    }

    static registerPrerequisite(type, fn) { PREREQUISITES[type] = fn; }
    static registerTemplate(type, fn) { TEMPLATES[type] = fn; }

    /**
     * @param {number} count
     * @param {{ stage, player, spellBook, availableSpells: string[] }} ctx
     */
    generate(count, ctx) {
        const pool = this.cards
            .flatMap((card) => (card.template ? TEMPLATES[card.template]?.(card, ctx) ?? [] : [card]))
            .filter((card) => this._prerequisitesMet(card, ctx));
        return this.rng.weightedSample(pool, count, (card) => card.weight ?? RARITIES[card.rarity]?.weight ?? 1);
    }

    apply(card, ctx) {
        EffectRegistry.apply(card.effects, {
            stats: ctx.player.stats,
            player: ctx.player,
            spellBook: ctx.spellBook,
            spellId: card.spellId,
            stage: ctx.stage,
            onFused: (spell) => this.bus.emit(Events.SPELLS_FUSED, { spell }),
        }, `card:${card.id}`);
        ctx.player.onStatsChanged();
        for (const e of card.effects) {
            if (e.type === 'timedStat') this.bus.emit(Events.BUFF_APPLIED, { label: e.label, duration: e.duration });
        }
        this.bus.emit(Events.CARD_SELECTED, { card });
    }

    _prerequisitesMet(card, ctx) {
        return (card.prerequisites ?? []).every((req) => {
            const check = PREREQUISITES[req.type];
            if (!check) console.warn(`CardSystem: unknown prerequisite "${req.type}"`);
            return check ? check(req, ctx) : false;
        });
    }
}
