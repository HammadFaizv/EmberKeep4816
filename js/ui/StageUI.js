import { UIComponent, el, button, formatTime } from './dom.js';
import { ELEMENTS } from '../config/elementConfig.js';

const STATUS_LABELS = { burn: 'Burning', poison: 'Poisoned', slow: 'Slowed', chill: 'Chilled', freeze: 'Frozen', stun: 'Stunned' };

/**
 * StageUI — in-stage HUD (HP, level/EXP, gold, souls, wave, spells, timed
 * buffs, player statuses, pause). update(stage) is called every frame and
 * only touches changed values.
 */
export class StageUI extends UIComponent {
    build() {
        this.refs = {};
        const r = this.refs;
        return el('div', { class: 'hud' }, [
            el('div', { class: 'hud-left' }, [
                el('div', { class: 'hud-bar hud-hp' }, [
                    r.hpFill = el('div', { class: 'hud-fill' }),
                    r.hpText = el('span', { class: 'hud-bar-text' }),
                ]),
                el('div', { class: 'hud-level' }, [
                    r.level = el('span', { class: 'hud-level-badge' }),
                    el('div', { class: 'hud-bar hud-exp' }, [r.expFill = el('div', { class: 'hud-fill' })]),
                ]),
                r.buffs = el('div', { class: 'hud-buffs' }),
            ]),
            el('div', { class: 'hud-center' }, [
                r.stageName = el('div', { class: 'hud-stage-name' }),
                r.wave = el('div', { class: 'hud-wave' }),
            ]),
            el('div', { class: 'hud-right' }, [
                r.souls = el('span', { class: 'hud-souls' }),
                r.gold = el('span', { class: 'hud-gold' }),
                button('❚❚', () => this.props.onPause(), 'btn btn-icon', { title: 'Pause (Esc)' }),
            ]),
            r.spells = el('div', { class: 'hud-spells' }),
        ]);
    }

    update(stage) {
        const r = this.refs;
        const p = stage.player;
        this._set(r.hpText, `${Math.ceil(p.hp)} / ${Math.round(p.maxHp)}`);
        r.hpFill.style.width = `${p.hpRatio * 100}%`;
        this._set(r.level, `Lv ${stage.levels.level}`);
        r.expFill.style.width = `${Math.min(1, stage.levels.progress) * 100}%`;
        this._set(r.gold, `● ${this.props.getGold()}`);
        const souls = this.props.getSouls?.() ?? 0;
        this._set(r.souls, souls ? `✦ ${souls}` : '');
        this._set(r.stageName, stage.name);

        const sp = stage.spawner;
        const timeLeft = sp.waveTimeLeft;
        const waveText = sp.allWavesComplete
            ? (stage.environment.objective ? 'Reach the objective!' : 'Final wave cleared')
            : `Wave ${sp.waveNumber} / ${sp.totalWaves}${timeLeft !== null ? ` · ${formatTime(timeLeft)}` : ' · Boss'}`;
        this._set(r.wave, waveText);
        this._updateSpells(p.spellBook);
        this._updateBuffs(p);
    }

    /** Timed card buffs (with remaining seconds) and harmful statuses on the doll. */
    _updateBuffs(player) {
        const buffs = player.stats.activeBuffs().map((b) => `${b.label} ${Math.ceil(b.remaining)}s`);
        const statuses = player.statuses.map((s) => `${STATUS_LABELS[s.type] ?? s.type}${s.stacks > 1 ? ` ×${s.stacks}` : ''}`);
        const key = buffs.join('|') + '#' + statuses.join('|');
        if (key === this._buffKey) return;
        this._buffKey = key;
        this.refs.buffs.replaceChildren(
            ...buffs.map((text) => el('span', { class: 'hud-buff' }, text)),
            ...statuses.map((text) => el('span', { class: 'hud-buff hud-debuff' }, text)),
        );
    }

    _updateSpells(book) {
        const key = book.spells.map((s) => s.id).join(',') + '|' + book.slots;
        if (key !== this._spellKey) {
            this._spellKey = key;
            this.spellEls = book.spells.map((s) => {
                const fill = el('div', { class: 'spell-cd' });
                const node = el('div', { class: 'spell-slot', title: s.name, style: { '--element': ELEMENTS[s.element]?.color } }, [
                    el('span', { class: 'spell-letter' }, s.name.split(' ').map((w) => w[0]).join('')),
                    fill,
                ]);
                return { node, fill, spell: s };
            });
            const empty = Array.from({ length: Math.max(0, book.slots - book.spells.length) }, () => el('div', { class: 'spell-slot spell-empty' }));
            this.refs.spells.replaceChildren(...this.spellEls.map((s) => s.node), ...empty);
        }
        for (const s of this.spellEls) {
            const cd = s.spell.cooldown;
            s.fill.style.height = `${(cd.ready ? 0 : 1 - cd.progress) * 100}%`;
        }
    }

    _set(node, text) {
        if (node.textContent !== text) node.textContent = text;
    }
}
