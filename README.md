# EmberKeep: The 4816th Soul

A browser-based 2D roguelike action game in vanilla JavaScript and HTML5 Canvas. You are a lost soul inside a witch's doll, fighting north through 15 corrupted stages toward the Demon Lord.

No build step, no libraries, no external assets: every sprite and ground texture is generated in code at load time.

## Running

The code uses ES modules, which browsers will not load from `file://`. Serve the folder over HTTP instead:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

**Controls:** WASD or the arrow keys move the doll (Open Field stages only). Spells cast automatically. Press 1, 2 or 3 to pick a card, and Esc or P to pause.

**Debug:** the `Game` instance is exposed as `window.game`. Some useful console calls:

```js
game.currency.add('gold', 1000);                 // grant gold
game.currency.add('souls', 100);                 // grant souls (Relic Merchant)
game.unlocks.unlockFeature('spellFusion');        // skip the upgrade tree
game.items.add('bridge_logs');                    // grant an item
game.unlocks.markStageCompleted('stage_03'); game.unlocks.refresh();
game.stageManager.current.levels.addExp(50);      // force level-ups mid-stage
game.bus.debug = true;                            // log every event
```

## What works today

- **Game flow:** Main menu → intro story → world map → asset loading → spell choice → stage → level-up cards → stage complete or DEFEATED → map. After the Demon Lord: **New Game+**.
- **World map:** a 15-stage graph with a fork (Goblin Woods / Rotten Marsh), two progression gates that *consume* their item when they open (the Broken Bridge uses the Bridge Logs, the Sealed Gate uses the Ancient Key), a Spell Shop, a Relic Merchant and an Animal Caretaker NPC.
- **Stages:** all 15 are playable, built from three stage types:
  - `OPEN_FIELD`: free movement with a camera that follows the doll.
  - `DEFENSE`: the doll is rooted in place; ground enemies march along winding lanes, and level-up cards build barricades (block a lane) and arrow towers (shoot with your damage bonuses).
  - `BOSS_ARENA`: a compact arena for a boss fight.
- **Completion conditions:** survive every wave, defeat the boss, defeat the miniboss, reach an objective, survive for a set time, kill count.
- **Arena hazards:** data-driven lava pools and a closing ring of fire (Lava Foothills, Soul Wastes, and the Demon Lord's second phase).
- **Combat:** spells auto-fire through seven behaviors: projectile, chain, nova, strike, zone (lingering clouds and meteors), orbit (blades circling the doll) and fusion. Five elements (fire, thunder, wind, ice, poison) are resolved by one element system with resistance, weakness and boss-only immunity. The status effects are burn, stacking poison, slow, chill (four stacks freeze the target), freeze and stun. Enemies drop gold, **EXP orbs** and souls.
- **Spells:** 17 player spells. Among them are the freeze spell **Glacial Nova**, Frost Shard, Ice Lance (double damage to frozen targets), Venom Dart, Toxic Cloud, Meteor and Whirling Blades. Four of the 17 are **fused spells** (Steam Bomb, Storm Blade, Shatterstorm, Plague Wind), created by merging two equipped spells.
- **Spell combos:** elemental reactions such as Melt (fire on a frozen enemy), Shatter, Wildfire, Toxic Blast, Contagion and Conduct.
- **Enemies:** Skeleton, Goblin, Bat, Snake (poisons on hit), Goblin Archer, Skeleton Knight (elite), Lava Imp.
- **Bosses:** six bosses and minibosses on the finite-state-machine architecture. They have phases with scripted events (dialogue, adds, shockwaves, arena lava), per-phase immunity changes, telegraphs, radial bursts, spirals, charges and meteor rain. Minibosses **flee** at low HP. The Demon Lord fight has cinematic letterbox dialogue.
- **Stage progression (temporary):** stage level and EXP reset every stage. Each level-up offers 3 data-driven cards, including **timed buffs** (Frenzy, War Cry, Sprint, Stone Skin), resistances, structures and fusions. Every run gets **2 rerolls** (button or R), shared between the stage-start spell choice and level-up cards (`progression.rerollsPerRun`).
- **Waves:** most stages have 5 waves; the last two escalate. `GAME_CONFIG.spawnDensity` multiplies enemy counts and spawn rates on every stage (1.5× by default).
- **Persistent progression:** gold and **souls**, a 30-node upgrade tree, the Spell Shop, the **Relic Merchant** (relics for souls and boss materials), pets with **active abilities**, progression items, **New Game+**, **key rebinding**, and a versioned localStorage save (v2) with migration.
- **Art:** procedural pixel-art sprites (auto-outlined, with hit-flash and frozen tints), animated frames, seamlessly tiling ground textures per biome, and a stage asset preloader with a progress bar.

## Project structure

```
index.html            canvas + UI root
css/                  main, menu, map, stage, cards, shop, upgrades
js/
  main.js             entry point: scales the 1280×720 container and starts Game
  assets/             PixelArt (grid -> canvas), spriteData (all sprites as text),
                      SpriteLibrary, TextureFactory (ground tiles), AssetLoader,
                      StageAssets (per-stage manifest)
  core/               Game (composition root), GameLoop, StateMachine, GameState,
                      EventBus, InputManager, SaveManager
  config/             ALL tuning data: game, stage, map, spell, enemy, boss, pet,
                      card, upgrade, element, item, npc, story, combo, fusion,
                      relic, structure
  states/             one class per global game state (Menu, Map, Playing, LevelUp...)
  player/             Player, PlayerStats, SpellBook, PlayerProgression (persistent profile)
  stages/             Stage base, OpenField/Defense/BossArena, StageRegistry,
                      StageFactory, StageManager, StageRules (rules, scaling, completion),
                      ArenaHazards
  map/                WorldMap, MapNode, MapConnection, ProgressionGate, MapRequirement
  entities/           Entity/Combatant, Enemy, Boss, MiniBoss, Projectile (pooled),
                      Effect, Hazard, Structure, Pickup, EnemyFactory
  enemies/            EnemyRegistry, EnemyAI registry, EnemySpawner, behaviors/
  bosses/             BossController, BossStateMachine, BossState, BossAttacks,
                      PhaseEvents, states/
  combat/             CombatSystem, DamageSystem, ElementSystem, StatusEffectSystem,
                      TargetingSystem (spatial hash), ComboSystem
  spells/             Spell, SpellFactory, SpellEffects (behaviors), SpellTargeting,
                      SpellManager
  progression/        Currency/Gold/Soul, Items, Costs, Rewards, EffectRegistry, Unlocks,
                      Upgrades, Relics, Cards, Level/Experience, NewGamePlus,
                      ProgressionRequirement
  pets/               Pet, PetFactory, PetManager
  shops/              SpellShop, RelicShop, ShopItem, ShopManager
  rendering/          Renderer + Map/Stage/Entity/Spell/Effects/UIOverlay renderers
  ui/                 UIManager + DOM screens (menu, story, map, HUD, cards, shop,
                      upgrade tree, pets, settings, results)
  utils/              Vector2, Timer/Cooldown, Random (seedable), MathUtils, ObjectPool,
                      SpatialHash
```

## Architecture

### How game states communicate

`Game` is the composition root. It creates every long-lived service once and injects dependencies through constructors. It holds no gameplay rules.

A stack-based `StateMachine` drives the global flow. Each state is a class in `js/states/` with `enter`, `exit`, `update` and `render` methods:

```
MENU → INTRO → MAP → STAGE_LOADING → SPELL_SELECT → PLAYING ⇄ (LEVEL_UP | PAUSED)
                ↑                                      ↓
                └──── STAGE_COMPLETE / STAGE_DEFEAT ←──┘      FINAL_BOSS → VICTORY
MAP ⇄ SHOP | UPGRADES | PETS          MENU ⇄ SETTINGS
```

- **Overlays are pushed.** LEVEL_UP and PAUSED are pushed on top of PLAYING. The state underneath stops updating but keeps rendering.
- **Systems talk through the `EventBus`.** Examples are `ENEMY_KILLED`, `LEVEL_UP`, `GOLD_COLLECTED`, `BOSS_DEFEATED`, `STAGE_COMPLETED` and `PATH_UNLOCKED`. `PlayingState` subscribes to stage events and defers transitions until the current tick finishes. `UIManager` turns progression events into toasts.
- **States clean up after themselves.** `BaseState` tracks mounted UI and subscriptions and releases both on `exit()`.

### How stages are created

1. The player picks a map node. `MapState` changes to `STAGE_LOADING` with a `stageId`.
2. `StageManager.load(id)` calls `StageFactory.create(def)`.
3. The factory looks up `StageRegistry.get(def.type)` and builds that class. There is no `if (type === …)` anywhere.
4. `Stage.init()` builds the player's stats. It starts from the persistent profile, adds permanent upgrades and pets, then creates a fresh `SpellBook`, `LevelSystem` (level 0) and the stage-scoped combat systems and spawner.
5. Stage types override small hooks (`defaultRules`, `createWorld`, `getSpawnPosition`, `getBossSpawnPosition`, `onUpdate`) instead of copying the update loop.
6. `CompletionConditions` checks the stage's `completion` list.
7. `StageManager.completeCurrent()` or `failCurrent()` is the only bridge from temporary stage state to persistent progress.

### How entities and systems interact

**The stage is the context object.** A Stage acts as `ctx` for everything it contains: `ctx.player`, `ctx.enemies`, `ctx.combat`, `ctx.targeting`, `ctx.spawnEnemy()`, `ctx.spawnProjectile()`, `ctx.rules` and `ctx.bus`.

**Entities hold data and simple self-updates.**
- Enemies pick movement by delegating to an AI behavior from the `EnemyAI` registry (`chase`, `swoop`, `slither`, `ranged`).
- Bosses delegate to their FSM.
- Projectiles move. Effects are purely cosmetic.

**Rules between entities live in `combat/`:**
- `CombatSystem` handles collisions, hits, deaths and loot rolls, and announces results on the bus.
- `DamageSystem`: physical damage is reduced by defense as `base × 100 / (100 + defense)`. Elemental damage goes to `ElementSystem`.
- `ElementSystem` is the only place that does elemental math:
  - Resistance: `dmg × (1 − resist)`. Normal enemies are capped at 80%, so they are never immune.
  - Immunity: exactly 0 damage, and only for targets with `canBeImmune`, which means bosses.
- `StatusEffectSystem` handles burn, slow and stun through a registry.

**Rendering only reads state.** Entities carry a `render` descriptor. When `render.sprite` names a sprite in the `SpriteLibrary`, `EntityRenderer` draws the pixel art. That drawing adds a shadow, a walk bob, flips toward the direction of movement, and applies the hit-flash and frozen tints. Otherwise the procedural painter for `render.shape` is used. `SpellRenderer`, `EffectsRenderer` and the hazard painters in `StageRenderer` are registries in the same style.

**Hazards and structures.** A `Hazard` is a lingering damage area: spell zones, lava pools, meteor impacts and orbiting blades. A `Structure` is a Defense-stage barricade or tower. Both are entities, and their damage is resolved in `CombatSystem` like every other hit. `TargetingSystem` rebuilds a spatial hash once per tick, and spells, projectiles, hazards and crowd separation query only nearby cells.

### How spells work

The three spell concepts are deliberately kept apart:

| Concept | Lives in | Lifetime |
|---|---|---|
| **Unlocked** | `profile.data.unlockedSpells` | permanent (Spell Shop) |
| **Available** | `SpellManager.getAvailableStageSpells(rules)` | this stage (unlocked, filtered by stage rules) |
| **Equipped** | the stage `SpellBook`, capped by the `spellSlots` stat | this stage |

When a stage starts, `SPELL_SELECT` offers 3 available spells and the chosen one is equipped. After that, each `Spell`:

1. Waits for its cooldown to become ready.
2. Asks `SpellTargeting` for targets (`nearest`, `strongest`, `weakest`, `random`, `self`).
3. Runs the behavior registered for `def.behavior` in `SpellEffects` (`projectile`, `chain`, `nova`, `strike`, `zone`, `orbit`, `fusion`).

**Spell fusion.** `fusionConfig.js` lists recipes (two parts and a result). When both parts are equipped and the `spellFusion` feature is unlocked, level-ups can offer a "Fuse" card. Picking it replaces both parts with the fused spell and frees a slot. A fused spell uses the `fusion` behavior: a carrier behavior whose every hit triggers a payload, for example a projectile that bursts into a nova.

**Combos.** When the `spellCombos` feature is unlocked, `ComboSystem` checks each hit's element against the target's statuses using `comboConfig.js`, for example fire on a frozen enemy triggers Melt for double damage.

Behaviors never compute damage themselves. They pass `spell.buildDamagePacket()` to `CombatSystem`. A spell's stats are layered in this order:

1. The config value.
2. Permanent shop upgrade tiers.
3. Temporary card modifiers.
4. The owner's `damageMult`, `cooldownReduction`, `attackSpeedMult` and `elementDamage.<element>` stats.

### How the upgrade tree works

`upgradeConfig.js` defines the nodes: position, parent `requires`, optional `requirements`, `costs` and `effects`.

`UpgradeSystem` tracks each node as locked, available or purchased:
- **Purchasing** pays through `CostSystem`, stores the node id, applies one-time `unlockFeature` effects, re-evaluates unlocks and saves.
- **Stat effects** are re-applied to a fresh `PlayerStats` at the start of every stage (`applyTo`), so effects never double-stack.

Effects use the shared `EffectRegistry` vocabulary (`stat`, `timedStat`, `heal`, `addSpell`, `spellMod`, `fuseSpells`, `buildStructure`, `unlockFeature`). Cards, relics and pets speak the same language. The tree unlocks the `spellCombos` and `spellFusion` features. Timed buffs are `timedStat` modifiers that `PlayerStats` counts down and removes on its own.

Costs are always lists, like `[{ type: 'currency', id: 'gold', amount: 150 }, { type: 'item', id: 'bone_crystal', amount: 1 }]`. Gale Ward already uses that exact cost.

### How boss FSMs work

**Data and behavior are split:**
- `Boss` holds data: HP, phases, attacks and the current phase.
- `BossController` builds a `BossStateMachine` from the states listed in `fsm.states` and owns the attack cooldowns and attack selection.

**Each state is a `BossState` subclass** with `enter` / `update(dt, ctx)` / `exit`:

| State | Behavior |
|---|---|
| `IDLE` | Waits, then aggroes when the player is in range. |
| `CHASE` | Moves toward the player and picks a ready special or an in-reach melee attack. |
| `ATTACK` | Windup telegraph, then strike. |
| `SPECIAL_ATTACK` | Windup, then any non-melee attack type. |
| `PHASE_TRANSITION` | The boss is invulnerable, then the next phase applies. |
| `STUNNED` | Stands still, then gains brief stun immunity. |
| `FLEE` | Minibosses only. The boss runs away, regenerates and calls for help, then turns back. |
| `DEAD` | Plays the death animation, then removes the boss. |

**Transitions come from three places:**
1. The state itself: distance, cooldowns, timers.
2. Global rules in the machine: death, HP crossing a phase threshold, and a miniboss deciding to flee.
3. External events: `handleEvent('stun')` from status effects.

Attack *types* live in the `BossAttacks` registry and can be reused by any boss: `melee`, `radialBurst`, `summon`, `meteorRain`, and the channelled `charge` and `spiral`, which keep running for `attack.channel` seconds. When several special attacks are ready, the one used least recently goes first. A phase can override `immunities` and `resistances`, which is how the Demon Lord loses his fire immunity in Cataclysm. A phase can also list `onEnter` events (`dialogue`, `summon`, `arenaHazard`, `heal`, `shockwave`) that the `PhaseEvents` registry runs.

### How persistent progression is saved

`SaveManager` is the only module that touches `localStorage`, through a swappable storage adapter. The save is versioned (`SAVE_VERSION`). `migrate()` runs step functions from `MIGRATIONS` and then deep-fills any fields missing from the default shape.

`PlayerProgression` wraps the save data and exposes queries (`isStageCompleted`, `itemCount`, …). Mutations go through dedicated systems:

| System | Owns |
|---|---|
| `CurrencySystem` | currency balances (gold) |
| `ProgressionItemSystem` | counted items (keys, boss materials, rare drops) |
| `UnlockSystem` | stages, features, spells, pets, NPC visits |
| `UpgradeSystem` | purchased tree nodes |
| `PetManager` | owned and equipped pets |
| `SpellShop` | spell unlocks and upgrade levels |

**What is saved:** unlocked and completed stages, defeated bosses, gold and souls, unlocked spells, spell upgrades, tree nodes, relics, pets, pet slots, items, opened gates, story flags (including the New Game+ cycle) and settings (including key bindings).

**What is never saved:** stage level, EXP, cards, the current spell loadout, enemies. All of that lives on the Stage object and disappears with it.

**Gold and souls survive death** because they are credited the moment they are picked up. Replaying a cleared stage grants 25% of its gold reward and no items.

**New Game+** keeps gold, souls, spells, upgrades, pets, relics and boss materials. It resets map progress and progression keys. Each cycle moves every stage up two difficulty tiers (tiers past the table are extrapolated) and pays 50% more currency.

## Extending the game

| To add… | Do this |
|---|---|
| **A stage** | Add an entry to `STAGES` in `config/stageConfig.js`, then add a node and a connection in `config/mapConfig.js`. |
| **A stage type** | Write `class EscortStage extends Stage { static type = 'ESCORT'; … }` and call `StageRegistry.register(EscortStage)`. Optionally register a backdrop with `renderer.stage.registerBackdrop('ESCORT', fn)`. New win conditions go in `CompletionConditions.register(...)`. |
| **An enemy** | Add an entry to `ENEMIES` in `config/enemyConfig.js`. Only a brand-new movement pattern needs a behavior class in `enemies/behaviors/` plus `EnemyAI.register(...)`. |
| **A spell** | Add an entry to `SPELLS`. Only a new mechanic needs a behavior in `SpellEffects.js` (or `spellFactory.registerBehavior`). It shows up in the shop automatically. |
| **A boss** | Add an entry to `BOSSES` with `phases`, `attacks` and `fsm.states`, then reference it from a wave (`{ boss: 'id' }` or `{ miniboss: 'id' }`). New attack types go in `BossAttacks.register(...)`. New behavior states subclass `BossState` and are registered with `BossController.registerState(...)`. A boss with 4 phases is just 4 entries in `phases`. |
| **An upgrade** | Add a node to `UPGRADES` in `config/upgradeConfig.js`. A new effect kind goes in `EffectRegistry.register(...)`. |
| **An element (e.g. poison)** | Add it to `config/elementConfig.js`, give spells `element: 'poison'`, and add `poison` keys to enemy resistances. Bonuses use the `elementDamage.poison` stat. A DoT would call `StatusEffectSystem.register('poison', …)`. Combat code does not change. |
| **A pet** | Add an entry to `PETS` in `config/petConfig.js`. An `ability` (a hidden spell id) makes the pet attack. |
| **A boss crafting material** | Add an item to `ITEMS`, put it in the boss's `rewards`, and use it in any cost list: `{ type: 'item', id, amount }`. Relics already use them this way. |
| **A relic** | Add an entry to `RELICS` in `config/relicConfig.js` with costs and effects. |
| **A spell fusion** | Add a recipe to `FUSIONS` and a fused spell (`fused: true`, `behavior: 'fusion'`) to `SPELLS`. |
| **A combo** | Add an entry to `COMBOS` in `config/comboConfig.js`. A new kind of reaction goes in `ComboSystem.registerEffect(...)`. |
| **An arena hazard** | Add `{ type, ... }` to a stage's `environment.hazards`. A new hazard type goes in `ArenaHazards.register(...)`. |
| **A timed card buff** | Add a card with a `{ type: 'timedStat', stat, value, duration, label }` effect. |
| **A sprite** | Add a text grid to `assets/spriteData.js` and set `render.sprite` on the entity config. To use painted art instead, list `{ key, url, frames }` in a stage's `assets`. The loader swaps it in for the procedural sprite. |
| **A progression gate** | Add it to `MAP_GATES` with `requirements` and set `gate: 'id'` on a connection. New requirement kinds go in `ProgressionRequirement.register(...)`. |
| **A currency (e.g. Souls)** | Add it to `CURRENCIES` and add a save migration that initialises the balance. |
| **A shop** | Write a class that follows `SpellShop`'s interface, register it with `ShopManager` in `Game.js`, add a map node with `shopId`, and add a UI screen. |

Intentionally unimplemented areas have `TODO` comments that say where the logic belongs. Audio is the main one (an `AudioManager` for the volume settings and a final-boss music track). The other is a second map region for New Game+.
# EmberKeep4816
