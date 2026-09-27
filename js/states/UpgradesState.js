import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { UpgradeTreeUI } from '../ui/UpgradeTreeUI.js';

export class UpgradesState extends BaseState {
    enter() {
        const { upgrades, costs, profile, states } = this.game;
        this.mount(new UpgradeTreeUI({
            upgrades,
            costs,
            profile,
            onBack: () => states.change(GameStates.MAP),
        }), 'overlay');
    }

    render() { this.renderMapBackdrop(); }
}
