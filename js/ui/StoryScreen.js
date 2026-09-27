import { UIComponent, el, button } from './dom.js';

/**
 * StoryScreen — paginated lore. Pages advance with Continue (or Enter/Space);
 * Skip ends immediately so it never blocks returning players.
 */
export class StoryScreen extends UIComponent {
    constructor(props) {
        super({ ...props, page: 0 });
        this._onKey = (e) => {
            if (e.code === 'Enter' || e.code === 'Space') this.next();
            if (e.code === 'Escape') this.props.onDone();
        };
        window.addEventListener('keydown', this._onKey);
    }

    build() {
        const { pages, page = 0, onDone } = this.props;
        const last = page >= pages.length - 1;
        return el('div', { class: 'story-screen' }, [
            el('div', { class: 'story-page', key: page },
                pages[page].map((line) => el('p', { class: line.startsWith('\'') ? 'story-quote' : '' }, line))),
            el('div', { class: 'story-controls' }, [
                el('span', { class: 'story-progress' }, `${page + 1} / ${pages.length}`),
                button('Skip', onDone, 'btn btn-ghost'),
                button(last ? 'Begin' : 'Continue', () => this.next(), 'btn btn-primary'),
            ]),
        ]);
    }

    next() {
        if (this.props.page >= this.props.pages.length - 1) {
            this.props.onDone();
            return;
        }
        this.props.page += 1;
        this.rerender();
    }

    destroy() {
        window.removeEventListener('keydown', this._onKey);
        super.destroy();
    }
}
