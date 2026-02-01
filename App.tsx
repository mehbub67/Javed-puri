
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameAssets, AudioSettings } from './types';
import { ASSET_PATHS, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import GameEngine from './components/GameEngine';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>(GameState.LOADING);
  const [assets, setAssets] = useState<GameAssets | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    musicEnabled: true,
    sfxEnabled: true
  });

  const menuMusicRef = useRef<HTMLAudioElement | null>(null);
  const gameMusicRef = useRef<HTMLAudioElement | null>(null);
  const eatSfxRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('algapuri_highscore');
    if (saved) setHighScore(parseInt(saved, 10));

    // Initialize Audio with local paths from assets/ folder
    menuMusicRef.current = new Audio(ASSET_PATHS.musicMenu);
    menuMusicRef.current.loop = true;
    gameMusicRef.current = new Audio(ASSET_PATHS.musicGame);
    gameMusicRef.current.loop = true;
    eatSfxRef.current = new Audio(ASSET_PATHS.sfxEat);

    const loadImage = (src: string, fallbackUrl?: string): Promise<HTMLImageElement> => {
      return new Promise((resolve) => {
        const img = new Image();
        
        // Only use crossOrigin for external http URLs
        if (src.startsWith('http')) {
          img.crossOrigin = 'anonymous';
        }

        img.onload = () => resolve(img);
        img.onerror = () => {
          if (fallbackUrl && src !== fallbackUrl) {
            console.warn(`Asset failed: ${src}, trying fallback: ${fallbackUrl}`);
            loadImage(fallbackUrl).then(resolve);
          } else {
            console.error(`Asset failed permanently: ${src}`);
            const canvas = document.createElement('canvas');
            canvas.width = 64; canvas.height = 64;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = src.includes('hero') ? '#3b82f6' : (src.includes('bg') ? '#0f172a' : '#ef4444');
              ctx.fillRect(0, 0, 64, 64);
            }
            const failImg = new Image();
            failImg.src = canvas.toDataURL();
            resolve(failImg);
          }
        };
        img.src = src;
      });
    };

    const loadAllAssets = async () => {
      try {
        const [heroImg, bgImg, menuBgImg] = await Promise.all([
          loadImage(ASSET_PATHS.hero, ASSET_PATHS.heroFallback),
          loadImage(ASSET_PATHS.bg, ASSET_PATHS.bgFallback),
          loadImage(ASSET_PATHS.menuBg, ASSET_PATHS.menuBgFallback)
        ]);

        const villainImgs = await Promise.all(
          ASSET_PATHS.villains.map((path, i) => loadImage(path, ASSET_PATHS.villainFallbacks[i]))
        );

        setAssets({
          hero: heroImg,
          bg: bgImg,
          menuBg: menuBgImg,
          villains: villainImgs
        });
        setState(GameState.MENU);
      } catch (err) {
        console.error("Critical asset failure", err);
      }
    };

    loadAllAssets();
  }, []);

  useEffect(() => {
    const playMusic = async (audio: HTMLAudioElement | null) => {
      if (!audio) return;
      try {
        if (audioSettings.musicEnabled) {
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (e) {
        console.log("Music playback waiting for interaction");
      }
    };

    if (state === GameState.MENU || state === GameState.GAME_OVER) {
      gameMusicRef.current?.pause();
      playMusic(menuMusicRef.current);
    } else if (state === GameState.PLAYING) {
      menuMusicRef.current?.pause();
      playMusic(gameMusicRef.current);
    }
  }, [state, audioSettings.musicEnabled]);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setLives(3);
    setState(GameState.PLAYING);
  };

  const playEatSfx = useCallback(() => {
    if (audioSettings.sfxEnabled && eatSfxRef.current) {
      const sfx = eatSfxRef.current.cloneNode() as HTMLAudioElement;
      sfx.play().catch(() => {});
    }
  }, [audioSettings.sfxEnabled]);

  const onGameOver = (finalScore: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('algapuri_highscore', finalScore.toString());
    }
    setState(GameState.GAME_OVER);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center bg-slate-950 overflow-hidden font-sans">
      <div 
        className="relative bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border-2 border-white/10 rounded-xl"
        style={{ width: 'min(95vw, 480px)', aspectRatio: '480/800' }}
      >
        {assets && (
          <GameEngine 
            state={state}
            assets={assets}
            level={level}
            lives={lives}
            score={score}
            onEat={playEatSfx}
            setScore={setScore}
            setLevel={setLevel}
            setLives={setLives}
            onGameOver={onGameOver}
          />
        )}

        <div className="absolute inset-0 pointer-events-none flex flex-col">
          {state === GameState.PLAYING && (
            <div className="p-4 flex justify-between items-start text-white pointer-events-auto z-20">
              <div className="flex flex-col drop-shadow-lg">
                <span className="text-[10px] uppercase tracking-widest text-white/60">Lv.</span>
                <span className="text-3xl font-black italic">{level}</span>
              </div>
              <div className="flex flex-col items-center drop-shadow-lg">
                <span className="text-[10px] uppercase tracking-widest text-white/60">Score</span>
                <span className="text-4xl font-black text-yellow-400">{score}</span>
              </div>
              <div className="flex flex-col items-end drop-shadow-lg">
                <span className="text-[10px] uppercase tracking-widest text-white/60">HP</span>
                <div className="flex gap-1.5 mt-1">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-4 rounded-full border border-white/40 transition-colors duration-300 ${i < lives ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-900'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center justify-center pointer-events-auto relative">
            {state === GameState.LOADING && (
              <div className="text-center z-10 animate-pulse">
                <div className="h-12 w-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-white text-sm font-bold tracking-widest uppercase">Initializing...</h2>
              </div>
            )}

            {state === GameState.MENU && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
                {assets?.menuBg && (
                  <img 
                    src={assets.menuBg.src} 
                    alt="Menu Background" 
                    className="absolute inset-0 w-full h-full object-cover opacity-90 scale-105 animate-[pulse_10s_infinite]"
                  />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

                <div className="relative z-10 text-center space-y-12 w-full">
                  <div className="space-y-2">
                    <h1 className="text-7xl font-black text-white italic tracking-tighter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] leading-[0.9]">
                      ALGAPURI<br/>
                      <span className="text-yellow-400 bg-clip-text">RUN</span>
                    </h1>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-[0.3em]">The Ultimate Arcade Challenge</p>
                  </div>
                  
                  <div className="space-y-4 max-w-xs mx-auto">
                    <button 
                      onClick={startGame}
                      className="group relative w-full py-5 bg-yellow-400 text-black font-black text-2xl rounded-2xl shadow-xl hover:bg-white transition-all transform active:scale-95 uppercase italic overflow-hidden"
                    >
                      <span className="relative z-10">Play Now</span>
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
                    </button>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setAudioSettings(s => ({ ...s, musicEnabled: !s.musicEnabled }))}
                        className={`flex-1 py-3 rounded-xl border border-white/20 font-bold text-xs uppercase transition-all ${audioSettings.musicEnabled ? 'bg-white/10 text-white' : 'bg-black/40 text-white/40'}`}
                      >
                        Music: {audioSettings.musicEnabled ? 'On' : 'Off'}
                      </button>
                      <button 
                        onClick={() => setAudioSettings(s => ({ ...s, sfxEnabled: !s.sfxEnabled }))}
                        className={`flex-1 py-3 rounded-xl border border-white/20 font-bold text-xs uppercase transition-all ${audioSettings.sfxEnabled ? 'bg-white/10 text-white' : 'bg-black/40 text-white/40'}`}
                      >
                        SFX: {audioSettings.sfxEnabled ? 'On' : 'Off'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-8">
                    <div className="inline-block px-4 py-2 bg-black/60 rounded-full border border-white/10 backdrop-blur-md">
                      <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest mr-2">Top Score</span>
                      <span className="text-white font-black">{highScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {state === GameState.GAME_OVER && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 bg-black/90 backdrop-blur-md animate-in zoom-in duration-300">
                <div className="text-center space-y-8 w-full max-w-[320px]">
                  <div className="space-y-1">
                    <h2 className="text-6xl font-black text-red-600 italic uppercase">Wasted</h2>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Better luck next time</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Level</span>
                      <span className="text-3xl font-black text-white italic">{level}</span>
                    </div>
                    <div className="h-px bg-white/10 w-full"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Score</span>
                      <span className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.3)]">{score}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={startGame}
                      className="w-full py-5 bg-white text-black font-black text-xl rounded-2xl hover:bg-yellow-400 transition-all transform active:scale-95 uppercase italic"
                    >
                      Respawn
                    </button>
                    <button 
                      onClick={() => setState(GameState.MENU)}
                      className="w-full py-3 text-white/40 font-bold hover:text-white transition-colors uppercase tracking-[0.2em] text-[10px]"
                    >
                      Return to Base
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
