import { UIComponent, el, button } from './dom.js';
import { ACTION_LABELS, keyLabel } from '../core/InputManager.js';

/**
 * SettingsUI — volume placeholders, damage numbers, key rebinding and save reset.
 *
 * Rebinding: "Rebind" waits for the next key press (Esc cancels) and reports
 * it through onRebind(action, code); SettingsState persists it and applies it
 * to the InputManager.
 *
 * TODO: Volume sliders are stored but unused until an AudioManager exists.
 * It should read profile.data.settings.volume/music on startup and listen for
 * the SETTINGS_CHANGED event emitted by SettingsState.
 */
export class SettingsUI extends UIComponent {
    constructor(props) {
        super({ ...props, confirmReset: false, listening: null });
        this._onKey = (e) => {
            const action = this.props.listening;
            if (!action) return;
            e.preventDefault();
            e.stopPropagation();
            this.props.listening = null;
            if (e.code !== 'Escape') this.props.onRebind(action, e.code);
            this.rerender();
        };
        window.addEventListener('keydown', this._onKey, true);
    }

    build() {
        const { settings, bindings, onChange, onReset, onResetBindings, onBack, confirmReset, listening } = this.props;
        const slider = (key, label) => el('label', { class: 'setting-row' }, [
            el('span', {}, label),
            el('input', {
                type: 'range', min: 0, max: 1, step: 0.05, value: settings[key],
                onInput: (e) => onChange(key, Number(e.target.value)),
            }),
        ]);
        const bindingRow = (action) => el('div', { class: 'setting-row binding-row' }, [
            el('span', {}, ACTION_LABELS[action]),
            el('span', { class: 'binding-keys' }, listening === action
                ? el('em', { class: 'warn' }, 'Press a key… (Esc cancels)')
                : bindings()[action].map((code) => el('kbd', {}, keyLabel(code)))),
            button('Rebind', () => { this.props.listening = action; this.rerender(); }, 'btn btn-small', { disabled: Boolean(listening) }),
        ]);

        return el('div', { class: 'modal-backdrop' }, [
            el('div', { class: 'panel modal settings' }, [
                el('h2', {}, 'Settings'),
                slider('volume', 'Master volume (no audio yet)'),
                slider('music', 'Music volume (no audio yet)'),
                el('label', { class: 'setting-row' }, [
                    el('span', {}, 'Show damage numbers'),
                    el('input', { type: 'checkbox', checked: settings.showDamageNumbers, onChange: (e) => onChange('showDamageNumbers', e.target.checked) }),
                ]),
                el('h3', {}, 'Controls'),
                el('div', { class: 'bindings' }, Object.keys(ACTION_LABELS).map(bindingRow)),
                el('div', { class: 'modal-actions' }, [button('Reset controls', () => { onResetBindings(); this.rerender(); }, 'btn btn-small')]),
                el('p', { class: 'muted small' }, 'Spells cast automatically · 1 / 2 / 3 pick a card'),
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

    destroy() {
        window.removeEventListener('keydown', this._onKey, true);
        super.destroy();
    }
}
