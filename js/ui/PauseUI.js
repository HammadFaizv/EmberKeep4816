import { UIComponent, el, button } from './dom.js';

/** Pause overlay: resume or abandon the stage. */
export class PauseUI extends UIComponent {
    build() {
        const { onResume, onAbandon, stageName } = this.props;
        return el('div', { class: 'modal-backdrop' }, [
            el('div', { class: 'panel modal pause-menu' }, [
                el('h2', {}, 'Paused'),
                el('p', { class: 'muted' }, stageName),
                button('Resume', onResume, 'btn btn-primary'),
                button('Abandon Stage', onAbandon, 'btn btn-danger'),
                el('p', { class: 'muted small' }, 'Abandoning keeps your gold but ends this attempt.'),
            ]),
        ]);
    }
}
