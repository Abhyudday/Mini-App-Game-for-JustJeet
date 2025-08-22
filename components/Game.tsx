'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import CryptoChart from './CryptoChart';
import Character from './Character';
import GameUI from './GameUI';
import Leaderboard from './Leaderboard';
import confetti from 'canvas-confetti';

interface GameState {
  state: 'menu' | 'playing' | 'gameOver' | 'leaderboard';
  score: number;
  highScore: number;
  characterPosition: { x: number; y: number };
  characterVelocity: number;
  isJumping: boolean;
  isDead: boolean;
  redLineY: number;
  chartSpeed: number;
}

const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const GROUND_Y = 400;
const CHARACTER_X = 100;

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    state: 'menu',
    score: 0,
    highScore: 0,
    characterPosition: { x: CHARACTER_X, y: GROUND_Y },
    characterVelocity: 0,
    isJumping: false,
    isDead: false,
    redLineY: GROUND_Y,
    chartSpeed: 0.5,
  });

  const gameLoopRef = useRef<number>();
  const scoreIntervalRef = useRef<NodeJS.Timeout>();
  const lastTouchRef = useRef<number>(0);

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('cryptoJumpHighScore');
    if (savedHighScore) {
      setGameState(prev => ({ ...prev, highScore: parseInt(savedHighScore) }));
    }
  }, []);

  // Save high score to localStorage
  const saveHighScore = useCallback((score: number) => {
    localStorage.setItem('cryptoJumpHighScore', score.toString());
  }, []);

  // Handle red line position updates from chart
  const handleRedLinePosition = useCallback((y: number) => {
    setGameState(prev => ({ ...prev, redLineY: y }));
  }, []);

  // Jump function
  const jump = useCallback(() => {
    const now = Date.now();
    if (now - lastTouchRef.current < 200) return; // Prevent double taps
    lastTouchRef.current = now;

    if (gameState.state === 'playing' && !gameState.isDead) {
      setGameState(prev => ({
        ...prev,
        characterVelocity: JUMP_FORCE,
        isJumping: true,
      }));

      // Reset jumping state after animation
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isJumping: false }));
      }, 300);
    }
  }, [gameState.state, gameState.isDead]);

  // Game loop
  useEffect(() => {
    if (gameState.state !== 'playing') return;

    const gameLoop = () => {
      setGameState(prev => {
        if (prev.state !== 'playing' || prev.isDead) return prev;

        let newVelocity = prev.characterVelocity + GRAVITY;
        let newY = prev.characterPosition.y + newVelocity;

        // Ground collision
        if (newY >= GROUND_Y) {
          newY = GROUND_Y;
          newVelocity = 0;
        }

        // Red candle collision detection - check if character touches any red area
        const characterBottom = newY;
        const characterTop = newY - 50;
        const characterLeft = prev.characterPosition.x - 25;
        const characterRight = prev.characterPosition.x + 25;
        const redLineBuffer = 15;

        // More lenient collision detection - character just needs to overlap with red line area
        const isColliding = 
          characterBottom >= prev.redLineY - redLineBuffer &&
          characterTop <= prev.redLineY + redLineBuffer;

        if (isColliding && !prev.isDead) {
          // Game over
          return {
            ...prev,
            isDead: true,
            characterVelocity: 0,
          };
        }

        // Increase chart speed gradually (slower progression)
        const newChartSpeed = Math.min(prev.chartSpeed + 0.0005, 1.5);

        return {
          ...prev,
          characterPosition: { ...prev.characterPosition, y: newY },
          characterVelocity: newVelocity,
          chartSpeed: newChartSpeed,
        };
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.state]);

  // Score increment
  useEffect(() => {
    if (gameState.state !== 'playing' || gameState.isDead) {
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
        scoreIntervalRef.current = undefined;
      }
      return;
    }

    scoreIntervalRef.current = setInterval(() => {
      setGameState(prev => ({ ...prev, score: prev.score + 1 }));
    }, 100);

    return () => {
      if (scoreIntervalRef.current) {
        clearInterval(scoreIntervalRef.current);
        scoreIntervalRef.current = undefined;
      }
    };
  }, [gameState.state, gameState.isDead]);

  // Handle game over
  useEffect(() => {
    if (gameState.isDead && gameState.state === 'playing') {
      setTimeout(() => {
        const isNewHighScore = gameState.score > gameState.highScore;
        if (isNewHighScore) {
          saveHighScore(gameState.score);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
        
        setGameState(prev => ({
          ...prev,
          state: 'gameOver',
          highScore: Math.max(prev.score, prev.highScore),
        }));
      }, 1000);
    }
  }, [gameState.isDead, gameState.state, gameState.score, gameState.highScore, saveHighScore]);

  // Event handlers
  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      state: 'playing',
      score: 0,
      characterPosition: { x: CHARACTER_X, y: GROUND_Y },
      characterVelocity: 0,
      isJumping: false,
      isDead: false,
      chartSpeed: 0.5,
    }));
  }, []);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  const showLeaderboard = useCallback(() => {
    setGameState(prev => ({ ...prev, state: 'leaderboard' }));
  }, []);

  const backToMenu = useCallback(() => {
    setGameState(prev => ({ ...prev, state: 'menu' }));
  }, []);

  // Touch and click handlers
  useEffect(() => {
    const handleInteraction = (e: Event) => {
      e.preventDefault();
      jump();
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        jump();
      }
    };

    document.addEventListener('touchstart', handleInteraction, { passive: false });
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [jump]);

  // Prevent scrolling and zooming
  useEffect(() => {
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.addEventListener('gesturestart', preventDefault);
    document.addEventListener('gesturechange', preventDefault);
    document.addEventListener('gestureend', preventDefault);

    return () => {
      document.removeEventListener('touchmove', preventDefault);
      document.removeEventListener('gesturestart', preventDefault);
      document.removeEventListener('gesturechange', preventDefault);
      document.removeEventListener('gestureend', preventDefault);
    };
  }, []);

  return (
    <div className="game-container">
      {/* Background Chart */}
      <CryptoChart 
        chartSpeed={gameState.chartSpeed} 
        onRedLinePosition={handleRedLinePosition}
      />

      {/* Character */}
      {(gameState.state === 'playing' || gameState.state === 'gameOver') && (
        <Character
          position={gameState.characterPosition}
          isJumping={gameState.isJumping}
          isDead={gameState.isDead}
        />
      )}

      {/* Game UI */}
      {gameState.state !== 'leaderboard' && (
        <GameUI
          score={gameState.score}
          highScore={gameState.highScore}
          gameState={gameState.state}
          onStartGame={startGame}
          onRestartGame={restartGame}
          onShowLeaderboard={showLeaderboard}
        />
      )}

      {/* Leaderboard */}
      {gameState.state === 'leaderboard' && (
        <Leaderboard
          currentScore={gameState.score}
          onBack={backToMenu}
        />
      )}

      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && gameState.state === 'playing' && (
        <div className="absolute top-4 right-4 bg-black/70 p-2 rounded text-white text-xs" style={{ zIndex: 30 }}>
          <div>Char Y: {gameState.characterPosition.y.toFixed(1)}</div>
          <div>Red Line: {gameState.redLineY.toFixed(1)}</div>
          <div>Speed: {gameState.chartSpeed.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
};

export default Game;
