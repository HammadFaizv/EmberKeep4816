/** Story text. Each page is a list of paragraphs shown together. */
export const INTRO_PAGES = Object.freeze([
    ['You do not remember your name.', 'You do not remember your death.', 'You only remember waking in darkness.'],
    ['A strange witch stood over you, holding a tiny human-shaped doll.', 'She told you that your soul was not the first.', 'Nor the hundredth.', 'You were the 4816th.'],
    ['For years, the witch has been gathering lost souls and placing them inside dolls, sending them north toward a land consumed by corruption.'],
    ['Something has awakened in the north.', 'The Demon Lord.', 'His arrival twisted the land, corrupted the dead, and filled the world with creatures born from broken souls.'],
    ['Every soul she sent before you eventually disappeared.', 'Now it is your turn.', 'The witch gives you the doll.'],
    ['\'Go north,\' she whispers.', '\'Find out what happened to the others.\'', 'Your journey begins at a forgotten hut at the edge of the world.'],
]);

export const VICTORY_TEXT = Object.freeze([
    'The Demon Lord\'s heart stops. The corruption loosens its grip on the land.',
    'Among the ashes you find thousands of tiny dolls — the souls who came before you, still waiting.',
    'Soul #4816 was the one who made it.',
    // TODO: Post-game — a New Game+ flag in the save (story.cleared) could raise
    // difficulty tiers and unlock a second map region.
]);
