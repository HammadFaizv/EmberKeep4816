/**
 * Tiny DOM helpers so UI components can build markup declaratively without a
 * framework. All text goes through textContent (no innerHTML injection).
 */
export function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (value === undefined || value === null || value === false) continue;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key === 'style') setStyles(node, value);
        else if (key === 'dataset') Object.assign(node.dataset, value);
        else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
        else if (value === true) node.setAttribute(key, '');
        else node.setAttribute(key, value);
    }
    for (const child of [children].flat(Infinity)) {
        if (child === null || child === undefined || child === false) continue;
        node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
}

/** Applies inline styles, including CSS custom properties (`--element`). */
function setStyles(node, styles) {
    for (const [prop, val] of Object.entries(styles)) {
        if (val === undefined || val === null) continue;
        if (prop.startsWith('--')) node.style.setProperty(prop, val);
        else node.style[prop] = val;
    }
}

export function button(label, onClick, className = 'btn', extra = {}) {
    return el('button', { class: className, onClick, type: 'button', ...extra }, label);
}

/** Base class for UI screens: build() returns the root element. */
export class UIComponent {
    constructor(props = {}) {
        this.props = props;
        this.el = this.build();
    }

    build() { return el('div'); }

    /** Replace the root element's content with a freshly built one. */
    rerender() {
        const next = this.build();
        this.el.replaceWith(next);
        this.el = next;
    }

    destroy() {
        this.el.remove();
    }
}

export function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
