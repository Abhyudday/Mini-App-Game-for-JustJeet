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
const JUMP_FORCE = -12; // Reduced jump force for controlled landing
const GROUND_Y = 400;
const CHARACTER_X = 100;

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    state: 'menu',
    score: 0,
    highScore: 0,
    characterPosition: { x: 150, y: GROUND_Y - 50 }, // Start on first candle body top
    characterVelocity: 0,
    isJumping: false,
    isDead: false,
    currentCandleIndex: 0,
    cameraX: 0, // Camera starts at 0
    canLand: false,
  });

  const [resetChart, setResetChart] = useState(false);

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
    if (now - lastTouchRef.current < 300) return; // Prevent rapid taps
    lastTouchRef.current = now;

    if (gameState.state === 'playing' && !gameState.isDead && !gameState.isJumping) {
      setGameState(prev => {
        // Find the next candle position
        const candles = candlesRef.current;
        if (candles.length === 0) return prev;
        
        // Find current candle (where character is standing)
        const currentCandle = candles.find(candle => 
          Math.abs(candle.x - prev.characterPosition.x) < 35
        );
        
        // Find next candle after current position
        const nextCandle = candles.find(candle => candle.x > prev.characterPosition.x);
        if (!nextCandle) return prev;
        
        // Calculate adaptive jump force based on height difference
        let jumpForce = JUMP_FORCE; // Base jump force (-12)
        
        if (currentCandle && nextCandle.topY && currentCandle.topY) {
          // Calculate height difference (negative means next candle is higher)
          const heightDifference = nextCandle.topY - currentCandle.topY;
          
          // If next candle is higher, increase jump force
          if (heightDifference < 0) {
            // Add extra force proportional to height difference
            const extraForce = Math.abs(heightDifference) * 0.3; // Adjust multiplier as needed
            jumpForce = JUMP_FORCE - extraForce; // More negative = stronger jump
            jumpForce = Math.max(jumpForce, -20); // Cap maximum jump force
          }
        }
        
        return {
          ...prev,
          characterVelocity: jumpForce,
          isJumping: true,
          characterPosition: { 
            ...prev.characterPosition, 
            x: nextCandle.x // Jump directly to next candle position
          },
        };
      });

      // Reset jumping state after animation
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isJumping: false }));
      }, 400);
    }
  }, [gameState.state, gameState.isDead, gameState.isJumping]);

  // Game loop
  useEffect(() => {
    if (gameState.state !== 'playing') return;

    const gameLoop = () => {
      setGameState(prev => {
        if (prev.state !== 'playing' || prev.isDead) return prev;

        // Apply gravity with slight adjustment for better landing control
        let gravityForce = GRAVITY;
        
        let newVelocity = prev.characterVelocity + gravityForce;
        let newY = prev.characterPosition.y + newVelocity;
        let newCanLand = false;
        let landedOnCandle = false;
        let candleTopY = GROUND_Y;

        // Update camera to follow character (Mario-style)
        const screenCenter = window.innerWidth / 2;
        const cameraTargetX = prev.characterPosition.x - screenCenter;
        const newCameraX = Math.max(0, cameraTargetX); // Don't go below 0

        // Constrain character to screen bounds
        const screenLeftBound = newCameraX + 50; // Leave some padding from left edge
        const screenRightBound = newCameraX + window.innerWidth - 100; // Leave padding from right edge
        const constrainedCharacterX = Math.max(screenLeftBound, Math.min(screenRightBound, prev.characterPosition.x));

        // Get current candles
        const candles = candlesRef.current;
        
        // Reduce gravity when approaching a candle for controlled landing
        const nearCandle = candles.find(candle => 
          Math.abs(candle.x - prev.characterPosition.x) < 35
        );
        if (nearCandle && prev.characterVelocity > 0 && prev.characterPosition.y > GROUND_Y - 70) {
          const candleTopY = GROUND_Y - 50;
          const distanceToCandle = Math.abs(prev.characterPosition.y - candleTopY);
          
          // Gradually reduce gravity as we get closer to the candle
          if (distanceToCandle < 20) {
            gravityForce = GRAVITY * 0.5; // Strong reduction when very close
          } else if (distanceToCandle < 40) {
            gravityForce = GRAVITY * 0.7; // Moderate reduction when approaching
          }
          
          // Recalculate velocity with adjusted gravity
          newVelocity = prev.characterVelocity + gravityForce;
          newY = prev.characterPosition.y + newVelocity;
        }
        if (candles.length > 0) {
          // Check for candle collision (character standing on candle)
          const characterCandle = candles.find(candle => 
            Math.abs(candle.x - prev.characterPosition.x) < 35
          );
          
          if (characterCandle) {
            // Use the actual visual candle top position if available, otherwise fallback
            const candleBodyTopY = characterCandle.topY || (GROUND_Y - 50);
            candleTopY = candleBodyTopY;
            
            // More precise collision detection - check if character is on or very close to candle
            const characterBottom = newY;
            const isOnCandle = Math.abs(characterBottom - candleBodyTopY) < 5;
            const isFallingOntoCandle = prev.characterVelocity >= 0 && characterBottom >= candleBodyTopY - 5 && characterBottom <= candleBodyTopY + 10;
            
            if (isOnCandle || isFallingOntoCandle) {
              if (characterCandle.isGreen) {
                // Snap to exact candle top position
                newY = candleBodyTopY;
                newVelocity = 0;
                landedOnCandle = true;
                
                // Check if this is a new candle for scoring
                const newCandleIndex = candles.indexOf(characterCandle);
                if (newCandleIndex > prev.currentCandleIndex) {
                  return {
                    ...prev,
                    characterPosition: { ...prev.characterPosition, y: newY },
                    characterVelocity: 0,
                    currentCandleIndex: newCandleIndex,
                    score: prev.score + 1,
                    cameraX: newCameraX,
                    canLand: false,
                  };
                } else {
                  // Already on this candle, maintain exact position
                  return {
                    ...prev,
                    characterPosition: { ...prev.characterPosition, y: candleBodyTopY },
                    characterVelocity: 0,
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
        }

        // Ground collision (only if not landed on candle)
        if (!landedOnCandle && newY >= GROUND_Y) {
          newY = GROUND_Y;
          newVelocity = 0;
        }

        return {
          ...prev,
          characterPosition: { x: constrainedCharacterX, y: newY },
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
    // Only reset chart if it's the very first game or if requested
    setResetChart(candlesRef.current.length === 0);
    
    setGameState(prev => ({
      ...prev,
      state: 'playing',
      score: 0,
      characterPosition: { x: 150, y: GROUND_Y - 50 }, // Start on first candle body top
      characterVelocity: 0,
      isJumping: false,
      isDead: false,
      currentCandleIndex: 0, // Start at first candle
      cameraX: 0,
      canLand: false,
    }));
    
    // Reset the resetChart flag after a short delay
    setTimeout(() => setResetChart(false), 100);
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
      if (gameState.state === 'playing') {
        e.preventDefault();
        e.stopPropagation();
        jump();
      }
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
        resetChart={resetChart}
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
