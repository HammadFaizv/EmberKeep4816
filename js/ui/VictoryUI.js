import { UIComponent, el, button } from './dom.js';

/** Final victory screen after the Demon Lord falls, with the New Game+ option. */
export class VictoryUI extends UIComponent {
    build() {
        const { lines, nextCycle, onContinue, onNewGamePlus } = this.props;
        return el('div', { class: 'modal-backdrop' }, [
            el('div', { class: 'panel modal victory' }, [
                el('h2', { class: 'result-title' }, 'The Demon Lord Has Fallen'),
                ...lines.map((l) => el('p', {}, l)),
                el('p', { class: 'small muted' }, `New Game+${nextCycle}: restart the journey north with your gold, souls, spells, upgrades, pets and relics. Every stage is harder and pays more.`),
                el('div', { class: 'modal-actions' }, [
                    button('Return to the Map', onContinue, 'btn'),
                    button(`Begin New Game+${nextCycle}`, onNewGamePlus, 'btn btn-primary'),
                ]),
            ]),
        ]);
    }
}
