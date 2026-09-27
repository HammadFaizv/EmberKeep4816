import { UIComponent, el, button } from './dom.js';

/** Final victory screen after the Demon Lord falls. */
export class VictoryUI extends UIComponent {
    build() {
        return el('div', { class: 'modal-backdrop' }, [
            el('div', { class: 'panel modal victory' }, [
                el('h2', { class: 'result-title' }, 'The Demon Lord Has Fallen'),
                ...this.props.lines.map((l) => el('p', {}, l)),
                el('div', { class: 'modal-actions' }, [button('Return to the Map', this.props.onContinue, 'btn btn-primary')]),
            ]),
        ]);
    }
}
