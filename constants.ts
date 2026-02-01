
// CONFIGURABLE ASSET PATHS
// All assets are now expected to be inside the 'assets/' folder.
export const ASSET_PATHS = {
  hero: 'assets/hero.png',
  heroFallback: 'https://picsum.photos/seed/hero/100/100',
  bg: 'assets/bg.png',
  bgFallback: 'https://picsum.photos/seed/algapuri-bg/800/600',
  menuBg: 'assets/mainmm.png', 
  menuBgFallback: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800',
  villains: [
    'assets/villain1.png',
    'assets/villain2.png',
    'assets/villain3.png'
  ],
  villainFallbacks: [
    'https://picsum.photos/seed/v1/80/80',
    'https://picsum.photos/seed/v2/80/80',
    'https://picsum.photos/seed/v3/80/80'
  ],
  // Audio files now also in the assets folder
  musicMenu: 'assets/game-music.mp3',
  musicGame: 'assets/game-music.mp3',
  sfxEat: 'assets/eat.mp3'
};

export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 800;
export const PLAYER_SIZE = 80;
export const VILLAIN_BASE_SIZE = 60;
export const INITIAL_LIVES = 3;
export const EATS_PER_LEVEL = 10;
export const MAX_LEVELS = 100;
