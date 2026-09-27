/**
 * UIOverlayRenderer — screen-space canvas overlays drawn on top of a stage:
 * boss health bar, wave/phase banners, boss dialogue subtitles, cinematic
 * letterbox bars (final boss), objective pointer, low-HP vignette.
 * (DOM-based HUD elements live in ui/StageUI.js.)
 */
export class UIOverlayRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.banner = null;
        this.dialogue = null;
        this.letterbox = { target: 0, amount: 0 };
    }

    /** Big centred text that fades out, e.g. "Wave 2" or "The Bone Warden awakens". */
    showBanner(title, subtitle = '', duration = 2.2) {
        this.banner = { title, subtitle, duration, start: this.renderer.time };
    }

    /** Speaker + line shown at the bottom of the screen (boss taunts, final boss dialogue). */
    showDialogue(speaker, text, duration = 4) {
        this.dialogue = { speaker, text, duration, start: this.renderer.time };
    }

    /** Cinematic bars; `on` animates them in, off animates them out. */
    setLetterbox(on) { this.letterbox.target = on ? 1 : 0; }

    reset() {
        this.banner = null;
        this.dialogue = null;
        this.letterbox = { target: 0, amount: 0 };
    }

    render(stage) {
        const { ctx, width, height, time } = this.renderer;
        this._vignette(ctx, stage, width, height);
        this._letterbox(ctx, width, height);
        if (stage.activeBoss?.targetable) this._bossBar(ctx, stage.activeBoss, width);
        this._dialogue(ctx, width, height, time);
        this._objectivePointer(ctx, stage, width, height);
        if (stage.status === 'won') this._drawBanner(ctx, width, height, 'STAGE CLEARED', '', 1);
        else if (this.banner) {
            const t = (time - this.banner.start) / this.banner.duration;
            if (t >= 1) this.banner = null;
            else this._drawBanner(ctx, width, height, this.banner.title, this.banner.subtitle, t < 0.8 ? 1 : (1 - t) / 0.2);
        }
    }

    _drawBanner(ctx, width, height, title, subtitle, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, height * 0.3 - 50, width, subtitle ? 100 : 76);
        ctx.fillStyle = '#f3e3c3';
        ctx.font = 'bold 40px Georgia, serif';
        ctx.fillText(title, width / 2, height * 0.3);
        if (subtitle) {
            ctx.font = 'italic 18px Georgia, serif';
            ctx.fillStyle = '#d0b89a';
            ctx.fillText(subtitle, width / 2, height * 0.3 + 32);
        }
        ctx.restore();
    }

    _bossBar(ctx, boss, width) {
        const w = 560;
        const x = (width - w) / 2;
        const y = 92;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x - 4, y - 4, w + 8, 22);
        ctx.fillStyle = '#3a0a0a';
        ctx.fillRect(x, y, w, 14);
        ctx.fillStyle = boss.invulnerable ? '#bbbbbb' : '#c62a2a';
        ctx.fillRect(x, y, w * boss.hpRatio, 14);
        // phase threshold ticks
        ctx.fillStyle = '#f3e3c3';
        for (const phase of boss.phases.slice(1)) ctx.fillRect(x + w * phase.threshold - 1, y - 2, 2, 18);
        ctx.font = 'bold 16px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${boss.name} — ${boss.phase.name}`, width / 2, y - 10);
        if (boss.immunities?.length) {
            ctx.font = '12px Georgia, serif';
            ctx.fillStyle = '#b0b0b0';
            ctx.fillText(`Immune: ${boss.immunities.join(', ')}`, width / 2, y + 32);
        }
        ctx.restore();
    }

    _objectivePointer(ctx, stage, width, height) {
        const obj = stage.environment.objective;
        if (!obj) return;
        const s = this.renderer.worldToScreen(obj);
        if (s.x > 0 && s.x < width && s.y > 0 && s.y < height) return;
        const angle = Math.atan2(s.y - height / 2, s.x - width / 2);
        const px = width / 2 + Math.cos(angle) * (Math.min(width, height) / 2 - 40);
        const py = height / 2 + Math.sin(angle) * (Math.min(width, height) / 2 - 40);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.fillStyle = '#7fe3ff';
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(-8, -10);
        ctx.lineTo(-8, 10);
        ctx.fill();
        ctx.restore();
    }

    _letterbox(ctx, width, height) {
        const lb = this.letterbox;
        lb.amount += (lb.target - lb.amount) * 0.06;
        if (lb.amount < 0.01) return;
        const bar = 56 * lb.amount;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, bar);
        ctx.fillRect(0, height - bar, width, bar);
    }

    _dialogue(ctx, width, height, time) {
        const d = this.dialogue;
        if (!d) return;
        const t = (time - d.start) / d.duration;
        if (t >= 1) {
            this.dialogue = null;
            return;
        }
        const alpha = Math.min(1, t * 6, (1 - t) * 5);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        const y = height - 118;
        const w = Math.min(900, 60 + d.text.length * 10);
        ctx.fillStyle = 'rgba(8, 4, 6, 0.8)';
        ctx.fillRect((width - w) / 2, y - 34, w, 64);
        ctx.strokeStyle = 'rgba(255, 120, 60, 0.6)';
        ctx.strokeRect((width - w) / 2 + 0.5, y - 33.5, w - 1, 63);
        ctx.font = 'bold 14px Georgia, serif';
        ctx.fillStyle = '#ff9a5a';
        ctx.fillText(d.speaker.toUpperCase(), width / 2, y - 12);
        ctx.font = 'italic 19px Georgia, serif';
        ctx.fillStyle = '#f3e3c3';
        ctx.fillText(`“${d.text}”`, width / 2, y + 16);
        ctx.restore();
    }

    _vignette(ctx, stage, width, height) {
        const ratio = stage.player.hpRatio;
        if (ratio > 0.35) return;
        const g = ctx.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, height * 0.8);
        g.addColorStop(0, 'rgba(120,0,0,0)');
        g.addColorStop(1, `rgba(120,0,0,${(0.35 - ratio) * 1.6})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
    }
}
