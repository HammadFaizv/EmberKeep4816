/**
 * PixelArt — turns palette-indexed text grids into canvases.
 *
 * A sprite definition (see assets/spriteData.js):
 *   {
 *     palette: { h: '#5a3a28', s: '#f1dfc4', ... },   '.' is always transparent
 *     frames:  [ [ 'rows...' ], ... ],                 one grid per animation frame
 *     mirror:  true,     rows hold the LEFT half; the right half is mirrored
 *     extra:   [ 'rows...' ]  optional full-width layer painted over every frame
 *     outline: '#140c10' | null,  auto 1px outline around opaque pixels
 *     fps, fit, anchorY           animation speed and draw sizing (read by the renderer)
 *   }
 *
 * For every frame we bake three canvases: the sprite, a white silhouette
 * (hit flash) and a frost silhouette (frozen tint), so tinting at draw time
 * is a single drawImage.
 */
export function buildSprite(def) {
    const grids = def.frames.map((rows) => expandRows(rows, def.mirror));
    const extra = def.extra ?? [];
    const w = Math.max(...grids.flatMap((g) => g.map((r) => r.length)), ...extra.map((r) => r.length));
    const h = Math.max(...grids.map((g) => g.length), extra.length);
    const pad = def.outline === null ? 0 : 1;
    const frames = grids.map((grid) => {
        const canvas = makeCanvas(w + pad * 2, h + pad * 2);
        const ctx = canvas.getContext('2d');
        const opaque = paintGrid(ctx, grid, def.palette, pad);
        for (const key of paintGrid(ctx, extra, def.palette, pad)) opaque.add(key);
        if (pad) paintOutline(ctx, opaque, w, h, pad, def.outline ?? '#140c10');
        return { canvas, flash: silhouette(canvas, '#ffffff'), frost: silhouette(canvas, '#bfeaff') };
    });
    return { frames, width: w + pad * 2, height: h + pad * 2, fps: def.fps ?? 0, fit: def.fit ?? 1.3, anchorY: def.anchorY ?? 0.55 };
}

/** Returns a copy of `def` with some palette entries replaced (recolours). */
export function recolor(def, palette) {
    return { ...def, palette: { ...def.palette, ...palette } };
}

function expandRows(rows, mirror) {
    if (!mirror) return rows;
    return rows.map((r) => r + [...r].reverse().join(''));
}

function makeCanvas(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
}

function paintGrid(ctx, grid, palette, pad) {
    const opaque = new Set();
    grid.forEach((row, y) => {
        [...row].forEach((ch, x) => {
            const color = palette[ch];
            if (ch === '.' || ch === ' ' || !color) return;
            ctx.fillStyle = color;
            ctx.fillRect(x + pad, y + pad, 1, 1);
            opaque.add(`${x},${y}`);
        });
    });
    return opaque;
}

/** Dark 1px outline on every transparent pixel that touches an opaque one (4-neighbour). */
function paintOutline(ctx, opaque, w, h, pad, color) {
    ctx.fillStyle = color;
    for (let y = -1; y <= h; y++) {
        for (let x = -1; x <= w; x++) {
            if (opaque.has(`${x},${y}`)) continue;
            if (opaque.has(`${x - 1},${y}`) || opaque.has(`${x + 1},${y}`) || opaque.has(`${x},${y - 1}`) || opaque.has(`${x},${y + 1}`)) {
                ctx.fillRect(x + pad, y + pad, 1, 1);
            }
        }
    }
}

function silhouette(source, color) {
    const canvas = makeCanvas(source.width, source.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
}
