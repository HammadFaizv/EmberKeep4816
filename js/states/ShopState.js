import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { ShopUI } from '../ui/ShopUI.js';

export class ShopState extends BaseState {
    enter({ shopId = 'spell_shop' } = {}) {
        const { shops, costs, profile, states } = this.game;
        this.mount(new ShopUI({
            shop: shops.get(shopId),
            costs,
            profile,
            onBack: () => states.change(GameStates.MAP),
        }), 'overlay');
    }

    render() { this.renderMapBackdrop(); }
}
