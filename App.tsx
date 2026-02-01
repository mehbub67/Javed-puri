
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

  // Audio References
  const menuMusicRef = useRef<HTMLAudioElement | null>(null);
  const gameMusicRef = useRef<HTMLAudioElement | null>(null);
  const eatSfxRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load high score
    const saved = localStorage.getItem('algapuri_highscore');
    if (saved) setHighScore(parseInt(saved, 10));

    // Initialize Audio
    menuMusicRef.current = new Audio(ASSET_PATHS.musicMenu);
    menuMusicRef.current.loop = true;
    gameMusicRef.current = new Audio(ASSET_PATHS.musicGame);
    gameMusicRef.current.loop = true;
    eatSfxRef.current = new Audio(ASSET_PATHS.sfxEat);

    // Preload Images
    const loadImages = async () => {
      try {
        const loadImage = (src: string): Promise<HTMLImageElement> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => {
               // Fallback pixel if image fails
               const canvas = document.createElement('canvas');
               canvas.width = 1; canvas.height = 1;
               const ctx = canvas.getContext('2d');
               if(ctx) {
                 ctx.fillStyle = '#1e293b';
                 ctx.fillRect(0,0,1,1);
               }
               const fallback = new Image();
               fallback.src = canvas.toDataURL();
               resolve(fallback);
            };
            img.src = src;
          });
        };

        const heroImg = await loadImage(ASSET_PATHS.hero);
        const bgImg = await loadImage(ASSET_PATHS.bg);
        const menuBgImg = await loadImage(ASSET_PATHS.menuBg);
        const villainImgs = await Promise.all(ASSET_PATHS.villains.map(loadImage));

        setAssets({
          hero: heroImg,
          bg: bgImg,
          menuBg: menuBgImg,
          villains: villainImgs
        });
        setState(GameState.MENU);
      } catch (err) {
        console.error("Asset loading failed", err);
      }
    };

    loadImages();
  }, []);

  // Audio Management
  useEffect(() => {
    if (state === GameState.MENU || state === GameState.GAME_OVER) {
      if (audioSettings.musicEnabled) {
        menuMusicRef.current?.play().catch(() => {});
      } else {
        menuMusicRef.current?.pause();
      }
      gameMusicRef.current?.pause();
    } else if (state === GameState.PLAYING) {
      menuMusicRef.current?.pause();
      if (audioSettings.musicEnabled) {
        gameMusicRef.current?.play().catch(() => {});
      } else {
        gameMusicRef.current?.pause();
      }
    } else {
      menuMusicRef.current?.pause();
      gameMusicRef.current?.pause();
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
      eatSfxRef.current.currentTime = 0;
      eatSfxRef.current.play().catch(() => {});
    }
  }, [audioSettings.sfxEnabled]);

  const toggleMusic = () => setAudioSettings(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  const toggleSfx = () => setAudioSettings(prev => ({ ...prev, sfxEnabled: !prev.sfxEnabled }));

  const onGameOver = (finalScore: number, finalLevel: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('algapuri_highscore', finalScore.toString());
    }
    setState(GameState.GAME_OVER);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center font-sans">
      {/* Game Canvas Container */}
      <div 
        className="relative bg-black shadow-2xl overflow-hidden border-4 border-slate-700 rounded-lg"
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

        {/* UI Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col">
          {/* HUD (Always visible during play) */}
          {state === GameState.PLAYING && (
            <div className="p-4 flex justify-between items-start text-white pointer-events-auto z-10">
              <div className="flex flex-col drop-shadow-md">
                <span className="text-xs uppercase opacity-80">Level</span>
                <span className="text-2xl font-black italic">{level}</span>
              </div>
              <div className="flex flex-col items-center drop-shadow-md">
                <span className="text-xs uppercase opacity-80">Score</span>
                <span className="text-3xl font-black text-yellow-400">{score}</span>
              </div>
              <div className="flex flex-col items-end drop-shadow-md">
                <span className="text-xs uppercase opacity-80">Lives</span>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-4 rounded-full border border-white ${i < lives ? 'bg-red-500' : 'bg-gray-800'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MENUS */}
          <div className="flex-1 flex flex-col items-center justify-center pointer-events-auto relative">
            {state === GameState.LOADING && (
              <div className="text-center z-10">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-4"></div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Loading Assets...</h2>
              </div>
            )}

            {state === GameState.MENU && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500">
                {/* Main Menu Background Image */}
                {assets?.menuBg && (
                  <img 
                    src={ASSET_PATHS.menuBg} 
                    alt="Menu Background" 
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                )}
                
                {/* Menu Content */}
                <div className="relative z-10 text-center space-y-8">
                  <div className="relative">
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-600 italic tracking-tighter transform -skew-x-12 drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
                      ALGAPURI<br/>RUN
                    </h1>
                    <div className="absolute -bottom-2 right-0 bg-white text-black text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest">v2.0 Turbo</div>
                  </div>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={startGame}
                      className="w-48 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-xl rounded-full shadow-[0_4px_20px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all uppercase italic border-2 border-white/20"
                    >
                      Start Game
                    </button>
                    <div className="flex gap-4 justify-center">
                      <button onClick={toggleMusic} className={`p-3 rounded-full ${audioSettings.musicEnabled ? 'bg-blue-600/90' : 'bg-gray-600/90'} text-white backdrop-blur-sm border border-white/10`}>
                        {audioSettings.musicEnabled ? '🔊' : '🔇'} Music
                      </button>
                      <button onClick={toggleSfx} className={`p-3 rounded-full ${audioSettings.sfxEnabled ? 'bg-green-600/90' : 'bg-gray-600/90'} text-white backdrop-blur-sm border border-white/10`}>
                        {audioSettings.sfxEnabled ? '🔔' : '🔕'} SFX
                      </button>
                    </div>
                  </div>

                  <div className="text-white text-sm font-bold drop-shadow-md">
                    <p className="bg-black/40 inline-block px-3 py-1 rounded-full backdrop-blur-sm">High Score: {highScore}</p>
                    <p className="mt-4 opacity-80 uppercase tracking-widest text-[10px]">Controls: Arrows or Drag</p>
                  </div>
                </div>
              </div>
            )}

            {state === GameState.GAME_OVER && (
              <div className="text-center space-y-6 animate-in slide-in-from-bottom duration-300 p-8 z-10 bg-black/60 w-full h-full flex flex-col items-center justify-center backdrop-blur-sm">
                <h2 className="text-5xl font-black text-red-500 italic uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">Game Over</h2>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 w-full max-w-[300px]">
                  <div className="mb-4">
                    <p className="text-gray-300 text-xs uppercase tracking-widest">Reached Level</p>
                    <p className="text-4xl text-white font-black">{level}</p>
                  </div>
                  <div>
                    <p className="text-gray-300 text-xs uppercase tracking-widest">Final Score</p>
                    <p className="text-5xl text-yellow-400 font-black">{score}</p>
                  </div>
                </div>
                <div className="w-full max-w-[300px] space-y-3">
                  <button 
                    onClick={startGame}
                    className="w-full py-4 bg-white text-black font-black text-xl rounded-xl hover:bg-yellow-400 transition-colors uppercase shadow-lg"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={() => setState(GameState.MENU)}
                    className="w-full py-2 text-white/60 font-bold hover:text-white transition-colors uppercase tracking-widest text-sm"
                  >
                    Main Menu
                  </button>
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
