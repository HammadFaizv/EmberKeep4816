# EmberKeep: The 4816th Soul

A browser-based 2D roguelike action game in vanilla JavaScript and HTML5 Canvas. You are a lost soul inside a witch's doll, fighting north through 15 corrupted stages toward the Demon Lord.

No build step, no libraries, no external assets.

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
game.items.add('bridge_logs');                    // grant an item
game.unlocks.markStageCompleted('stage_03'); game.unlocks.refresh();
game.stageManager.current.levels.addExp(50);      // force level-ups mid-stage
game.bus.debug = true;                            // log every event
```

## What works today

- **Game flow:** Main menu → intro story → world map → spell choice → stage → level-up cards → stage complete or DEFEATED → map.
- **World map:** a 15-stage graph with a fork (Goblin Woods / Rotten Marsh), two progression gates (the Broken Bridge needs Bridge Logs, the Sealed Gate needs the Ancient Key), a Spell Shop node and an Animal Caretaker NPC.
- **Stages:** all 15 are playable, built from three stage types:
  - `OPEN_FIELD`: free movement with a camera that follows the doll.
  - `DEFENSE`: the doll is rooted in place and enemies arrive from set directions.
  - `BOSS_ARENA`: a compact arena for a boss fight.
- **Completion conditions:** survive every wave, defeat the boss, defeat the miniboss, reach an objective, survive for a set time, kill count.
- **Combat:** spells auto-fire (projectile, piercing, chain, nova, strike). Fire, thunder and wind are resolved by a central element system with resistance, weakness and boss-only immunity. Burn, slow and stun are status effects, and enemies drop gold pickups.
- **Enemies:** Skeleton, Goblin, Bat, Snake, Goblin Archer, Skeleton Knight (elite), Lava Imp.
- **Bosses:** six bosses and minibosses on the finite-state-machine architecture, with phases, telegraphs, radial bursts and summons.
- **Stage progression (temporary):** stage level and EXP reset every stage. Each level-up offers 3 data-driven cards.
- **Persistent progression:** gold, a 25-node upgrade tree, the Spell Shop (unlocked after 3 stage clears), pets with slot upgrades, progression items, and a versioned localStorage save with migration.

## Project structure

```
index.html            canvas + UI root
css/                  main, menu, map, stage, cards, shop, upgrades
js/
  main.js             entry point: scales the 1280×720 container and starts Game
  core/               Game (composition root), GameLoop, StateMachine, GameState,
                      EventBus, InputManager, SaveManager
  config/             ALL tuning data: game, stage, map, spell, enemy, boss, pet,
                      card, upgrade, element, item, npc, story
  states/             one class per global game state (Menu, Map, Playing, LevelUp...)
  player/             Player, PlayerStats, SpellBook, PlayerProgression (persistent profile)
  stages/             Stage base, OpenField/Defense/BossArena, StageRegistry,
                      StageFactory, StageManager, StageRules (rules, scaling, completion)
  map/                WorldMap, MapNode, MapConnection, ProgressionGate, MapRequirement
  entities/           Entity/Combatant, Enemy, Boss, MiniBoss, Projectile, Effect,
                      Pickup, EnemyFactory
  enemies/            EnemyRegistry, EnemyAI registry, EnemySpawner, behaviors/
  bosses/             BossController, BossStateMachine, BossState, BossAttacks, states/
  combat/             CombatSystem, DamageSystem, ElementSystem, StatusEffectSystem,
                      TargetingSystem
  spells/             Spell, SpellFactory, SpellEffects (behaviors), SpellTargeting,
                      SpellManager
  progression/        Currency/Gold, Items, Costs, Rewards, EffectRegistry, Unlocks,
                      Upgrades, Cards, Level/Experience, ProgressionRequirement
  pets/               Pet, PetFactory, PetManager
  shops/              SpellShop, ShopItem, ShopManager
  rendering/          Renderer + Map/Stage/Entity/Spell/Effects/UIOverlay renderers
  ui/                 UIManager + DOM screens (menu, story, map, HUD, cards, shop,
                      upgrade tree, pets, settings, results)
  utils/              Vector2, Timer/Cooldown, Random (seedable), MathUtils, ObjectPool
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

**Rendering only reads state.** `EntityRenderer`, `SpellRenderer` and `EffectsRenderer` keep painter registries keyed by `render.shape` or `effect.kind`, so you can swap the placeholder shapes for sprites without touching gameplay code.

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
3. Runs the behavior registered for `def.behavior` in `SpellEffects` (`projectile`, `chain`, `nova`, `strike`).

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

Effects use the shared `EffectRegistry` vocabulary (`stat`, `heal`, `addSpell`, `spellMod`, `unlockFeature`). Cards and pets speak the same language. Spell combos exist only as a feature flag (`spellCombos`) that the tree can unlock. A future `ComboSystem` would check it without changing the upgrade system.

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
| `DEAD` | Plays the death animation, then removes the boss. |

**Transitions come from three places:**
1. The state itself: distance, cooldowns, timers.
2. Global rules in the machine: death, and HP crossing a phase threshold.
3. External events: `handleEvent('stun')` from status effects.

Attack *types* (`melee`, `radialBurst`, `summon`) live in the `BossAttacks` registry and can be reused by any boss.

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

**What is saved:** unlocked and completed stages, defeated bosses, gold, unlocked spells, spell upgrades, tree nodes, pets, pet slots, items, story flags and settings.

**What is never saved:** stage level, EXP, cards, the current spell loadout, enemies. All of that lives on the Stage object and disappears with it.

**Gold survives death** because it is credited the moment a coin is picked up. Replaying a cleared stage grants 25% of its gold reward and no items.

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
| **A pet** | Add an entry to `PETS` in `config/petConfig.js`. |
| **A boss crafting material** | Add an item to `ITEMS`, put it in the boss's `rewards`, and use it in any cost list: `{ type: 'item', id, amount }`. |
| **A progression gate** | Add it to `MAP_GATES` with `requirements` and set `gate: 'id'` on a connection. New requirement kinds go in `ProgressionRequirement.register(...)`. |
| **A currency (e.g. Souls)** | Add it to `CURRENCIES` and add a save migration that initialises the balance. |
| **A shop** | Write a class that follows `SpellShop`'s interface, register it with `ShopManager` in `Game.js`, add a map node with `shopId`, and add a UI screen. |

Intentionally unimplemented areas have `TODO` comments that say where the logic belongs. Examples: timed card buffs, EXP orbs, a spatial hash for targeting, lane pathing for defense stages, per-phase boss events, active pet abilities, spell fusion, audio and key rebinding.
# EmberKeep4816
