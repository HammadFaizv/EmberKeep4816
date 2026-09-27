import { Events } from '../core/EventBus.js';

/**
 * EnemySpawner — runs a stage's wave timeline.
 *
 * Wave data: { duration, spawns: [{ enemy, count, interval, delay, directions }], boss, miniboss }
 *  - counts scale with difficulty `countMult`, intervals with `spawnRateMult`
 *  - timed waves end after `duration`
 *  - boss/miniboss waves end when that boss is defeated
 *
 * The spawner asks the Stage *where* to spawn (stage.getSpawnPosition), so
 * OPEN_FIELD and DEFENSE place enemies differently without the spawner knowing.
 */
const MAX_ALIVE_ENEMIES = 260;

export class EnemySpawner {
    constructor({ stage, waves, scaling, bus }) {
        this.stage = stage;
        this.waves = waves;
        this.scaling = scaling;
        this.bus = bus;
        this.waveIndex = -1;
        this.waveElapsed = 0;
        this.queues = [];
        this.boss = null;
        this.finished = false;
    }

    get currentWave() { return this.waves[this.waveIndex]; }
    get waveNumber() { return Math.max(1, Math.min(this.waveIndex + 1, this.waves.length)); }
    get totalWaves() { return this.waves.length; }
    get allWavesComplete() { return this.finished; }

    /** Seconds left in the current timed wave (null for boss waves). */
    get waveTimeLeft() {
        const wave = this.currentWave;
        if (!wave || wave.boss || wave.miniboss) return null;
        return Math.max(0, wave.duration - this.waveElapsed);
    }

    update(dt) {
        if (this.finished) return;
        // Waves start on the first update so listeners (HUD, banners) exist by then.
        if (this.waveIndex < 0) this._startWave(0);
        this.waveElapsed += dt;

        const aliveCount = this.stage.enemies.length;
        for (const q of this.queues) {
            q.timer -= dt;
            while (q.timer <= 0 && q.remaining > 0 && aliveCount < MAX_ALIVE_ENEMIES) {
                this.stage.spawnEnemy(q.enemy, { directions: q.directions });
                q.remaining -= 1;
                q.timer += q.interval;
            }
        }

        if (this._isWaveComplete()) {
            this.bus.emit(Events.WAVE_COMPLETED, { wave: this.waveNumber });
            this._startWave(this.waveIndex + 1);
        }
    }

    _isWaveComplete() {
        const wave = this.currentWave;
        if (wave.boss || wave.miniboss) return this.boss !== null && !this.boss.targetable;
        return this.waveElapsed >= wave.duration;
    }

    _startWave(index) {
        if (index >= this.waves.length) {
            this.finished = true;
            this.queues = [];
            return;
        }
        this.waveIndex = index;
        this.waveElapsed = 0;
        const wave = this.currentWave;
        const { countMult, spawnRateMult } = this.scaling;
        this.queues = (wave.spawns ?? []).map((s) => ({
            enemy: s.enemy,
            directions: s.directions,
            remaining: Math.round(s.count * countMult),
            interval: s.interval / spawnRateMult,
            timer: s.delay ?? 0,
        }));

        const bossId = wave.boss ?? wave.miniboss;
        this.boss = bossId ? this.stage.spawnBoss(bossId) : null;
        this.bus.emit(Events.WAVE_STARTED, {
            wave: this.waveNumber,
            total: this.waves.length,
            boss: this.boss?.name ?? null,
        });
    }
}
