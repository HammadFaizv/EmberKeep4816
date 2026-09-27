/** Stateless math helpers shared by gameplay and rendering code. */

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const TAU = Math.PI * 2;

export function circlesOverlap(a, b) {
    const r = a.radius + b.radius;
    const dx = a.pos.x - b.pos.x;
    const dy = a.pos.y - b.pos.y;
    return dx * dx + dy * dy <= r * r;
}

export function distanceSq(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
}

/** Applies a numeric modifier of the shape { op: 'add' | 'mul' | 'set', value }. */
export function applyOp(base, op, value) {
    switch (op) {
        case 'mul': return base * value;
        case 'set': return value;
        default: return base + value;
    }
}

export function formatNumber(n) {
    return Math.round(n).toLocaleString();
}
