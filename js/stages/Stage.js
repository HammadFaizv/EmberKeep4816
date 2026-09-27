import { Events, Subscriptions } from '../core/EventBus.js';
import { Player } from '../player/Player.js';
import { SpellBook } from '../player/SpellBook.js';
import { LevelSystem } from '../progression/LevelSystem.js';
import { ExperienceSystem } from '../progression/ExperienceSystem.js';
import { ElementSystem } from '../combat/ElementSystem.js';
import { DamageSystem } from '../combat/DamageSystem.js';
import { StatusEffectSystem } from '../combat/StatusEffectSystem.js';
import { TargetingSystem } from '../combat/TargetingSystem.js';
import { CombatSystem } from '../combat/CombatSystem.js';
import { ComboSystem } from '../combat/ComboSystem.js';
import { EnemySpawner } from '../enemies/EnemySpawner.js';
import { EnemyFactory } from '../entities/EnemyFactory.js';
import { Projectile } from '../entities/Projectile.js';
import { ArenaHazards } from './ArenaHazards.js';
import { resolveRules, resolveScaling, CompletionConditions } from './StageRules.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * Stage — base class for every stage type.
 *
 * Owns all TEMPORARY state of one attempt: the player instance, stage level/EXP,
 * entities, and stage-scoped systems. Nothing here is persisted; StageManager
 * translates the outcome into persistent progress.
 *
 * The Stage also acts as the *context object* (`ctx`) passed to entities,
 * spells and AI: ctx.player, ctx.enemies, ctx.combat, ctx.targeting,
 * ctx.spawnProjectile(), ctx.spawnEnemy(), ctx.spawnHazard(), ctx.rules,
 * ctx.world, ctx.bus...
 *
 * Subclasses customise via hooks, not by copying update():
 *   static type / static defaultRules
 *   createWorld()           arena size
 *   getPlayerStart()        where the doll starts
 *   getSpawnPosition(opts)  where regular enemies appear
 *   getBossSpawnPosition()  where bosses appear
 *   onEnemySpawned(enemy, spawnInfo)  e.g. assign a lane
 *   onInit() / onUpdate(dt) extra per-type logic
 */
export class Stage {
    static type = 'BASE';
    static defaultRules = {};

    constructor(def, services) {
        this.def = def;
        this.id = def.id;
        this.name = def.name;
        this.description = def.description;
        this.type = def.type;
        this.difficulty = def.difficulty;
        this.isFinal = Boolean(def.isFinal);
        this.services = services;
        this.bus = services.bus;
        this.rng = services.rng;
        this.input = services.input;

        this.ngPlus = services.profile.data.story.ngPlus ?? 0;
        this.rules = resolveRules(this.constructor.defaultRules, def.rules);
        this.scaling = resolveScaling(def, this.ngPlus);
        this.environment = { ...def.environment };
        this.world = this.createWorld();
        this.showDamageNumbers = services.profile.data.settings.showDamageNumbers;

        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        this.pickups = [];
        this.pets = [];
        this.hazards = [];
        this.structures = [];
        this.arenaRing = null;

        this.elapsed = 0;
        this.status = 'running';     // 'running' | 'won' | 'complete' | 'failed'
        this.completeTimer = 0;
        this.defeated = [];          // { id, kind, rewards } of bosses killed this attempt
        this.loot = [];              // persistent rewards collected this attempt (rare drops)
        this.pendingLevelUps = 0;
        this.rerolls = GAME_CONFIG.progression.rerollsPerRun; // shared by spell choice and level-up cards
        this.activeBoss = null;
        this.stats = { kills: 0, goldCollected: 0, soulsCollected: 0, combos: 0 };
        this.subs = new Subscriptions(this.bus);
        this.enemyFactory = new EnemyFactory();
    }

    // ---- Lifecycle ---------------------------------------------------------
    init() {
        const { profile, upgrades, pets, relics, spellFactory } = this.services;

        const stats = profile.buildPermanentStats({ upgrades, pets, relics, includePets: this.rules.allowPets });
        const start = this.getPlayerStart();
        this.player = new Player({ x: start.x, y: start.y, stats });
        this.player.spellBook = new SpellBook({ owner: this.player, spellFactory, profile });
        if (this.rules.allowPets) this.pets = pets.createStagePets(this.player, spellFactory);

        this.levels = new LevelSystem({ bus: this.bus, startingLevel: this.def.startingLevel ?? 0 });
        this.experience = new ExperienceSystem({ bus: this.bus, subscriptions: this.subs, levels: this.levels, player: this.player, stage: this });

        this.elements = new ElementSystem();
        this.damage = new DamageSystem({ elements: this.elements });
        this.statuses = new StatusEffectSystem({ rng: this.rng });
        this.targeting = new TargetingSystem(this);
        this.combos = new ComboSystem({ enabled: profile.isFeatureUnlocked('spellCombos'), statuses: this.statuses, stage: this, bus: this.bus });
        this.combat = new CombatSystem({ stage: this, bus: this.bus, rng: this.rng, damage: this.damage, statuses: this.statuses, combos: this.combos });
        this.spawner = new EnemySpawner({ stage: this, waves: this.def.waves, scaling: this.scaling, bus: this.bus });
        this.arenaHazards = new ArenaHazards(this, this.environment.hazards);

        this.subs
            .on(Events.ENEMY_KILLED, () => { this.stats.kills += 1; })
            .on(Events.GOLD_COLLECTED, ({ amount }) => { this.stats.goldCollected += amount; })
            .on(Events.SOULS_COLLECTED, ({ amount }) => { this.stats.soulsCollected += amount; })
            .on(Events.COMBO_TRIGGERED, () => { this.stats.combos += 1; })
            .on(Events.LEVEL_UP, () => { this.pendingLevelUps += 1; })
            .on(Events.BOSS_DEFEATED, ({ boss }) => this._recordBoss(boss))
            .on(Events.MINIBOSS_DEFEATED, ({ boss }) => this._recordBoss(boss))
            .on(Events.PLAYER_DIED, () => this.fail());

        this.onInit();
        this.targeting.rebuild();
        this.bus.emit(Events.STAGE_STARTED, { stage: this });
        return this;
    }

    destroy() {
        this.subs.clear();
        for (const p of this.projectiles) Projectile.release(p);
        this.projectiles = [];
    }

    // ---- Hooks for subclasses ---------------------------------------------
    createWorld() {
        return { width: GAME_CONFIG.canvas.width, height: GAME_CONFIG.canvas.height };
    }

    getPlayerStart() {
        return this.environment.playerStart ?? { x: this.world.width / 2, y: this.world.height / 2 };
    }

    getSpawnPosition(/* { directions } */) {
        throw new Error(`${this.constructor.name} must implement getSpawnPosition()`);
    }

    getBossSpawnPosition() {
        const p = this.player.pos;
        return { x: p.x, y: Math.max(80, p.y - 320) };
    }

    onEnemySpawned(enemy, spawnInfo) {}
    onInit() {}
    onUpdate(dt) {}

    // ---- Update ------------------------------------------------------------
    update(dt) {
        if (this.status === 'complete' || this.status === 'failed') return;
        this.elapsed += dt;

        this.player.update(dt, this);
        if (this.status === 'running') this.spawner.update(dt);
        for (const e of this.enemies) e.update(dt, this);
        this.targeting.rebuild();
        this._separateEnemies();
        this.statuses.update(dt, this.player.alive ? [...this.enemies, this.player] : this.enemies);
        for (const p of this.projectiles) p.update(dt, this);
        for (const s of this.structures) s.update(dt, this);
        for (const h of this.hazards) h.update(dt, this);
        this.combat.update(dt);
        for (const p of this.pickups) p.update(dt, this);
        for (const p of this.pets) p.update(dt, this);
        for (const e of this.effects) e.update(dt, this);
        this.arenaHazards.update(dt);

        this._cleanup();
        this.onUpdate(dt);
        this._checkCompletion(dt);
    }

    // ---- Spawning (called by spawner, AI, spells, bosses) ------------------
    spawnEnemy(id, { x, y, directions } = {}) {
        const spawnInfo = x !== undefined ? { x, y } : this.getSpawnPosition({ directions });
        const enemy = this.enemyFactory.create(id, { x: spawnInfo.x, y: spawnInfo.y, scaling: this.scaling });
        this.enemies.push(enemy);
        this.targeting?.track(enemy);
        this.onEnemySpawned(enemy, spawnInfo);
        this.bus.emit(Events.ENEMY_SPAWNED, { enemy });
        return enemy;
    }

    spawnBoss(id) {
        const boss = this.spawnEnemy(id, this.getBossSpawnPosition());
        this.activeBoss = boss;
        this.bus.emit(Events.BOSS_SPAWNED, { boss });
        return boss;
    }

    spawnProjectile(p) { this.projectiles.push(p); }
    spawnEffect(e) { this.effects.push(e); }
    spawnPickup(p) { this.pickups.push(p); }
    spawnHazard(h) { this.hazards.push(h); }
    addStructure(s) { this.structures.push(s); }
    addLoot(reward) { this.loot.push(reward); }

    // ---- Outcome -----------------------------------------------------------
    fail() {
        if (this.status !== 'running') return;
        this.status = 'failed';
        this.bus.emit(Events.STAGE_FAILED, { stage: this });
    }

    _checkCompletion(dt) {
        if (this.status === 'running' && CompletionConditions.check(this.def.completion ?? [], this)) {
            this.status = 'won';
            this.player.invulnerableTime = Infinity; // no dying during the victory beat
        }
        if (this.status === 'won') {
            this.completeTimer += dt;
            if (this.completeTimer >= this.rules.completionDelay) {
                this.status = 'complete';
                this.bus.emit(Events.STAGE_COMPLETED, { stage: this });
            }
        }
    }

    _recordBoss(boss) {
        this.defeated.push({ id: boss.typeId, kind: boss.kind, rewards: boss.rewards });
        if (this.activeBoss === boss) this.activeBoss = null;
    }

    _cleanup() {
        this.enemies = this.enemies.filter((e) => e.alive);
        const kept = [];
        for (const p of this.projectiles) {
            if (p.alive && this._inBounds(p.pos, 200)) kept.push(p);
            else Projectile.release(p);
        }
        this.projectiles = kept;
        this.effects = this.effects.filter((e) => e.alive);
        this.pickups = this.pickups.filter((p) => p.alive);
        this.hazards = this.hazards.filter((h) => h.alive);
        this.structures = this.structures.filter((s) => s.alive);
    }

    _inBounds(pos, margin) {
        return pos.x > -margin && pos.y > -margin && pos.x < this.world.width + margin && pos.y < this.world.height + margin;
    }

    /** Pushes overlapping enemies apart so crowds don't collapse into a point (spatial-hash neighbours only). */
    _separateEnemies() {
        for (const a of this.enemies) {
            for (const b of this.targeting.query(a.pos, a.radius + 50)) {
                if (b.id <= a.id) continue; // each pair once
                const dx = b.pos.x - a.pos.x;
                const dy = b.pos.y - a.pos.y;
                const min = a.radius + b.radius;
                const d2 = dx * dx + dy * dy;
                if (d2 >= min * min || d2 === 0) continue;
                const d = Math.sqrt(d2);
                const push = (min - d) / 2;
                const nx = dx / d;
                const ny = dy / d;
                // Bosses are heavy: they push others but are not pushed.
                const wa = a.isBoss ? 0 : b.isBoss ? 2 : 1;
                const wb = b.isBoss ? 0 : a.isBoss ? 2 : 1;
                a.pos.x -= nx * push * wa;
                a.pos.y -= ny * push * wa;
                b.pos.x += nx * push * wb;
                b.pos.y += ny * push * wb;
            }
        }
    }
}
