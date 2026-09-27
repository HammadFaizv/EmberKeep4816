/**
 * MapRenderer — draws the WorldMap graph: terrain hints, paths, gates, nodes.
 * Also owns the node <-> screen layout so MapState can hit-test clicks.
 */
const TAU = Math.PI * 2;

const NODE_STYLE = {
    stage: { color: '#c9a45c', icon: '⚔', radius: 17 },
    boss: { color: '#c0392b', icon: '☠', radius: 20 },
    miniboss: { color: '#d9822b', icon: '✦', radius: 18 },
    final_boss: { color: '#ff3b1f', icon: '♛', radius: 24 },
    shop: { color: '#8f7cff', icon: '⚗', radius: 16 },
    npc: { color: '#5fbf7f', icon: '☺', radius: 16 },
    special: { color: '#7fe3ff', icon: '★', radius: 16 },
};

export class MapRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.area = { x: 70, y: 86, w: 1140, h: 580 };
    }

    toScreen(position) {
        return { x: this.area.x + position.x * this.area.w, y: this.area.y + position.y * this.area.h };
    }

    nodeAt(worldMap, x, y) {
        return worldMap.nodes.find((n) => {
            const p = this.toScreen(n.position);
            const r = (NODE_STYLE[n.type]?.radius ?? 16) + 8;
            return (p.x - x) ** 2 + (p.y - y) ** 2 <= r * r;
        }) ?? null;
    }

    render(worldMap, { selectedId, hoverId, currentId }) {
        const { ctx, width, height, time } = this.renderer;
        this._terrain(ctx, width, height, time);
        for (const c of worldMap.connections) this._connection(ctx, c, worldMap.profile, time);
        for (const n of worldMap.nodes) this._node(ctx, n, n.id === selectedId, n.id === hoverId, time);
        const current = worldMap.getNode(currentId) ?? worldMap.nodes.find((n) => n.start);
        if (current) this._playerMarker(ctx, this.toScreen(current.position), time);
        this._compass(ctx, width);
    }

    _terrain(ctx, width, height, time) {
        const g = ctx.createLinearGradient(0, 0, 0, height);
        g.addColorStop(0, '#3a1410');     // lava north
        g.addColorStop(0.25, '#2a1f1f');
        g.addColorStop(0.55, '#1f2624');
        g.addColorStop(1, '#1d2a1c');     // green south
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);

        // River separating the south from the fortress lands (the Broken Bridge crosses it).
        const riverY = this.toScreen({ x: 0, y: 0.52 }).y;
        ctx.strokeStyle = '#1f3f55';
        ctx.lineWidth = 26;
        ctx.beginPath();
        ctx.moveTo(0, riverY + 20);
        for (let x = 0; x <= width; x += 40) ctx.lineTo(x, riverY + Math.sin(x / 90 + time * 0.3) * 10);
        ctx.stroke();

        // Marsh
        ctx.fillStyle = 'rgba(70,90,40,0.35)';
        const marsh = this.toScreen({ x: 0.13, y: 0.56 });
        ctx.beginPath();
        ctx.ellipse(marsh.x, marsh.y, 110, 60, 0.3, 0, TAU);
        ctx.fill();

        // Lava glow at the top
        ctx.fillStyle = `rgba(255,80,20,${0.15 + Math.sin(time) * 0.05})`;
        ctx.beginPath();
        ctx.ellipse(width / 2, 60, 260, 70, 0, 0, TAU);
        ctx.fill();
    }

    _connection(ctx, conn, profile, time) {
        const a = this.toScreen(conn.from.position);
        const b = this.toScreen(conn.to.position);
        const open = conn.isOpen(profile);
        const gateClosed = conn.gate && !conn.gate.isOpen(profile);

        ctx.save();
        ctx.lineWidth = open ? 4 : 3;
        if (open) {
            ctx.strokeStyle = '#d8b25c';
        } else if (gateClosed && conn.from.completed) {
            ctx.strokeStyle = '#a33b3b';
            ctx.setLineDash([10, 8]);
        } else {
            ctx.strokeStyle = 'rgba(200,190,170,0.25)';
            ctx.setLineDash([4, 8]);
        }
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();

        if (conn.gate) {
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            ctx.fillStyle = gateClosed ? '#5a1d1d' : '#3d5a2a';
            ctx.strokeStyle = gateClosed ? '#ff6b6b' : '#9be07a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.rect(mx - 11, my - 11, 22, 22);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '14px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(gateClosed ? '🔒' : '✓', mx, my + 1);
            ctx.textBaseline = 'alphabetic';
        }
    }

    _node(ctx, node, selected, hover, time) {
        const style = NODE_STYLE[node.type] ?? NODE_STYLE.stage;
        const p = this.toScreen(node.position);
        const r = style.radius;

        if (node.unlocked && !node.completed) {
            ctx.fillStyle = `rgba(255,220,140,${0.18 + Math.sin(time * 3) * 0.1})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r + 10, 0, TAU);
            ctx.fill();
        }

        ctx.fillStyle = node.unlocked ? style.color : '#3b3838';
        ctx.strokeStyle = selected ? '#ffffff' : hover ? '#f3e3c3' : '#1a1410';
        ctx.lineWidth = selected ? 4 : 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = node.unlocked ? '#1a1410' : '#777';
        ctx.font = `${Math.round(r * 1.05)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.unlocked ? style.icon : '🔒', p.x, p.y + 1);
        ctx.textBaseline = 'alphabetic';

        if (node.completed && node.stageId) {
            ctx.fillStyle = '#5fdc7a';
            ctx.beginPath();
            ctx.arc(p.x + r * 0.75, p.y - r * 0.75, 7, 0, TAU);
            ctx.fill();
            ctx.fillStyle = '#10200f';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('✓', p.x + r * 0.75, p.y - r * 0.75 + 4);
        }

        ctx.font = `${selected || hover ? 'bold ' : ''}13px Georgia, serif`;
        ctx.fillStyle = node.unlocked ? '#f3e3c3' : '#8a837a';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(node.name, p.x, p.y + r + 16);
        ctx.fillText(node.name, p.x, p.y + r + 16);
    }

    _playerMarker(ctx, p, time) {
        const y = p.y - 34 + Math.sin(time * 4) * 3;
        const doll = this.renderer.sprites?.get('doll');
        if (doll) {
            const scale = 2;
            ctx.drawImage(doll.frames[0].canvas, p.x - (doll.width * scale) / 2, y - (doll.height * scale) / 2, doll.width * scale, doll.height * scale);
            return;
        }
        ctx.fillStyle = '#f1dfc4';
        ctx.beginPath();
        ctx.arc(p.x, y, 7, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#8b5a3c';
        ctx.fillRect(p.x - 5, y + 5, 10, 9);
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(p.x - 3, y - 2, 2, 2);
        ctx.fillRect(p.x + 1, y - 2, 2, 2);
    }

    _compass(ctx, width) {
        ctx.save();
        ctx.translate(width - 50, 110);
        ctx.fillStyle = '#d8b25c';
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(8, 4);
        ctx.lineTo(-8, 4);
        ctx.fill();
        ctx.font = 'bold 14px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('N', 0, 22);
        ctx.restore();
    }
}
