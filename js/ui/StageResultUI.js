import { UIComponent, el, button, formatTime } from './dom.js';
import { ITEMS, CURRENCIES } from '../config/itemConfig.js';
import { SPELLS } from '../config/spellConfig.js';

/** Stage complete / DEFEATED summary with the appropriate actions. */
export class StageResultUI extends UIComponent {
    build() {
        const { victory, summary, onContinue, onRetry, onMap } = this.props;
        return el('div', { class: 'modal-backdrop' }, [
            el('div', { class: `panel modal result ${victory ? 'result-win' : 'result-loss'}` }, [
                el('h2', { class: 'result-title' }, victory ? 'Stage Complete' : 'DEFEATED'),
                el('p', { class: 'muted' }, summary.name),
                el('div', { class: 'result-stats' }, [
                    stat('Level reached', summary.level),
                    stat('Enemies slain', summary.kills),
                    stat('Gold collected', summary.gold),
                    stat('Time', formatTime(summary.time)),
                    summary.souls ? stat('Souls', summary.souls) : null,
                    summary.combos ? stat('Combos', summary.combos) : null,
                ]),
                summary.rewards.length ? el('div', { class: 'result-rewards' }, [
                    el('h3', {}, 'Rewards'),
                    el('ul', {}, summary.rewards.map((r) => el('li', {}, describeReward(r)))),
                ]) : null,
                summary.newPaths.length ? el('div', { class: 'result-rewards' }, [
                    el('h3', {}, 'New paths'),
                    el('ul', {}, summary.newPaths.map((n) => el('li', {}, n))),
                ]) : null,
                victory ? null : el('p', { class: 'muted small' }, 'Your gold, spells, upgrades and items are safe. Only this stage\'s level and cards are lost.'),
                el('div', { class: 'modal-actions' }, victory
                    ? [button('Continue', onContinue, 'btn btn-primary')]
                    : [button('Retry', onRetry, 'btn btn-primary'), button('Return to Map', onMap, 'btn')]),
            ]),
        ]);
    }
}

function stat(label, value) {
    return el('div', { class: 'result-stat' }, [el('span', { class: 'muted small' }, label), el('strong', {}, String(value))]);
}

export function describeReward(r) {
    switch (r.type) {
        case 'currency': return `${r.amount} ${CURRENCIES[r.id]?.name ?? r.id}`;
        case 'item': return `${ITEMS[r.id]?.name ?? r.id}${r.amount > 1 ? ` ×${r.amount}` : ''}`;
        case 'unlockSpell': return `Spell: ${SPELLS[r.id]?.name ?? r.id}`;
        default: return r.id ?? r.type;
    }
}
