
import React, { useRef, useEffect, useCallback } from 'react';
import { 
  GameState, 
  GameAssets, 
  Player, 
  Villain 
} from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_SIZE, 
  VILLAIN_BASE_SIZE, 
  EATS_PER_LEVEL 
} from '../constants';

interface GameEngineProps {
  state: GameState;
  assets: GameAssets;
  level: number;
  lives: number;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
  setLives: React.Dispatch<React.SetStateAction<number>>;
  onEat: () => void;
  onGameOver: (score: number, level: number) => void;
}

const GameEngine: React.FC<GameEngineProps> = ({ 
  state, 
  assets, 
  level, 
  lives, 
  score, 
  setScore, 
  setLevel, 
  setLives, 
  onEat, 
  onGameOver 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2,
    y: CANVAS_HEIGHT - PLAYER_SIZE - 40,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    speed: 10
  });

  const villainsRef = useRef<Villain[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const requestRef = useRef<number>();
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const levelRef = useRef(level);

  // Sync refs to state values
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { levelRef.current = level; }, [level]);

  // Spawn Villain Logic
  const spawnVillain = useCallback(() => {
    // Difficulty scaling
    const baseSpeed = 3 + (levelRef.current * 0.15);
    const speedVar = Math.random() * (levelRef.current * 0.05);
    const size = VILLAIN_BASE_SIZE + (Math.random() * 10 - 5);
    
    return {
      id: Math.random(),
      x: Math.random() * (CANVAS_WIDTH - size),
      y: -size - (Math.random() * 200),
      width: size,
      height: size,
      speed: baseSpeed + speedVar,
      imageIndex: Math.floor(Math.random() * assets.villains.length)
    };
  }, [assets.villains.length]);

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key.toLowerCase() === 'p' && state === GameState.PLAYING) {
        // Simple pause could be added here if needed
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current[e.key] = false;

    const handleTouch = (e: TouchEvent) => {
      if (state !== GameState.PLAYING) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const touchX = e.touches[0].clientX - rect.left;
      const scaleX = CANVAS_WIDTH / rect.width;
      const targetX = touchX * scaleX - playerRef.current.width / 2;
      playerRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - playerRef.current.width, targetX));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchmove', handleTouch, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchmove', handleTouch);
    };
  }, [state]);

  const update = () => {
    if (state !== GameState.PLAYING) return;

    // Player Horizontal Movement (Desktop)
    if (keysRef.current['ArrowLeft']) {
      playerRef.current.x -= playerRef.current.speed;
    }
    if (keysRef.current['ArrowRight']) {
      playerRef.current.x += playerRef.current.speed;
    }
    // Clamp Player
    playerRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - playerRef.current.width, playerRef.current.x));

    // Update Villains
    const villainCount = Math.min(3 + Math.floor(levelRef.current / 5), 15);
    while (villainsRef.current.length < villainCount) {
      villainsRef.current.push(spawnVillain());
    }

    const nextVillains: Villain[] = [];
    villainsRef.current.forEach(v => {
      v.y += v.speed;

      // Collision Detection (Box-to-Box)
      const p = playerRef.current;
      const padding = 10; // More forgiving collision
      if (
        p.x + padding < v.x + v.width - padding &&
        p.x + p.width - padding > v.x + padding &&
        p.y + padding < v.y + v.height - padding &&
        p.y + p.height - padding > v.y + padding
      ) {
        // EATEN!
        onEat();
        setScore(prev => {
          const newScore = prev + 1;
          if (newScore % EATS_PER_LEVEL === 0) {
            setLevel(l => l + 1);
          }
          return newScore;
        });
        nextVillains.push(spawnVillain());
      } else if (v.y > CANVAS_HEIGHT) {
        // REACHED BOTTOM (Missed)
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            onGameOver(scoreRef.current, levelRef.current);
          }
          return newLives;
        });
        nextVillains.push(spawnVillain());
      } else {
        nextVillains.push(v);
      }
    });
    villainsRef.current = nextVillains;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Background
    if (assets.bg) {
      ctx.drawImage(assets.bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Draw Player
    if (state === GameState.PLAYING) {
      const p = playerRef.current;
      ctx.drawImage(assets.hero, p.x, p.y, p.width, p.height);

      // Draw Villains
      villainsRef.current.forEach(v => {
        const img = assets.villains[v.imageIndex];
        if (img) {
          ctx.drawImage(img, v.x, v.y, v.width, v.height);
        }
      });
    }
  };

  const loop = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      update();
      draw(ctx);
    }
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, assets]);

  // Reset villains when state changes to playing from others
  useEffect(() => {
    if (state === GameState.PLAYING) {
      villainsRef.current = [];
      playerRef.current.x = CANVAS_WIDTH / 2 - PLAYER_SIZE / 2;
    }
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full h-full"
    />
  );
};

export default GameEngine;
