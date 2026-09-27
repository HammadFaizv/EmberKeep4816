import { UIComponent, el, button } from './dom.js';

/** Main menu: Play / Settings. */
export class MainMenu extends UIComponent {
    build() {
        const { onPlay, onSettings, hasProgress } = this.props;
        return el('div', { class: 'main-menu' }, [
            el('div', { class: 'menu-title' }, [
                el('h1', {}, 'EmberKeep'),
                el('p', { class: 'menu-subtitle' }, 'The 4816th Soul'),
            ]),
            el('div', { class: 'menu-buttons' }, [
                button(hasProgress ? 'Continue Journey' : 'Play', onPlay, 'btn btn-primary btn-large'),
                button('Settings', onSettings, 'btn btn-large'),
            ]),
            el('p', { class: 'menu-footer' }, 'WASD / Arrows to move · Spells cast automatically · Esc to pause'),
        ]);
    }
}
