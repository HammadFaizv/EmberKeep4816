import { Game } from './core/Game.js';
import { GAME_CONFIG } from './config/gameConfig.js';

/**
 * Entry point: sizes the fixed-resolution game container to the window and
 * starts the Game. The canvas and DOM UI share one 1280×720 coordinate space
 * that is CSS-scaled as a unit, so UI and canvas always line up.
 */
const container = document.getElementById('game-container');
const canvas = document.getElementById('game-canvas');
const uiRoot = document.getElementById('ui-root');

canvas.width = GAME_CONFIG.canvas.width;
canvas.height = GAME_CONFIG.canvas.height;

function fit() {
    const scale = Math.min(window.innerWidth / GAME_CONFIG.canvas.width, window.innerHeight / GAME_CONFIG.canvas.height);
    container.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
window.addEventListener('resize', fit);
fit();

const game = new Game({ canvas, uiRoot });
game.start();

// Exposed for debugging from the browser console (e.g. game.currency.add('gold', 500)).
window.game = game;
