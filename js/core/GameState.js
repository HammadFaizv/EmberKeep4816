/**
 * Identifiers for the global game states.
 *
 * Each id maps to a state object registered in Game.js (see js/states/).
 * To add a new state: add an id here, create a class in js/states/, and
 * register it in Game.registerStates(). No other file needs to change.
 */
export const GameStates = Object.freeze({
    MENU: 'MENU',
    SETTINGS: 'SETTINGS',
    INTRO: 'INTRO',
    MAP: 'MAP',
    STAGE_LOADING: 'STAGE_LOADING',
    SPELL_SELECT: 'SPELL_SELECT',
    PLAYING: 'PLAYING',
    LEVEL_UP: 'LEVEL_UP',
    STAGE_COMPLETE: 'STAGE_COMPLETE',
    STAGE_DEFEAT: 'STAGE_DEFEAT',
    SHOP: 'SHOP',
    UPGRADES: 'UPGRADES',
    PETS: 'PETS',
    PAUSED: 'PAUSED',
    FINAL_BOSS: 'FINAL_BOSS',
    VICTORY: 'VICTORY',
});
