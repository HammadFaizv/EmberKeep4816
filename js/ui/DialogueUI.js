import { UIComponent, el, button } from './dom.js';

/** Simple NPC dialogue box, one line at a time. */
export class DialogueUI extends UIComponent {
    constructor(props) {
        super({ ...props, index: 0 });
    }

    build() {
        const { name, lines, index = 0 } = this.props;
        const last = index >= lines.length - 1;
        return el('div', { class: 'modal-backdrop' }, [
            el('div', { class: 'panel dialogue' }, [
                el('div', { class: 'dialogue-name' }, name),
                el('p', { class: 'dialogue-line' }, `“${lines[index]}”`),
                el('div', { class: 'modal-actions' }, [
                    button(last ? 'Continue' : 'Next', () => this.next(), 'btn btn-primary'),
                ]),
            ]),
        ]);
    }

    next() {
        if (this.props.index >= this.props.lines.length - 1) {
            this.props.onDone();
            return;
        }
        this.props.index += 1;
        this.rerender();
    }
}
