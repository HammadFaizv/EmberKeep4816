/**
 * Vector2 — small mutable 2D vector.
 *
 * Methods that end in a verb (add, sub, scale...) mutate and return `this`
 * so they can be chained. Use clone() when you need a copy.
 */
export class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    static from(obj) { return new Vector2(obj.x, obj.y); }
    static fromAngle(angle, length = 1) {
        return new Vector2(Math.cos(angle) * length, Math.sin(angle) * length);
    }

    clone() { return new Vector2(this.x, this.y); }
    set(x, y) { this.x = x; this.y = y; return this; }
    copy(v) { this.x = v.x; this.y = v.y; return this; }

    add(v) { this.x += v.x; this.y += v.y; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    scale(s) { this.x *= s; this.y *= s; return this; }
    addScaled(v, s) { this.x += v.x * s; this.y += v.y * s; return this; }

    length() { return Math.hypot(this.x, this.y); }
    lengthSq() { return this.x * this.x + this.y * this.y; }

    normalize() {
        const len = this.length();
        if (len > 0) { this.x /= len; this.y /= len; }
        return this;
    }

    distanceTo(v) { return Math.hypot(v.x - this.x, v.y - this.y); }
    distanceSqTo(v) {
        const dx = v.x - this.x;
        const dy = v.y - this.y;
        return dx * dx + dy * dy;
    }

    /** Unit vector pointing from this towards `v` (zero vector if equal). */
    directionTo(v) { return new Vector2(v.x - this.x, v.y - this.y).normalize(); }
    angleTo(v) { return Math.atan2(v.y - this.y, v.x - this.x); }
}
