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
const getGroundY = () => {
  if (typeof window === 'undefined') return 400;
  // Make ground position responsive - use 70% of screen height for mobile compatibility
  return Math.max(300, window.innerHeight * 0.7);
};
const CHARACTER_X = 100;

const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    state: 'menu',
    score: 0,
    highScore: 0,
    characterPosition: { x: 150, y: getGroundY() - 50 }, // Start on first candle body top
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
        const GROUND_Y = getGroundY();
        let candleTopY = GROUND_Y;

        // Get viewport dimensions (mobile-safe)
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
        
        // Update camera to follow character (Mario-style) - mobile responsive
        const screenCenter = viewportWidth / 2;
        const cameraTargetX = prev.characterPosition.x - screenCenter;
        const newCameraX = Math.max(0, cameraTargetX); // Don't go below 0

        // Constrain character to screen bounds - mobile responsive padding
        const leftPadding = Math.max(30, viewportWidth * 0.05); // 5% of screen width or minimum 30px
        const rightPadding = Math.max(50, viewportWidth * 0.1); // 10% of screen width or minimum 50px
        const screenLeftBound = newCameraX + leftPadding;
        const screenRightBound = newCameraX + viewportWidth - rightPadding;
        const constrainedCharacterX = Math.max(screenLeftBound, Math.min(screenRightBound, prev.characterPosition.x));

        // Get current candles
        const candles = candlesRef.current;
        
        // Reduce gravity when approaching a candle for controlled landing
        const nearCandle = candles.find(candle => 
          Math.abs(candle.x - prev.characterPosition.x) < 35
        );
        if (nearCandle && prev.characterVelocity > 0 && prev.characterPosition.y > GROUND_Y - 60) {
          const candleTopY = nearCandle.topY || (GROUND_Y - 50);
          const distanceToCandle = Math.abs(prev.characterPosition.y - candleTopY);
          
          // More gentle gravity reduction for smaller jumps
          if (distanceToCandle < 15) {
            gravityForce = GRAVITY * 0.6; // Less aggressive reduction
          } else if (distanceToCandle < 30) {
            gravityForce = GRAVITY * 0.8; // Mild reduction when approaching
          }
          
          // Recalculate velocity with adjusted gravity
          newVelocity = prev.characterVelocity + gravityForce;
          newY = prev.characterPosition.y + newVelocity;
        }
        if (candles.length > 0) {
          // Check for candle collision (character standing on candle) - mobile responsive tolerance
          const collisionTolerance = Math.max(35, Math.min(50, viewportWidth * 0.06)); // Scale with screen width
          const characterCandle = candles.find(candle => 
            Math.abs(candle.x - constrainedCharacterX) < collisionTolerance
          );
          
          if (characterCandle) {
            // Use the actual visual candle top position if available, otherwise fallback
            const candleBodyTopY = characterCandle.topY !== undefined ? characterCandle.topY : (GROUND_Y - 50);
            candleTopY = candleBodyTopY;
            
            // Mobile-responsive collision detection for better landing
            const characterBottom = newY;
            const landingTolerance = Math.max(8, Math.min(15, viewportHeight * 0.02)); // Scale with screen height
            const fallTolerance = Math.max(12, Math.min(25, viewportHeight * 0.03)); // Scale with screen height
            const isOnCandle = Math.abs(characterBottom - candleBodyTopY) < landingTolerance;
            const isFallingOntoCandle = prev.characterVelocity >= 0 && 
              characterBottom >= candleBodyTopY - landingTolerance && 
              characterBottom <= candleBodyTopY + fallTolerance;
            
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
                    lastRedCandleContact: 0, // Reset red candle contact when landing on green
                  };
                } else {
                  // Already on this candle, maintain exact position
                  return {
                    ...prev,
                    characterPosition: { ...prev.characterPosition, y: candleBodyTopY },
                    characterVelocity: 0,
                    cameraX: newCameraX,
                    canLand: false,
                    lastRedCandleContact: 0, // Reset red candle contact when on green candle
                  };
                }
                              } else {
                  // Landed on red candle - start grace period
                  const currentTime = Date.now();
                  const isInGracePeriod = (currentTime - prev.lastRedCandleContact) < prev.redCandleGraceTime;
                  
                  if (prev.lastRedCandleContact === 0 || !isInGracePeriod) {
                    // First contact with red candle or grace period expired - start/restart grace period
                    return {
                      ...prev,
                      characterPosition: { x: constrainedCharacterX, y: newY },
                      characterVelocity: newVelocity,
                      cameraX: newCameraX,
                      lastRedCandleContact: currentTime, // Mark the start of grace period
                      canLand: newCanLand,
                    };
                  } else {
                    // Still in grace period - allow character to stay on red candle
                    return {
                      ...prev,
                      characterPosition: { x: constrainedCharacterX, y: candleBodyTopY },
                      characterVelocity: 0,
                      cameraX: newCameraX,
                      canLand: false,
                    };
                  }
                }
            }
          }
        }

        // Ground collision (fallback if not landed on candle)
        if (!landedOnCandle && newY >= GROUND_Y) {
          newY = GROUND_Y;
          newVelocity = 0;
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

        // Additional safety check - if character is floating with no velocity, snap to ground or nearest candle
        if (!landedOnCandle && Math.abs(newVelocity) < 0.1 && newY < GROUND_Y - 10) {
          // Find the closest candle below the character - mobile responsive search radius
          const searchRadius = Math.max(40, Math.min(60, viewportWidth * 0.08)); // Scale with screen width
          const candidateCandles = candles.filter(candle => 
            Math.abs(candle.x - constrainedCharacterX) < searchRadius && 
            candle.topY !== undefined && 
            candle.topY >= newY - 20
          );
          
          if (candidateCandles.length > 0) {
            const closestCandle = candidateCandles.reduce((closest, candle) => 
              Math.abs(candle.x - constrainedCharacterX) < Math.abs(closest.x - constrainedCharacterX) ? candle : closest
            );
            
            if (closestCandle.isGreen && closestCandle.topY !== undefined) {
              newY = closestCandle.topY;
              newVelocity = 0;
              landedOnCandle = true;
            }
          } else {
            // No suitable candle found, fall to ground
            newY = GROUND_Y;
            newVelocity = 0;
          }
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
      characterPosition: { x: 150, y: getGroundY() - 50 }, // Start on first candle body top
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
