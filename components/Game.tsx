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
  currentCandleIndex: number;
  cameraX: number; // Camera position that follows character
  canLand: boolean;
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
    characterPosition: { x: 150, y: GROUND_Y }, // Start at first candle position
    characterVelocity: 0,
    isJumping: false,
    isDead: false,
    currentCandleIndex: 0,
    cameraX: 0, // Camera starts at 0
    canLand: false,
  });

  const gameLoopRef = useRef<number>();
  const candlesRef = useRef<any[]>([]);
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

  // Handle candle data from chart
  const handleCandleData = useCallback((candles: any[]) => {
    candlesRef.current = candles;
  }, []);

  // Jump function
  const jump = useCallback(() => {
    const now = Date.now();
    if (now - lastTouchRef.current < 200) return; // Prevent double taps
    lastTouchRef.current = now;

    if (gameState.state === 'playing' && !gameState.isDead) {
      setGameState(prev => {
        const nextCandleX = (prev.currentCandleIndex + 1) * 60 + 150; // Calculate next candle position
        return {
          ...prev,
          characterVelocity: JUMP_FORCE,
          isJumping: true,
          characterPosition: { 
            ...prev.characterPosition, 
            x: nextCandleX // Move character to next candle position
          },
        };
      });

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
        let newCanLand = false;

        // Ground collision
        if (newY >= GROUND_Y) {
          newY = GROUND_Y;
          newVelocity = 0;
        }

        // Update camera to follow character (Mario-style)
        const screenCenter = window.innerWidth / 2;
        const cameraTargetX = prev.characterPosition.x - screenCenter;
        const newCameraX = Math.max(0, cameraTargetX); // Don't go below 0

        // Get current candles
        const candles = candlesRef.current;
        if (candles.length === 0) {
          return {
            ...prev,
            characterPosition: { ...prev.characterPosition, y: newY },
            characterVelocity: newVelocity,
            cameraX: newCameraX,
            canLand: newCanLand,
          };
        }

        // Check collision with candles when landing
        if (newY >= GROUND_Y - 10 && prev.characterVelocity >= 0 && newVelocity === 0) {
          // Find candle at character position
          const characterCandle = candles.find(candle => 
            Math.abs(candle.x - prev.characterPosition.x) < 30
          );
          
          if (characterCandle) {
            if (characterCandle.isGreen) {
              // Successful landing on green candle
              const newCandleIndex = candles.indexOf(characterCandle);
              if (newCandleIndex > prev.currentCandleIndex) {
                return {
                  ...prev,
                  characterPosition: { ...prev.characterPosition, y: GROUND_Y },
                  characterVelocity: 0,
                  currentCandleIndex: newCandleIndex,
                  score: prev.score + 1,
                  cameraX: newCameraX,
                  canLand: false,
                };
              }
            } else {
              // Landed on red candle - game over
              return {
                ...prev,
                isDead: true,
                characterVelocity: 0,
                cameraX: newCameraX,
              };
            }
          }
        }

        return {
          ...prev,
          characterPosition: { ...prev.characterPosition, y: newY },
          characterVelocity: newVelocity,
          cameraX: newCameraX,
          canLand: newCanLand,
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

  // Score is now incremented directly in the game loop when landing on green candles

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
      characterPosition: { x: 150, y: GROUND_Y }, // Start at first candle
      characterVelocity: 0,
      isJumping: false,
      isDead: false,
      currentCandleIndex: 0, // Start at first candle
      cameraX: 0,
      canLand: false,
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
        cameraX={gameState.cameraX}
        onCandleData={handleCandleData}
      />

      {/* Character */}
      {(gameState.state === 'playing' || gameState.state === 'gameOver') && (
        <Character
          position={{ 
            x: gameState.characterPosition.x - gameState.cameraX, // Adjust for camera position
            y: gameState.characterPosition.y 
          }}
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
          <div>Current Candle: {gameState.currentCandleIndex}</div>
          <div>Camera X: {gameState.cameraX.toFixed(1)}</div>
          <div>Char World X: {gameState.characterPosition.x.toFixed(1)}</div>
          <div>Can Land: {gameState.canLand ? 'Yes' : 'No'}</div>
          <div>Score: {gameState.score}</div>
        </div>
      )}
    </div>
  );
};

export default Game;
