import { EventBus } from './EventBus.js';
import { GameLoop } from './GameLoop.js';
import { GameStates } from './GameState.js';
import { StateMachine } from './StateMachine.js';
import { InputManager } from './InputManager.js';
import { SaveManager } from './SaveManager.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { Random } from '../utils/Random.js';

import { PlayerProgression } from '../player/PlayerProgression.js';
import { WorldMap } from '../map/WorldMap.js';
import { UnlockSystem } from '../progression/UnlockSystem.js';
import { CurrencySystem } from '../progression/CurrencySystem.js';
import { GoldSystem } from '../progression/GoldSystem.js';
import { SoulSystem } from '../progression/SoulSystem.js';
import { RelicSystem } from '../progression/RelicSystem.js';
import { NewGamePlus } from '../progression/NewGamePlus.js';
import { ProgressionItemSystem } from '../progression/ProgressionItemSystem.js';
import { CostSystem } from '../progression/CostSystem.js';
import { RewardSystem } from '../progression/RewardSystem.js';
import { UpgradeSystem } from '../progression/UpgradeSystem.js';
import { CardSystem } from '../progression/CardSystem.js';
import { PetManager } from '../pets/PetManager.js';
import { PetFactory } from '../pets/PetFactory.js';
import { SpellFactory } from '../spells/SpellFactory.js';
import { SpellManager } from '../spells/SpellManager.js';
import { ShopManager } from '../shops/ShopManager.js';
import { SpellShop } from '../shops/SpellShop.js';
import { RelicShop } from '../shops/RelicShop.js';
import { StageFactory } from '../stages/StageFactory.js';
import { StageManager } from '../stages/StageManager.js';
import { Renderer } from '../rendering/Renderer.js';
import { AssetLoader } from '../assets/AssetLoader.js';
import { UIManager } from '../ui/UIManager.js';

import { MenuState } from '../states/MenuState.js';
import { SettingsState } from '../states/SettingsState.js';
import { IntroState } from '../states/IntroState.js';
import { MapState } from '../states/MapState.js';
import { StageLoadingState } from '../states/StageLoadingState.js';
import { SpellSelectState } from '../states/SpellSelectState.js';
import { PlayingState } from '../states/PlayingState.js';
import { FinalBossState } from '../states/FinalBossState.js';
import { LevelUpState } from '../states/LevelUpState.js';
import { PausedState } from '../states/PausedState.js';
import { StageCompleteState } from '../states/StageCompleteState.js';
import { StageDefeatState } from '../states/StageDefeatState.js';
import { ShopState } from '../states/ShopState.js';
import { UpgradesState } from '../states/UpgradesState.js';
import { PetsState } from '../states/PetsState.js';
import { VictoryState } from '../states/VictoryState.js';

/**
 * Game — the composition root.
 *
 * Creates every long-lived service once, wires their dependencies explicitly
 * (constructor injection), registers the global states and runs the loop.
 * It contains no gameplay rules: those live in the systems it assembles.
 * States reach services through `game.<service>`.
 */
export class Game {
    constructor({ canvas, uiRoot, storage }) {
        this.config = GAME_CONFIG;
        this.canvas = canvas;
        this.bus = new EventBus();
        this.rng = new Random();
        this.input = new InputManager(canvas);
        this.session = { currentNodeId: null }; // non-persistent, per browser session

        // ---- Persistent progression ------------------------------------------
        this.saveManager = new SaveManager({
            key: GAME_CONFIG.saveKey,
            storage,
            defaults: { startingSpells: GAME_CONFIG.progression.startingSpells },
            bus: this.bus,
        });
        this.profile = new PlayerProgression(this.saveManager);
        this.input.setBindings(this.profile.data.settings.keyBindings);
        this.worldMap = new WorldMap({ profile: this.profile });
        this.items = new ProgressionItemSystem({ profile: this.profile, bus: this.bus });
        this.unlocks = new UnlockSystem({ profile: this.profile, bus: this.bus, worldMap: this.worldMap, items: this.items });
        this.currency = new CurrencySystem({ profile: this.profile, bus: this.bus });
        this.gold = new GoldSystem({ currency: this.currency, bus: this.bus });
        this.souls = new SoulSystem({ currency: this.currency, bus: this.bus });
        this.costs = new CostSystem({ currency: this.currency, items: this.items });
        this.rewards = new RewardSystem({ currency: this.currency, items: this.items, unlocks: this.unlocks });
        this.upgrades = new UpgradeSystem({ profile: this.profile, costs: this.costs, unlocks: this.unlocks, bus: this.bus });
        this.relics = new RelicSystem({ profile: this.profile, costs: this.costs, bus: this.bus });
        this.newGamePlus = new NewGamePlus({ profile: this.profile, unlocks: this.unlocks, worldMap: this.worldMap, bus: this.bus });
        this.pets = new PetManager({
            profile: this.profile,
            costs: this.costs,
            unlocks: this.unlocks,
            factory: new PetFactory(),
            getPermanentStats: () => this.profile.buildPermanentStats({ upgrades: this.upgrades, relics: this.relics, includePets: false }),
        });
        this.shops = new ShopManager()
            .register(new SpellShop({ profile: this.profile, costs: this.costs, unlocks: this.unlocks, bus: this.bus }))
            .register(new RelicShop({ relics: this.relics, profile: this.profile }));

        // ---- Stage-time services ---------------------------------------------
        this.spellFactory = new SpellFactory();
        this.spellManager = new SpellManager({ profile: this.profile, rng: this.rng });
        this.cards = new CardSystem({ bus: this.bus, rng: this.rng });
        this.stageManager = new StageManager({
            factory: new StageFactory({ services: this.stageServices() }),
            profile: this.profile,
            rewards: this.rewards,
            unlocks: this.unlocks,
            bus: this.bus,
        });

        // ---- Presentation ----------------------------------------------------
        this.renderer = new Renderer(canvas);
        this.assets = new AssetLoader({ sprites: this.renderer.sprites, textures: this.renderer.textures, ctx: this.renderer.ctx });
        this.ui = new UIManager(uiRoot, this.bus);

        this.states = new StateMachine();
        this.registerStates();

        this.loop = new GameLoop({
            update: (dt) => this.update(dt),
            render: (alpha) => this.render(alpha),
            step: GAME_CONFIG.fixedStep,
        });

        this.unlocks.refresh();
        this.profile.save();
    }

    /** The narrow set of services a Stage may use (keeps stages decoupled from UI/states). */
    stageServices() {
        return {
            bus: this.bus,
            rng: this.rng,
            input: this.input,
            profile: this.profile,
            upgrades: this.upgrades,
            relics: this.relics,
            pets: this.pets,
            spellFactory: this.spellFactory,
        };
    }

    registerStates() {
        const S = GameStates;
        const table = {
            [S.MENU]: MenuState,
            [S.SETTINGS]: SettingsState,
            [S.INTRO]: IntroState,
            [S.MAP]: MapState,
            [S.STAGE_LOADING]: StageLoadingState,
            [S.SPELL_SELECT]: SpellSelectState,
            [S.PLAYING]: PlayingState,
            [S.FINAL_BOSS]: FinalBossState,
            [S.LEVEL_UP]: LevelUpState,
            [S.PAUSED]: PausedState,
            [S.STAGE_COMPLETE]: StageCompleteState,
            [S.STAGE_DEFEAT]: StageDefeatState,
            [S.SHOP]: ShopState,
            [S.UPGRADES]: UpgradesState,
            [S.PETS]: PetsState,
            [S.VICTORY]: VictoryState,
        };
        for (const [id, StateClass] of Object.entries(table)) this.states.register(id, new StateClass(this));
    }

    start() {
        this.states.change(GameStates.MENU);
        this.loop.start();
        window.addEventListener('beforeunload', () => this.profile.save());
    }

    update(dt) {
        this.states.update(dt);
        this.input.endTick();
    }

    render(alpha) {
        const now = performance.now();
        this.renderer.beginFrame(Math.min(0.1, (now - (this._lastRender ?? now)) / 1000));
        this._lastRender = now;
        this.states.render(alpha);
    }
}
