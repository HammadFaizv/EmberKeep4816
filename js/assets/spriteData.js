/**
 * Pixel-art sprite definitions (built at load time by assets/PixelArt.js).
 *
 * Every sprite is plain text: one character per pixel, looked up in the
 * sprite's palette ('.' = transparent). `mirror: true` sprites list only the
 * LEFT half of each row; `extra` is an optional full-width layer painted on top
 * (asymmetric details such as a scythe or a bow on a mirrored body).
 *
 * Draw sizing: the renderer scales a sprite so its height is roughly
 * `entity.radius * 2 * fit`. `fps` > 0 cycles through `frames`.
 *
 * To reskin an enemy: edit its grid or palette here, or point its config
 * `render.sprite` at another key. Gameplay code never references sprites.
 */
import { recolor } from './PixelArt.js';

const OUTLINE = '#140c10';

// ---- Player -------------------------------------------------------------------
const doll = {
    mirror: true,
    fit: 1.45,
    palette: {
        h: '#6b3f2a', H: '#8a5436', s: '#f1dfc4', S: '#d9c2a3', b: '#1a1a2a', B: '#6a6a8a',
        c: '#e89a8a', m: '#8a4a3a', d: '#8b5a3c', D: '#6e4430', p: '#c99a5a', l: '#5a3a28', f: '#2a1a14',
    },
    frames: [[
        '........',
        '....hhhh',
        '..hhHhhh',
        '.hhhhsss',
        '.hhsssss',
        '.hssbBss',
        '.hssbbss',
        '.hssssss',
        '.hsscsmm',
        '..hsssss',
        '...SSsss',
        '....dddd',
        '..sdDddd',
        '..sddpdd',
        '...ddddd',
        '..dDdddd',
        '.....l..',
        '....ff..',
    ]],
};

// ---- Regular enemies --------------------------------------------------------------
const skeleton = {
    mirror: true,
    fps: 0,
    palette: { w: '#e8e2cf', W: '#bdb49c', k: '#2a1e1e', r: '#ff4a3a' },
    frames: [[
        '........',
        '....wwww',
        '...wwwww',
        '...wWwww',
        '...wkkww',
        '...wkrww',
        '...wwwwk',
        '....wwww',
        '....wwkw',
        '......ww',
        '..wwWwww',
        '..w.wkww',
        '..w.wwww',
        '..W.wkww',
        '.....Www',
        '.....w..',
        '....ww..',
    ]],
};

const skeletonKnight = {
    mirror: true,
    fit: 1.35,
    palette: { a: '#8a93a8', A: '#56607a', w: '#e8e2cf', k: '#1a1418', r: '#6fd3ff', g: '#c9a227', c: '#7a1f1f' },
    frames: [[
        '.......c',
        '....aaac',
        '...aaaaa',
        '..aaaaaa',
        '..aAAAAA',
        '..aAkrkk',
        '..aAAAAA',
        '..aaawww',
        '...aaaaa',
        '.AAaaaaa',
        'AAAagaaa',
        'AA.aaaaa',
        'w..aaaga',
        'w..aaaaa',
        '....AA.A',
        '....aa..',
        '...AAA..',
    ]],
};

const goblin = {
    mirror: true,
    palette: { g: '#6fae4a', G: '#4f8a34', y: '#ffe14d', r: '#d02020', k: '#2a1a10', w: '#f0f0e0', b: '#6b4a2a', B: '#4a321c' },
    frames: [[
        '........',
        '........',
        'g...gggg',
        'Gg.ggggg',
        '.GGggggg',
        '..gyrggg',
        '..gggggg',
        '...ggkkk',
        '...ggwkk',
        '....gggg',
        '....bbbb',
        '..g.bBbb',
        '..g.bbbb',
        '....BbbB',
        '.....g..',
        '....GG..',
    ]],
};

const goblinArcher = {
    ...recolor(goblin, { g: '#9bc25a', G: '#6f9a3a', b: '#3f5a2a', B: '#2c4020' }),
    extra: [
        '................',
        '................',
        '................',
        '................',
        '................',
        '................',
        '..............n.',
        '...............n',
        '...............n',
        '..............xn',
        '.............x.n',
        '..............xn',
        '...............n',
        '...............n',
        '..............n.',
        '................',
    ],
    palette: { ...recolor(goblin, { g: '#9bc25a', G: '#6f9a3a', b: '#3f5a2a', B: '#2c4020' }).palette, n: '#8a5a2a', x: '#d8d0b0' },
};

const bat = {
    mirror: true,
    fps: 8,
    fit: 1.4,
    palette: { p: '#8a5fb8', P: '#5e3f86', y: '#ffdd55', w: '#f0f0f0' },
    frames: [
        [
            '........',
            'P.......',
            'PP......',
            'PPP..p..',
            '.PPPpppp',
            '..PPppyp',
            '...ppppp',
            '....pppp',
            '......wp',
            '........',
        ],
        [
            '........',
            '........',
            '........',
            '.....p..',
            '...Ppppp',
            '..PPppyp',
            '.PPPpppp',
            'PPP.pppp',
            'PP....wp',
            'P.......',
        ],
    ],
};

const imp = {
    ...recolor(bat, { p: '#e0472b', P: '#8a1f14', y: '#ffe14d', w: '#ffd08a' }),
    frames: bat.frames.map((f) => ['.....h..', ...f.slice(1)]),
    palette: { ...recolor(bat, { p: '#e0472b', P: '#8a1f14', y: '#ffe14d', w: '#ffd08a' }).palette, h: '#3a0d0d' },
};

const snake = {
    fps: 6,
    fit: 1.3,
    palette: { b: '#5fa37a', B: '#3f7a56', l: '#b5d98a', y: '#ffe14d', r: '#d02040' },
    frames: [
        [
            '................',
            '..........bbbb..',
            '.........bbbbbb.',
            '.........bbybbb.',
            '..bbb....Bbbbbbr',
            '.bblbb..bbbb..r.',
            'bB..bBbBbbl.....',
            'B....blbbb......',
            '................',
        ],
        [
            '................',
            '..........bbbb..',
            '.........bbbbbb.',
            '.........bbybbb.',
            '.........Bbbbbb.',
            'bbblbb..bbbb..rr',
            'B...bbbBbbl.....',
            '.....BlbbB......',
            '................',
        ],
    ],
};

// ---- Bosses (24 px wide) --------------------------------------------------------
const boneWarden = {
    mirror: true,
    fit: 1.35,
    palette: { w: '#e8e2cf', W: '#b8ae94', k: '#1a1414', r: '#ff3a2a', a: '#7a1f1f', A: '#a83a2a', c: '#3a2a2a', C: '#57403a', g: '#c9a227' },
    frames: [[
        '......a...a.',
        '.....aA..aAa',
        '.....aaagaaa',
        '....wwwwwwww',
        '...wwwwwwwww',
        '..wwWwwwwwww',
        '..wwwkkkwwww',
        '..wwkkrkwwww',
        '..wwwkkkwwww',
        '..wwwwwwwwwk',
        '...wwwwwwwww',
        '...wwkwkwkwk',
        '....wwwwwwww',
        '......Wwwwww',
        '..cccccwwwww',
        '.cCcccwwkwkw',
        '.cc.cwwwwwww',
        '.cc.cwwkwkwk',
        '.w..cwwwwwww',
        '.W...ccgcccc',
        '......Www...',
        '......www...',
        '.....cccc...',
    ]],
};

const goblinChieftain = {
    mirror: true,
    fit: 1.4,
    palette: { g: '#6fae4a', G: '#4f8a34', y: '#ffe14d', r: '#d02020', k: '#2a1a10', w: '#f0f0e0', o: '#c9a227', O: '#8a6a14', f: '#8a6a4a', F: '#5a4030', b: '#6b4a2a' },
    frames: [[
        '......o..o.o',
        '......oOooOo',
        '......oooooo',
        'g.....gggggg',
        'Gg...ggggggg',
        '.Ggggggggggg',
        '..GGgggggggg',
        '....ggyrgggg',
        '....gggggggg',
        '.....ggkkkkk',
        '.....ggwkwkk',
        '......gggggg',
        '...fFffffbbb',
        '..fFffffbbbb',
        '..ff..gbbbbb',
        '..g...gbbObb',
        '..g...gbbbbb',
        '......bbbbbb',
        '.......gg...',
        '.......gg...',
        '......GGG...',
    ]],
    extra: null,
};

const rotMother = {
    mirror: true,
    fit: 1.25,
    fps: 3,
    palette: { g: '#6a7d3a', G: '#4a5a28', l: '#b5c96a', y: '#ffe14d', k: '#1a1a10', p: '#8a4a6a', m: '#3a1a1a' },
    frames: [
        [
            '............',
            '........gggg',
            '......gggggg',
            '.....gglgggg',
            '....gggggygg',
            '...ggykgggkg',
            '...ggkkggggg',
            '..gggggggggg',
            '..ggglgggyyg',
            '.gggggggggkk',
            '.ggggmmmmmmm',
            '.gggmpmpmpmp',
            '.ggggmmmmmmm',
            '.gGgggggggll',
            '..GgggglgGgg',
            '..GGgggggggg',
            '...GGGggggGg',
            '.....GGGGGGG',
        ],
        [
            '............',
            '............',
            '.......ggggg',
            '.....gggglgg',
            '....ggggggyg',
            '...ggykggggk',
            '..gggkkggggg',
            '..gggggggggg',
            '.gggglgggyyg',
            '.gggggggggkk',
            '.ggggmmmmmmm',
            'gggggmpmpmpm',
            '.ggggmmmmmmm',
            '.gGgggggggll',
            '.GGgggglgGgg',
            '..GGgggggggg',
            '...GGGggggGg',
            '.....GGGGGGG',
        ],
    ],
};

const ironRevenant = {
    mirror: true,
    fit: 1.4,
    palette: { a: '#9aa3b5', A: '#6a7386', d: '#3b4254', k: '#0e0e14', r: '#ff5a3a', c: '#7a1f1f', g: '#c9a227' },
    frames: [[
        '..........cc',
        '.........ccc',
        '......aaaaaa',
        '.....aaaaaaa',
        '....aaAaaaaa',
        '....aaaaaaaa',
        '....aAkkkkkk',
        '....aAkrrkkk',
        '....aAkkkkkk',
        '....aaaaAaaa',
        '.....aaAaAaA',
        '..dddaaaaaaa',
        '.ddddAaaaaaa',
        '.dd.AaaagAaa',
        '.dd.AaaaaAaa',
        '.a..Aaaaaaaa',
        '.a..dddddgdd',
        '.A...aaa..aa',
        '.....aaa..aa',
        '....dddd..dd',
    ]],
};

const soulReaper = {
    mirror: true,
    fit: 1.45,
    fps: 4,
    palette: { p: '#4b3b6b', P: '#2e2246', k: '#0a0810', e: '#b89cff', E: '#e8dcff', s: '#9a9aa8', h: '#6a4a2a' },
    frames: [
        [
            '........pppp',
            '......pppppp',
            '.....ppPPPPP',
            '....ppPkkkkk',
            '....pPkkkkkk',
            '....pPkkeEkk',
            '....pPkkkkkk',
            '....ppPkkkkk',
            '...pppPPkkkk',
            '...ppppPPPPP',
            '..pppppppppp',
            '..ppPppppppp',
            '..ppPppppppp',
            '..pPPppppppp',
            '..pPpppppppp',
            '..pPpppPpppp',
            '..PPpppPpppP',
            '..P.PpP.PpP.',
        ],
        [
            '........pppp',
            '......pppppp',
            '.....ppPPPPP',
            '....ppPkkkkk',
            '....pPkkkkkk',
            '....pPkkEekk',
            '....pPkkkkkk',
            '....ppPkkkkk',
            '...pppPPkkkk',
            '...ppppPPPPP',
            '..pppppppppp',
            '..ppPppppppp',
            '..ppPppppppp',
            '..pPPppppppp',
            '..pPpppppppp',
            '..pPpppPpppp',
            '..PPpppPpppP',
            '...PpP.PpP.P',
        ],
    ],
    extra: [
        '...sssssss..............',
        '.sss.....hh.............',
        'ss........h.............',
        's.........h.............',
        '..........h.............',
        '..........h.............',
        '..........h.............',
        '..........h.............',
        '..........h.............',
        '..........h.............',
        '..........h.............',
        '..........h.............',
        '..........h.............',
        '..........h.............',
    ],
};

const demonLord = {
    mirror: true,
    fit: 1.4,
    fps: 4,
    palette: { r: '#6a1410', R: '#3a0d0d', h: '#2a1a1a', H: '#4a3a3a', y: '#ffd23a', o: '#ff7a1a', k: '#1a0606', g: '#c9a227', f: '#ff4a1a' },
    frames: [
        [
            'H...........',
            'Hh..........',
            '.Hh.....g..g',
            '.Hhh....gggg',
            '..hhh.rrrrrr',
            '...hhrrrrrrr',
            '....rrrrrrrr',
            '....rrRyyrrr',
            '....rrRyorrr',
            '....rrrrrrrr',
            '....rrrrkkkk',
            '.....rrkfkfk',
            '...RRRrrkkkk',
            '..RRRRrrrrrr',
            '.RRRrRRrrrrr',
            '.RR.rRrrrgrr',
            '.rr.rRrrrrrr',
            '.r..RRRRRRRR',
            '.r...RRr..RR',
            '.....RRr..RR',
            '....kkkk..kk',
        ],
        [
            'H...........',
            'Hh..........',
            '.Hh.....g..g',
            '.Hhh....gggg',
            '..hhh.rrrrrr',
            '...hhrrrrrrr',
            '....rrrrrrrr',
            '....rrRoyrrr',
            '....rrRyyrrr',
            '....rrrrrrrr',
            '....rrrrkkkk',
            '.....rrkfkfk',
            '...RRRrrkkkk',
            '..RRRRrrrrrr',
            '.RRRrRRrrrrr',
            '.RR.rRrrrgrr',
            '.rr.rRrrrrrr',
            '.r..RRRRRRRR',
            '.r...RRr..RR',
            '.....RRr..RR',
            '....kkkk..kk',
        ],
    ],
};

// ---- Pets (12 px) ---------------------------------------------------------------
const petEmber = {
    mirror: true, fps: 6, fit: 1.9,
    palette: { y: '#fff2a0', o: '#ff9a3d', r: '#e0472b', k: '#2a0a0a' },
    frames: [
        ['.....o', '....oo', '...oyo', '..ooyy', '..oyyy', '.roykk', '.royyy', '.rooyy', '..rooo', '...rrr'],
        ['......', '.....o', '...ooo', '..ooyy', '.ooyyy', '.roykk', '.royyy', '.rooyy', '..rooo', '...rrr'],
    ],
};
const petPup = {
    mirror: true, fit: 1.9,
    palette: { y: '#ffe14d', Y: '#c9a227', w: '#fff6d0', k: '#1a1a2a', p: '#e87a8a' },
    frames: [['Y.....', 'YY....', 'Yyyyyy', '.yyyyy', '.ykyyy', '.yyyyw', '..yywk', '..yyww', '...pyy', '....yy']],
};
const petHawk = {
    mirror: true, fps: 6, fit: 1.9,
    palette: { t: '#7fe3c4', T: '#3f9a84', w: '#e8fff6', k: '#1a1a2a', o: '#ffb347' },
    frames: [
        ['......', 'T.....', 'TT..tt', 'TTTttt', '.TTtkt', '..tttt', '...two', '....ww', '....t.', '......'],
        ['......', '......', '....tt', '..Tttt', '.TTtkt', 'TTTttt', 'TT.two', 'T...ww', '....t.', '......'],
    ],
};
const petFox = {
    mirror: true, fit: 1.9,
    palette: { b: '#bfeaff', B: '#7ab8d8', w: '#ffffff', k: '#1a1a2a' },
    frames: [['B.....', 'BB....', 'BbB..b', '.bbbbb', '.bkbbb', '.bbbbw', '..bbww', '...bwk', '...bbw', '....bb']],
};

// ---- Pickups ------------------------------------------------------------------------
const coin = {
    mirror: true, outline: '#3a2a08', fit: 2.2,
    palette: { y: '#f5c542', Y: '#c9971a', w: '#fff2b0' },
    frames: [['..yy', '.yww', 'ywyy', 'ywyY', 'yyyY', 'yyYY', '.yYY', '..YY']],
};
const expGem = (fill, light, dark) => ({
    mirror: true, outline: '#0a1420', fit: 2.2,
    palette: { c: fill, l: light, d: dark },
    frames: [['..l', '.ll', 'lcc', 'ccc', '.cd', '..d']],
});
const expLarge = {
    mirror: true, outline: '#1a0a20', fit: 2.2,
    palette: { c: '#ff8af0', l: '#ffd6fa', d: '#b04aa0' },
    frames: [['...l', '..ll', '.lcc', 'lccc', 'cccc', '.ccd', '..dd', '...d']],
};
const soulWisp = {
    mirror: true, outline: null, fps: 6, fit: 2.4,
    palette: { e: '#b89cff', E: '#e8dcff', p: '#6a4ab8' },
    frames: [
        ['...E', '..EE', '..EE', '.eEE', '.eeE', 'peee', 'peee', '.pee', '..pp', '...p'],
        ['....', '...E', '..EE', '.eEE', '.eeE', 'peee', 'peee', '.pee', '..pp', '..p.'],
    ],
};

// ---- Defense structures -------------------------------------------------------------
const barricade = {
    fit: 1.2,
    palette: { w: '#8b6a45', W: '#5a4028', s: '#d8d0b0', r: '#6a4a2a' },
    frames: [[
        '..s......s......s..',
        '..w......w......w..',
        '.www....www....www.',
        'wwwwwwwwwwwwwwwwwww',
        'WWWWWWWWWWWWWWWWWWW',
        '.r.w..r..w..r..w.r.',
        '.rWw.rW.Ww.rW.Ww.r.',
        'wwwwwwwwwwwwwwwwwww',
        'WWWWWWWWWWWWWWWWWWW',
        '.W......W......W...',
    ]],
};
const tower = {
    mirror: true, fit: 1.9, anchorY: 0.7,
    palette: { r: '#7a2a1f', R: '#a83a2a', s: '#9a8c7a', S: '#6a5e50', k: '#1a1414', w: '#8b6a45' },
    frames: [[
        '.......r',
        '......rr',
        '.....rrR',
        '....rrRr',
        '...rrrrr',
        '..rrrrrr',
        '...sssss',
        '...sSSSS',
        '...ssskk',
        '...sssss',
        '...sSsss',
        '...ssssS',
        '...Sssss',
        '...ssskk',
        '...sssss',
        '..ssSsss',
        '..sssssS',
        '.SSSSSSS',
    ]],
};

/** Every sprite by key. Enemy/boss/pet/pickup configs reference these keys. */
export const SPRITES = Object.freeze({
    doll,
    skeleton,
    skeleton_knight: skeletonKnight,
    goblin,
    goblin_archer: goblinArcher,
    bat,
    imp,
    snake,
    bone_warden: boneWarden,
    goblin_chieftain: goblinChieftain,
    rot_mother: rotMother,
    iron_revenant: ironRevenant,
    soul_reaper: soulReaper,
    demon_lord: demonLord,
    pet_ember: petEmber,
    pet_pup: petPup,
    pet_hawk: petHawk,
    pet_fox: petFox,
    coin,
    exp_small: expGem('#6fd3ff', '#d6f4ff', '#2a7ab8'),
    exp_medium: expGem('#7dff9a', '#dcffe4', '#2aa84a'),
    exp_large: expLarge,
    soul: soulWisp,
    barricade,
    tower,
});

export { OUTLINE };
