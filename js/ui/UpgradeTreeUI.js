import { UIComponent, el, button } from './dom.js';
import { UPGRADE_CATEGORIES } from '../config/upgradeConfig.js';
import { NodeState } from '../progression/UpgradeSystem.js';
import { ProgressionRequirement } from '../progression/ProgressionRequirement.js';

/**
 * UpgradeTreeUI — the permanent upgrade tree as a branching skill tree.
 *
 * Node positions come from upgradeConfig (grid units); connections are drawn
 * as SVG lines from each parent. Clicking a node shows its details and a
 * purchase button. All rules live in UpgradeSystem.
 */
const UNIT_X = 84;
const UNIT_Y = 82;
const NODE = 56;
const PAD = 40;

export class UpgradeTreeUI extends UIComponent {
    constructor(props) {
        super({ ...props, selectedId: props.selectedId ?? 'awakening' });
    }

    build() {
        const { upgrades, costs, profile, onBack } = this.props;
        const nodes = upgrades.nodes;
        const xs = nodes.map((n) => n.position.x);
        const ys = nodes.map((n) => n.position.y);
        const minX = Math.min(...xs);
        const width = (Math.max(...xs) - minX) * UNIT_X + PAD * 2 + NODE;
        const height = (Math.max(...ys) - Math.min(...ys)) * UNIT_Y + PAD * 2 + NODE;
        const pos = (n) => ({
            x: (n.position.x - minX) * UNIT_X + PAD + NODE / 2,
            y: n.position.y * UNIT_Y + PAD + NODE / 2,
        });

        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.classList.add('tree-lines');
        for (const node of nodes) {
            for (const parentId of node.requires) {
                const parent = upgrades.getNode(parentId);
                const a = pos(parent);
                const b = pos(node);
                const line = document.createElementNS(svgNS, 'line');
                Object.entries({ x1: a.x, y1: a.y, x2: b.x, y2: b.y }).forEach(([k, v]) => line.setAttribute(k, v));
                line.setAttribute('class', upgrades.isPurchased(parentId) ? (upgrades.isPurchased(node.id) ? 'line-owned' : 'line-open') : 'line-locked');
                svg.append(line);
            }
        }

        const nodeEls = nodes.map((node) => {
            const state = upgrades.getState(node.id);
            const affordable = state === NodeState.AVAILABLE && costs.canAfford(node.costs);
            const p = pos(node);
            return el('button', {
                type: 'button',
                class: `tree-node state-${state} ${affordable ? 'affordable' : ''} ${node.id === this.props.selectedId ? 'selected' : ''}`,
                style: { left: `${p.x - NODE / 2}px`, top: `${p.y - NODE / 2}px`, '--cat': UPGRADE_CATEGORIES[node.category]?.color },
                title: node.name,
                onClick: () => { this.props.selectedId = node.id; this.rerender(); },
            }, [el('span', { class: 'tree-node-label' }, node.name.split(' ').map((w) => w[0]).join('').slice(0, 3))]);
        });

        return el('div', { class: 'modal-backdrop' }, [
            el('div', { class: 'panel upgrades' }, [
                el('div', { class: 'screen-header' }, [
                    el('h2', {}, 'Soul Tree'),
                    el('span', { class: 'res-gold' }, `● ${profile.currency('gold')}`),
                    button('Back to Map', onBack, 'btn'),
                ]),
                el('div', { class: 'upgrades-body' }, [
                    el('div', { class: 'tree-scroll' }, [
                        el('div', { class: 'tree-canvas', style: { width: `${width}px`, height: `${height}px` } }, [svg, ...nodeEls]),
                    ]),
                    this._details(),
                ]),
                el('div', { class: 'tree-legend small muted' }, Object.values(UPGRADE_CATEGORIES).map((c) =>
                    el('span', { style: { '--cat': c.color }, class: 'legend-item' }, c.name))),
            ]),
        ]);
    }

    _details() {
        const { upgrades, costs, profile } = this.props;
        const node = upgrades.getNode(this.props.selectedId);
        if (!node) return el('aside', { class: 'tree-details' });
        const state = upgrades.getState(node.id);
        const missingParents = node.requires.filter((id) => !upgrades.isPurchased(id)).map((id) => upgrades.getNode(id).name);
        const unmet = ProgressionRequirement.unmet(node.requirements, profile).map((r) => ProgressionRequirement.describe(r));
        return el('aside', { class: 'tree-details' }, [
            el('span', { class: 'tag', style: { borderColor: UPGRADE_CATEGORIES[node.category]?.color } }, UPGRADE_CATEGORIES[node.category]?.name),
            el('h3', {}, node.name),
            el('p', {}, node.description),
            el('p', { class: 'cost' }, `Cost: ${costs.describe(node.costs)}`),
            missingParents.length ? el('p', { class: 'small warn' }, `Requires: ${missingParents.join(', ')}`) : null,
            unmet.length ? el('p', { class: 'small warn' }, unmet.join(', ')) : null,
            state === NodeState.PURCHASED
                ? el('p', { class: 'ok' }, '✓ Purchased')
                : button('Purchase', () => { if (upgrades.purchase(node.id)) this.rerender(); }, 'btn btn-primary',
                    { disabled: !upgrades.canPurchase(node.id) }),
        ]);
    }
}
