import { UIComponent, el, button } from './dom.js';

/**
 * SettingsUI — volume placeholders, controls reference, and save reset.
 *
 * TODO: Volume sliders are stored but unused until an AudioManager exists.
 * It should read profile.data.settings.volume/music on startup and listen for
 * a SETTINGS_CHANGED event emitted by SettingsState.
 * TODO: Key rebinding — edit InputManager.bindings and persist them in settings.
 */
export class SettingsUI extends UIComponent {
    constructor(props) {
        super({ ...props, confirmReset: false });
    }

    build() {
        const { settings, onChange, onReset, onBack, confirmReset } = this.props;
        const slider = (key, label) => el('label', { class: 'setting-row' }, [
            el('span', {}, label),
            el('input', {
                type: 'range', min: 0, max: 1, step: 0.05, value: settings[key],
                onInput: (e) => onChange(key, Number(e.target.value)),
            }),
        ]);
        return el('div', { class: 'modal-backdrop' }, [
            el('div', { class: 'panel modal settings' }, [
                el('h2', {}, 'Settings'),
                slider('volume', 'Master volume (placeholder)'),
                slider('music', 'Music volume (placeholder)'),
                el('label', { class: 'setting-row' }, [
                    el('span', {}, 'Show damage numbers'),
                    el('input', { type: 'checkbox', checked: settings.showDamageNumbers, onChange: (e) => onChange('showDamageNumbers', e.target.checked) }),
                ]),
                el('h3', {}, 'Controls'),
                el('ul', { class: 'controls-list small' }, [
                    el('li', {}, 'WASD / Arrow keys — move (Open Field stages)'),
                    el('li', {}, 'Spells — cast automatically at enemies in range'),
                    el('li', {}, '1 / 2 / 3 — pick a card'),
                    el('li', {}, 'Esc / P — pause'),
                ]),
                el('h3', {}, 'Save data'),
                confirmReset
                    ? el('div', { class: 'modal-actions' }, [
                        el('span', { class: 'warn small' }, 'This deletes ALL progress. Are you sure?'),
                        button('Yes, reset', onReset, 'btn btn-danger'),
                        button('Cancel', () => { this.props.confirmReset = false; this.rerender(); }, 'btn'),
                    ])
                    : button('Reset save', () => { this.props.confirmReset = true; this.rerender(); }, 'btn btn-danger'),
                el('div', { class: 'modal-actions' }, [button('Back', onBack, 'btn btn-primary')]),
            ]),
        ]);
    }
}
