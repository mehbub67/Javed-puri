
export enum GameState {
  LOADING = 'LOADING',
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Entity {
  speed: number;
}

export interface Villain extends Entity {
  speed: number;
  imageIndex: number;
  id: number;
}

export interface GameAssets {
  hero: HTMLImageElement;
  bg: HTMLImageElement;
  menuBg: HTMLImageElement;
  villains: HTMLImageElement[];
}

export interface AudioSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
}
