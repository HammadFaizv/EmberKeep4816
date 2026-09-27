import { BaseState } from './BaseState.js';
import { GameStates } from '../core/GameState.js';
import { PetUI } from '../ui/PetUI.js';

export class PetsState extends BaseState {
    enter() {
        const { pets, costs, profile, states } = this.game;
        this.mount(new PetUI({
            pets,
            costs,
            profile,
            onBack: () => states.change(GameStates.MAP),
        }), 'overlay');
    }

    render() { this.renderMapBackdrop(); }
}
