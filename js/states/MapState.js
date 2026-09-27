import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { MapUI } from '../ui/MapUI.js';
import { DialogueUI } from '../ui/DialogueUI.js';
import { NPCS } from '../config/npcConfig.js';

/**
 * MAP — world map navigation. Canvas draws the graph (MapRenderer); MapUI
 * shows details. Selecting a node and activating it routes to the right state
 * based on node data (stage / shop / npc) — no per-stage logic here.
 */
export class MapState extends BaseState {
    enter() {
        const { worldMap, session } = this.game;
        this.selected = worldMap.getNode(session.currentNodeId) ?? this._suggestedNode();
        this.hover = null;
        this.dialogue = null;
        this.ui = this.mount(new MapUI({
            onActivate: (node) => this.activate(node),
            onOpen: (stateId) => this.game.states.change(stateId),
        }));
        this.refreshUI();
    }

    refreshUI() {
        const { profile, items } = this.game;
        this.ui.refresh({
            gold: profile.currency('gold'),
            items: items.list().filter((i) => i.category !== 'rare' || i.count > 0),
            features: { spellShop: profile.isFeatureUnlocked('spellShop'), pets: profile.isFeatureUnlocked('pets') },
        });
        this.ui.showNode(this.selected, this.selected ? this.game.worldMap.lockReasons(this.selected) : []);
    }

    update() {
        if (this.dialogue) return;
        const { input, renderer, worldMap } = this.game;
        this.hover = input.mouse.inside ? renderer.map.nodeAt(worldMap, input.mouse.x, input.mouse.y) : null;
        this.game.canvas.style.cursor = this.hover ? 'pointer' : 'default';
        const click = input.consumeClick();
        if (click) {
            const node = renderer.map.nodeAt(worldMap, click.x, click.y);
            if (node) {
                this.selected = node;
                this.refreshUI();
            }
        }
        if (input.wasPressed('confirm') && this.selected?.unlocked) this.activate(this.selected);
    }

    activate(node) {
        if (!node.unlocked) return;
        const { states, session } = this.game;
        session.currentNodeId = node.id;
        if (node.stageId) states.change(GameStates.STAGE_LOADING, { stageId: node.stageId });
        else if (node.shopId) states.change(GameStates.SHOP, { shopId: node.shopId });
        else if (node.npcId) this.talkTo(node.npcId);
    }

    talkTo(npcId) {
        const npc = NPCS[npcId];
        this.dialogue = this.mount(new DialogueUI({
            name: npc.name,
            lines: npc.dialogue,
            onDone: () => {
                const { unlocks, rewards, profile, states } = this.game;
                const firstVisit = !profile.hasVisitedNpc(npcId);
                unlocks.visitNpc(npcId);
                if (firstVisit) rewards.grant(npc.onVisit, `npc:${npcId}`);
                unlocks.refresh();
                profile.save();
                this.unmount(this.dialogue);
                this.dialogue = null;
                if (npc.opens) states.change(npc.opens);
                else this.refreshUI();
            },
        }), 'overlay');
    }

    render() {
        this.game.renderer.renderMap(this.game.worldMap, {
            selectedId: this.selected?.id,
            hoverId: this.hover?.id,
            currentId: this.game.session.currentNodeId,
        });
    }

    exit() {
        this.game.canvas.style.cursor = 'default';
        super.exit();
    }

    /** Default selection: the first unlocked, uncompleted stage. */
    _suggestedNode() {
        const nodes = this.game.worldMap.nodes;
        return nodes.find((n) => n.stageId && n.unlocked && !n.completed) ?? nodes.find((n) => n.start);
    }
}
