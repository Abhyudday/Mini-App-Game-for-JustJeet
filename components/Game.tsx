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
  characterVelocity: number; // Vertical velocity for flappy bird physics
  isDead: boolean;
  cameraX: number; // Camera position that follows character
  gameSpeed: number; // Horizontal movement speed
}

const GRAVITY = 0.5; // Flappy bird gravity
const JUMP_FORCE = -8; // Jump force for flappy bird
const GAME_SPEED = 3; // Horizontal movement speed
const MAX_FALL_SPEED = 12; // Maximum falling speed
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
    characterPosition: { x: 100, y: 200 }, // Start at a fixed safe position
    characterVelocity: 0,
    isDead: false,
    cameraX: 0,
    gameSpeed: GAME_SPEED,
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

  // Flappy Bird jump function
  const jump = useCallback(() => {
    const now = Date.now();
    if (now - lastTouchRef.current < 150) return; // Prevent too rapid tapping
    lastTouchRef.current = now;

    if (gameState.state === 'playing' && !gameState.isDead) {
      setGameState(prev => ({
        ...prev,
        characterVelocity: JUMP_FORCE, // Apply upward force
      }));
    }
  }, [gameState.state, gameState.isDead]);

  // Flappy Bird game loop
  useEffect(() => {
    if (gameState.state !== 'playing') return;

    const gameLoop = () => {
      setGameState(prev => {
        if (prev.state !== 'playing' || prev.isDead) return prev;

        // Debug first few frames
        if (prev.score === 0 && Math.random() < 0.01) {
          console.log('Game state:', {
            position: prev.characterPosition,
            velocity: prev.characterVelocity,
            candleCount: candlesRef.current.length,
            firstCandle: candlesRef.current[0]
          });
        }

        // Apply gravity and update velocity
        let newVelocity = prev.characterVelocity + GRAVITY;
        // Cap falling speed
        if (newVelocity > MAX_FALL_SPEED) {
          newVelocity = MAX_FALL_SPEED;
        }

        // Update position
        const newY = prev.characterPosition.y + newVelocity;
        const newX = prev.characterPosition.x + prev.gameSpeed; // Move forward continuously

        // Get viewport dimensions
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
        const GROUND_Y = getGroundY();

        // Check ground collision
        if (newY >= GROUND_Y) {
          console.log('Game over - hit ground:', { y: newY, groundY: GROUND_Y });
          return {
            ...prev,
            isDead: true,
            characterPosition: { x: newX, y: GROUND_Y },
            characterVelocity: 0,
          };
        }

        // Check ceiling collision
        if (newY <= 0) {
          console.log('Game over - hit ceiling:', { y: newY });
          return {
            ...prev,
            isDead: true,
            characterPosition: { x: newX, y: 0 },
            characterVelocity: 0,
          };
        }

        // Update camera to follow character
        const screenCenter = viewportWidth / 2;
        const cameraTargetX = newX - screenCenter;
        const newCameraX = Math.max(0, cameraTargetX);

        // Check candle collisions
        const candles = candlesRef.current;
        let newScore = prev.score;

        if (candles.length > 0) {
          // Character collision box (smaller for more precise collision)
          const characterWidth = 20;
          const characterHeight = 20;
          const characterLeft = newX - characterWidth / 2;
          const characterRight = newX + characterWidth / 2;
          const characterTop = newY - characterHeight / 2;
          const characterBottom = newY + characterHeight / 2;

          for (let candle of candles) {
            if (!candle.topY || !candle.bottomY) continue;

            // Only check collision with red candles (green candles are passable)
            if (!candle.isGreen) {
              // Candle collision box
              const candleWidth = 25;
              const candleLeft = candle.x;
              const candleRight = candle.x + candleWidth;
              const candleTop = candle.topY;
              const candleBottom = candle.bottomY;

              // Check if character is colliding with this red candle
              const isColliding = characterRight > candleLeft && 
                                characterLeft < candleRight && 
                                characterBottom > candleTop && 
                                characterTop < candleBottom;

              if (isColliding) {
                // Hit red candle - game over
                console.log('Game over - hit red candle:', {
                  characterPos: { x: newX, y: newY },
                  candlePos: { x: candle.x, y: candle.topY },
                  candleColor: 'red'
                });
                return {
                  ...prev,
                  isDead: true,
                  characterPosition: { x: newX, y: newY },
                  characterVelocity: newVelocity,
                };
              }
            }

            // Check if character has passed this candle for scoring
            if (candle.x < newX - characterWidth && !candle.scored) {
              candle.scored = true; // Mark as scored to prevent double counting
              newScore++;
            }
          }
        }

        return {
          ...prev,
          characterPosition: { x: newX, y: newY },
          characterVelocity: newVelocity,
          cameraX: newCameraX,
          score: newScore,
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
      characterPosition: { x: 100, y: 200 }, // Start at a fixed safe position
      characterVelocity: 0,
      isDead: false,
      cameraX: 0,
      gameSpeed: GAME_SPEED,
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
        currentScore={gameState.score}
      />

      {/* Character */}
      {(gameState.state === 'playing' || gameState.state === 'gameOver') && (
        <Character
          position={{ 
            x: gameState.characterPosition.x - gameState.cameraX, // Adjust for camera position
            y: gameState.characterPosition.y 
          }}
          isJumping={gameState.characterVelocity < 0} // Show jumping when moving upward
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
          <div>Camera X: {gameState.cameraX.toFixed(1)}</div>
          <div>Velocity: {gameState.characterVelocity.toFixed(1)}</div>
          <div>Score: {gameState.score}</div>
          <div>Game Speed: {gameState.gameSpeed}</div>
          <div>Candles: {candlesRef.current.length}</div>
          <div>Dead: {gameState.isDead ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default Game;
