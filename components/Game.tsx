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
  redCandleGraceTime: number; // Grace period when touching red candle (in ms)
  lastRedCandleContact: number; // Timestamp of last red candle contact
}

const GRAVITY = 0.8;
const JUMP_FORCE = -8; // Reduced jump force for smaller, more controlled jumps
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
    redCandleGraceTime: 800, // 800ms grace period
    lastRedCandleContact: 0,
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
    if (now - lastTouchRef.current < 250) return; // Reduced delay for more responsive jumping
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
         let jumpForce = JUMP_FORCE; // Base jump force (-8)
         
         if (currentCandle && nextCandle.topY && currentCandle.topY) {
           // Calculate height difference (negative means next candle is higher)
           const heightDifference = nextCandle.topY - currentCandle.topY;
           
           // If next candle is higher, increase jump force slightly
           if (heightDifference < 0) {
             // Add minimal extra force - just enough to clear the candle
             const extraForce = Math.abs(heightDifference) * 0.15; // Reduced from 0.3 to 0.15
             jumpForce = JUMP_FORCE - extraForce; // More negative = stronger jump
             jumpForce = Math.max(jumpForce, -12); // Reduced cap from -20 to -12
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

      // Reset jumping state after animation (reduced for smaller jumps)
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isJumping: false }));
      }, 300);
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
        
        // Apply consistent gravity
        newVelocity = prev.characterVelocity + gravityForce;
        newY = prev.characterPosition.y + newVelocity;
        if (candles.length > 0) {
          // Find the closest candle horizontally
          const characterCandle = candles.find(candle => 
            Math.abs(candle.x - constrainedCharacterX) < 30 // Tighter collision detection
          );
          
          if (characterCandle && characterCandle.topY !== undefined) {
            const candleBodyTopY = characterCandle.topY;
            candleTopY = candleBodyTopY;
            
            // Simple collision detection - if character is at or below candle top
            if (newY >= candleBodyTopY - 5) {
              if (characterCandle.isGreen) {
                // Land on green candle
                newY = candleBodyTopY;
                newVelocity = 0;
                landedOnCandle = true;
                
                // Check if this is a new candle for scoring
                const newCandleIndex = candles.indexOf(characterCandle);
                if (newCandleIndex > prev.currentCandleIndex) {
                  return {
                    ...prev,
                    characterPosition: { x: constrainedCharacterX, y: newY },
                    characterVelocity: 0,
                    currentCandleIndex: newCandleIndex,
                    score: prev.score + 1,
                    cameraX: newCameraX,
                    lastRedCandleContact: 0, // Reset red candle contact
                  };
                } else {
                  // Stay on current green candle
                  return {
                    ...prev,
                    characterPosition: { x: constrainedCharacterX, y: newY },
                    characterVelocity: 0,
                    cameraX: newCameraX,
                    lastRedCandleContact: 0,
                  };
                }
              } else {
                // Red candle - start grace period or end game
                const currentTime = Date.now();
                const isInGracePeriod = prev.lastRedCandleContact > 0 && 
                                      (currentTime - prev.lastRedCandleContact) < prev.redCandleGraceTime;
                
                if (!isInGracePeriod) {
                  // Start grace period
                  return {
                    ...prev,
                    characterPosition: { x: constrainedCharacterX, y: candleBodyTopY },
                    characterVelocity: 0,
                    cameraX: newCameraX,
                    lastRedCandleContact: currentTime,
                  };
                } else {
                  // Continue grace period
                  return {
                    ...prev,
                    characterPosition: { x: constrainedCharacterX, y: candleBodyTopY },
                    characterVelocity: 0,
                    cameraX: newCameraX,
                  };
                }
              }
            }
          }
        }

        // Ground collision - game over if character hits ground
        if (!landedOnCandle && newY >= GROUND_Y) {
          return {
            ...prev,
            isDead: true,
            characterPosition: { x: constrainedCharacterX, y: GROUND_Y },
            characterVelocity: 0,
          };
        }

        // Check if grace period has expired while on red candle
        const currentTime = Date.now();
        if (prev.lastRedCandleContact > 0 && !prev.isDead && !prev.isJumping) {
          const timeSinceRedContact = currentTime - prev.lastRedCandleContact;
          if (timeSinceRedContact >= prev.redCandleGraceTime) {
            // Grace period expired - game over
            return {
              ...prev,
              isDead: true,
              characterVelocity: 0,
            };
          }
        }

        // If no collision detected and character is falling, continue falling
        // The ground collision above will handle game over

        return {
          ...prev,
          characterPosition: { x: constrainedCharacterX, y: newY },
          characterVelocity: newVelocity,
          cameraX: newCameraX,
          canLand: false,
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
      redCandleGraceTime: 800, // Reset grace period
      lastRedCandleContact: 0,
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
          <div>Velocity: {gameState.characterVelocity.toFixed(1)}</div>
          <div>Candles: {candlesRef.current.length}</div>
          <div className={gameState.lastRedCandleContact > 0 ? 'text-red-400' : ''}>
            Grace: {gameState.lastRedCandleContact > 0 ? 
              Math.max(0, gameState.redCandleGraceTime - (Date.now() - gameState.lastRedCandleContact)).toFixed(0) + 'ms' : 
              'Safe'}
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
