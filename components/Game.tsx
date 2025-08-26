'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import CryptoChart from './CryptoChart';
import Character from './Character';
import GameUI from './GameUI';
import Leaderboard from './Leaderboard';
import confetti from 'canvas-confetti';

interface GameState {
  state: 'menu' | 'playing' | 'gameOver' | 'leaderboard' | 'mysteryCandle';
  score: number;
  highScore: number;
  characterPosition: { x: number; y: number };
  characterVelocity: number;
  isDead: boolean;
  currentCandleIndex: number;
  cameraX: number; // Camera position that follows character
  redCandleGraceTime: number; // Grace period when touching red candle (in ms)
  lastRedCandleContact: number; // Timestamp of last red candle contact
  // Auto-bounce mechanics
  bounceDirection: 1 | -1; // 1 for up, -1 for down
  bounceSpeed: number; // Speed of bouncing
  // Slide controls
  horizontalVelocity: number; // Left/right movement speed
  targetX: number; // Target X position for sliding
  // Mystery candle state
  mysteryCandles: { x: number; isRed: boolean; revealed: boolean }[];
  mysteryTapCount: number;
  lastMysteryScore: number; // Last score when mystery candles appeared
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
    isDead: false,
    currentCandleIndex: 0,
    cameraX: 0, // Camera starts at 0
    redCandleGraceTime: 600, // 600ms grace period (0.6 seconds) - HARDER
    lastRedCandleContact: 0,
    // Auto-bounce mechanics
    bounceDirection: 1, // Start bouncing up
    bounceSpeed: 4, // Bounce speed
    // Slide controls
    horizontalVelocity: 0,
    targetX: 150, // Start at initial position
    // Mystery candle state
    mysteryCandles: [],
    mysteryTapCount: 0,
    lastMysteryScore: 0,
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

  // Slide control functions
  const handleSlideStart = useCallback((clientX: number) => {
    if (gameState.state !== 'playing' || gameState.isDead) return;
    
    setGameState(prev => ({
      ...prev,
      targetX: clientX + prev.cameraX, // Convert screen position to world position
    }));
  }, [gameState.state, gameState.isDead]);

  const handleSlideMove = useCallback((clientX: number) => {
    if (gameState.state !== 'playing' || gameState.isDead) return;
    
    setGameState(prev => ({
      ...prev,
      targetX: clientX + prev.cameraX, // Convert screen position to world position
    }));
  }, [gameState.state, gameState.isDead]);

  const handleSlideEnd = useCallback(() => {
    // Optional: Could add deceleration here
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState.state !== 'playing') return;

    const gameLoop = () => {
      setGameState(prev => {
        if (prev.state !== 'playing' || prev.isDead) return prev;

        // FIRST PRIORITY: Check red candle grace period expiration
        if (prev.lastRedCandleContact > 0 && !prev.isDead) {
          const currentTime = Date.now();
          const timeSinceRedContact = currentTime - prev.lastRedCandleContact;
          
          if (timeSinceRedContact >= prev.redCandleGraceTime) {
            console.log('IMMEDIATE GAME OVER: Red candle timer expired!', {
              timeSinceContact: timeSinceRedContact,
              graceTime: prev.redCandleGraceTime
            });
            return {
              ...prev,
              isDead: true,
              characterVelocity: 0,
              horizontalVelocity: 0,
            };
          }
        }

        // Auto-bounce mechanics
        let newVelocity = prev.characterVelocity;
        let newY = prev.characterPosition.y;
        let newBounceDirection = prev.bounceDirection;
        
        // Constant bouncing up and down
        if (prev.bounceDirection === 1) {
          // Moving up
          newVelocity = -prev.bounceSpeed;
          newY = prev.characterPosition.y + newVelocity;
          
          // Check if reached top of bounce
          if (newY <= getGroundY() - 120) { // Bounce height limit
            newBounceDirection = -1; // Start moving down
            newVelocity = 0;
          }
        } else {
          // Moving down
          newVelocity = prev.bounceSpeed;
          newY = prev.characterPosition.y + newVelocity;
          
          // Check if reached bottom (ground or candle)
          if (newY >= getGroundY() - 50) { // Ground level
            newBounceDirection = 1; // Start moving up
            newVelocity = 0;
            newY = getGroundY() - 50; // Snap to ground
          }
        }
        
        // Horizontal sliding movement
        let newX = prev.characterPosition.x;
        let newHorizontalVelocity = prev.horizontalVelocity;
        
        // Calculate movement towards target
        const distanceToTarget = prev.targetX - prev.characterPosition.x;
        const moveSpeed = 5; // Horizontal movement speed
        
        if (Math.abs(distanceToTarget) > 2) {
          newHorizontalVelocity = distanceToTarget > 0 ? moveSpeed : -moveSpeed;
          newX = prev.characterPosition.x + newHorizontalVelocity;
        } else {
          newHorizontalVelocity = 0;
        }

        // Get viewport dimensions (mobile-safe)
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
        
        // Update camera to follow character (Mario-style) - mobile responsive
        const screenCenter = viewportWidth / 2;
        const cameraTargetX = newX - screenCenter;
        const newCameraX = Math.max(0, cameraTargetX); // Don't go below 0

        // Simple collision detection for red candles and scoring
        const candles = candlesRef.current;
        let scoreIncrement = 0;
        
        if (candles.length > 0) {
          // Check if character is touching any candle
          const touchingCandle = candles.find(candle => 
            Math.abs(candle.x - newX) < 40 && // Horizontal collision
            Math.abs((candle.topY || getGroundY() - 50) - newY) < 30 // Vertical collision
          );
          
          if (touchingCandle) {
            // Check if it's a red candle
            if (!touchingCandle.isGreen && !touchingCandle.isMystery) {
              // Touched red candle - start grace period or game over
              const currentTime = Date.now();
              
              if (prev.lastRedCandleContact === 0) {
                // First contact with red candle - start grace period
                console.log('RED CANDLE CONTACT: Starting grace period');
                return {
                  ...prev,
                  characterPosition: { x: newX, y: newY },
                  characterVelocity: newVelocity,
                  bounceDirection: newBounceDirection,
                  horizontalVelocity: newHorizontalVelocity,
                  cameraX: newCameraX,
                  lastRedCandleContact: currentTime,
                };
              }
            } else if (touchingCandle.isGreen) {
              // Touched green candle - check for scoring
              const candleIndex = candles.indexOf(touchingCandle);
              if (candleIndex > prev.currentCandleIndex) {
                scoreIncrement = 1;
              }
            }
          }
        }

        return {
          ...prev,
          characterPosition: { x: newX, y: newY },
          characterVelocity: newVelocity,
          bounceDirection: newBounceDirection,
          horizontalVelocity: newHorizontalVelocity,
          cameraX: newCameraX,
          score: prev.score + scoreIncrement,
          currentCandleIndex: scoreIncrement > 0 ? prev.currentCandleIndex + 1 : prev.currentCandleIndex,
          lastRedCandleContact: scoreIncrement > 0 ? 0 : prev.lastRedCandleContact, // Reset red contact on scoring
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

  // Safety mechanism for mystery candle state
  useEffect(() => {
    if (gameState.state === 'mysteryCandle') {
      // Auto-return to playing after 30 seconds to prevent getting stuck
      const timeout = setTimeout(() => {
        console.log('Mystery candle timeout - returning to playing state');
        setGameState(prev => ({
          ...prev,
          state: 'playing',
          mysteryCandles: [],
          mysteryTapCount: 0,
        }));
      }, 30000);

      return () => clearTimeout(timeout);
    }
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
      isDead: false,
      currentCandleIndex: 0, // Start at first candle
      cameraX: 0,
      redCandleGraceTime: 600, // Reset grace period (0.6 seconds) - HARDER
      lastRedCandleContact: 0,
      // Reset auto-bounce mechanics
      bounceDirection: 1, // Start bouncing up
      bounceSpeed: 4, // Bounce speed
      // Reset slide controls
      horizontalVelocity: 0,
      targetX: 150, // Start at initial position
      // Reset mystery candle state
      mysteryCandles: [],
      mysteryTapCount: 0,
      lastMysteryScore: 0,
    }));
    
    // Reset the resetChart flag after a short delay
    setTimeout(() => setResetChart(false), 100);
    
    // Fix initial character position after candles are loaded
    setTimeout(() => {
      if (candlesRef.current.length > 0) {
        const firstCandle = candlesRef.current[0];
        if (firstCandle && firstCandle.topY !== undefined) {
          setGameState(prev => ({
            ...prev,
            characterPosition: { 
              x: firstCandle.x, 
              y: firstCandle.topY // Place character exactly on first candle
            }
          }));
        }
      }
    }, 200); // Wait for chart to initialize
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

  // Touch slide handlers
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (gameState.state === 'playing') {
        e.preventDefault();
        const touch = e.touches[0];
        handleSlideStart(touch.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (gameState.state === 'playing') {
        e.preventDefault();
        const touch = e.touches[0];
        handleSlideMove(touch.clientX);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameState.state === 'playing') {
        e.preventDefault();
        handleSlideEnd();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameState.state === 'playing') {
        e.preventDefault();
        handleSlideStart(e.clientX);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gameState.state === 'playing' && e.buttons === 1) { // Only if mouse is down
        e.preventDefault();
        handleSlideMove(e.clientX);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (gameState.state === 'playing') {
        e.preventDefault();
        handleSlideEnd();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleSlideStart, handleSlideMove, handleSlideEnd, gameState.state]);

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
        currentScore={gameState.score}
      />

      {/* Character */}
      {(gameState.state === 'playing' || gameState.state === 'gameOver') && (
        <Character
          position={{ 
            x: gameState.characterPosition.x - gameState.cameraX, // Adjust for camera position
            y: gameState.characterPosition.y 
          }}
          isJumping={gameState.bounceDirection === 1} // Show jumping animation when bouncing up
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
          <div>Char X: {gameState.characterPosition.x.toFixed(1)}</div>
          <div>Target X: {gameState.targetX.toFixed(1)}</div>
          <div>Camera X: {gameState.cameraX.toFixed(1)}</div>
          <div>Score: {gameState.score}</div>
          <div>Bounce Dir: {gameState.bounceDirection === 1 ? 'Up' : 'Down'}</div>
          <div>H Velocity: {gameState.horizontalVelocity.toFixed(1)}</div>
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
