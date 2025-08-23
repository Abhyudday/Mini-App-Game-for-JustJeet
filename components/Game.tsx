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
  jumpStartX: number; // Starting X position for jump animation
  jumpTargetX: number; // Target X position for jump animation
  jumpProgress: number; // Jump animation progress (0 to 1)
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
    redCandleGraceTime: 500, // 500ms grace period (0.5 seconds)
    lastRedCandleContact: 0,
    jumpStartX: 150,
    jumpTargetX: 150,
    jumpProgress: 1, // Not jumping initially
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
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('Jump attempt:', {
            characterX: prev.characterPosition.x,
            candlesCount: candles.length,
            nextCandle: nextCandle ? { x: nextCandle.x, topY: nextCandle.topY } : null
          });
        }
        
        if (!nextCandle) {
          console.warn('No next candle found for jump');
          return prev;
        }
        
         // Calculate adaptive jump force based on height difference
         let jumpForce = JUMP_FORCE; // Base jump force (-8)
         
         if (currentCandle && nextCandle.topY !== undefined && currentCandle.topY !== undefined) {
           // Calculate height difference (negative means next candle is higher)
           const heightDifference = nextCandle.topY - currentCandle.topY;
           
           if (heightDifference < 0) {
             // Next candle is higher - calculate required force
             const requiredHeight = Math.abs(heightDifference) + 30; // Extra clearance
             
             // Safety check to prevent invalid calculations
             if (requiredHeight > 0 && GRAVITY > 0) {
               const calculatedForce = -Math.sqrt(2 * GRAVITY * requiredHeight);
               
               // Validate the calculated force
               if (!isNaN(calculatedForce) && isFinite(calculatedForce)) {
                 jumpForce = Math.max(calculatedForce, -30); // Cap at -30 for very tall candles
               }
             }
           }
           
           // Ensure jump force is always valid
           if (isNaN(jumpForce) || !isFinite(jumpForce)) {
             console.warn('Invalid jump force calculated, using default:', jumpForce);
             jumpForce = JUMP_FORCE;
           }
           
           // Debug logging for development
           if (process.env.NODE_ENV === 'development') {
             console.log('Jump calculation:', {
               heightDifference,
               jumpForce,
               currentCandleY: currentCandle.topY,
               nextCandleY: nextCandle.topY
             });
           }
         }
        
        // Final safety check - ensure we have a valid jump force
        const finalJumpForce = (jumpForce && isFinite(jumpForce) && jumpForce < 0) ? jumpForce : JUMP_FORCE;
        
        // Debug the jump setup
        if (process.env.NODE_ENV === 'development') {
          console.log('Jump setup:', {
            startX: prev.characterPosition.x,
            targetX: nextCandle.x,
            distance: nextCandle.x - prev.characterPosition.x,
            jumpForce: finalJumpForce
          });
        }
        
        return {
          ...prev,
          characterVelocity: finalJumpForce,
          isJumping: true,
          characterPosition: { 
            ...prev.characterPosition, 
            x: nextCandle.x // Immediately move to next candle position
          },
          jumpStartX: prev.characterPosition.x, // Store starting position for reference
          jumpTargetX: nextCandle.x, // Store target position for reference
          jumpProgress: 0, // Start animation
        };
      });

      // Reset jumping state after animation
      setTimeout(() => {
        setGameState(prev => ({ 
          ...prev, 
          isJumping: false
        }));
      }, 400); // Shorter duration for simpler jump
    }
  }, [gameState.state, gameState.isDead, gameState.isJumping]);

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
            };
          }
        }

        // Apply gravity with slight adjustment for better landing control
        let gravityForce = GRAVITY;
        
        let newVelocity = prev.characterVelocity + gravityForce;
        let newY = prev.characterPosition.y + newVelocity;
        let newCanLand = false;
        let landedOnCandle = false;
        const GROUND_Y = getGroundY();
        let candleTopY = GROUND_Y;
        
        // Character position is now set directly in jump function
        let newX = prev.characterPosition.x;

        // Get viewport dimensions (mobile-safe)
        const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
        const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
        
        // Update camera to follow character (Mario-style) - mobile responsive
        const screenCenter = viewportWidth / 2;
        const cameraTargetX = newX - screenCenter;
        const newCameraX = Math.max(0, cameraTargetX); // Don't go below 0

        // Constrain character to screen bounds - mobile responsive padding
        const leftPadding = Math.max(30, viewportWidth * 0.05); // 5% of screen width or minimum 30px
        const rightPadding = Math.max(50, viewportWidth * 0.1); // 10% of screen width or minimum 50px
        const screenLeftBound = newCameraX + leftPadding;
        const screenRightBound = newCameraX + viewportWidth - rightPadding;
        const constrainedCharacterX = Math.max(screenLeftBound, Math.min(screenRightBound, newX));

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
          
          // Debug collision detection
          if (process.env.NODE_ENV === 'development' && prev.isJumping && Math.random() < 0.05) {
            console.log('Collision check:', {
              characterX: constrainedCharacterX,
              candidateCandles: candles.filter(c => Math.abs(c.x - constrainedCharacterX) < collisionTolerance + 20).map(c => ({x: c.x, distance: Math.abs(c.x - constrainedCharacterX)})),
              foundCandle: characterCandle ? { x: characterCandle.x, distance: Math.abs(characterCandle.x - constrainedCharacterX) } : null
            });
          }
          
          if (characterCandle) {
            // Use the actual visual candle top position if available, otherwise fallback
            const candleBodyTopY = characterCandle.topY !== undefined ? characterCandle.topY : (GROUND_Y - 50);
            candleTopY = candleBodyTopY;
            
            // Mobile-responsive collision detection for better landing
            const characterBottom = newY;
            const landingTolerance = Math.max(15, Math.min(25, viewportHeight * 0.03)); // Increased tolerance
            
            // Character should land on candle if falling and within horizontal range
            const isAboveCandle = characterBottom <= candleBodyTopY + landingTolerance;
            const isFallingOntoCandle = prev.characterVelocity >= 0 && 
              characterBottom >= candleBodyTopY - 10 && 
              characterBottom <= candleBodyTopY + landingTolerance;
            
            // Always snap to candle top if character is near it
            const shouldLandOnCandle = isFallingOntoCandle || (isAboveCandle && Math.abs(characterBottom - candleBodyTopY) < landingTolerance);
            
            if (shouldLandOnCandle) {
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
                  // Landed on red candle - handle grace period
                  const currentTime = Date.now();
                  
                  // Always allow character to land on red candle first
                  newY = candleBodyTopY;
                  newVelocity = 0;
                  landedOnCandle = true;
                  
                  if (prev.lastRedCandleContact === 0) {
                    // First contact with red candle - start grace period
                    const newCandleIndex = candles.indexOf(characterCandle);
                    console.log('RED CANDLE CONTACT: Starting grace period', {
                      currentTime,
                      graceTime: prev.redCandleGraceTime,
                      candleIndex: newCandleIndex
                    });
                    return {
                      ...prev,
                      characterPosition: { x: constrainedCharacterX, y: newY },
                      characterVelocity: 0,
                      cameraX: newCameraX,
                      lastRedCandleContact: currentTime, // Mark the start of grace period
                      canLand: false,
                      currentCandleIndex: Math.max(newCandleIndex, prev.currentCandleIndex), // Update candle index
                    };
                  } else {
                    // Continue staying on red candle - grace period check will happen later
                    return {
                      ...prev,
                      characterPosition: { x: constrainedCharacterX, y: newY },
                      characterVelocity: 0,
                      cameraX: newCameraX,
                      canLand: false,
                    };
                  }
                }
            } else {
              // Character is near candle but not landing - prevent going below candle
              if (characterBottom > candleBodyTopY + 5) {
                // Character is below candle top - snap to candle top
                newY = candleBodyTopY;
                newVelocity = 0;
                
                // Determine if it's green or red candle for game logic
                if (characterCandle.isGreen) {
                  // Safe on green candle
                  const newCandleIndex = candles.indexOf(characterCandle);
                  if (newCandleIndex > prev.currentCandleIndex) {
                    return {
                      ...prev,
                      characterPosition: { x: constrainedCharacterX, y: newY },
                      characterVelocity: 0,
                      currentCandleIndex: newCandleIndex,
                      score: prev.score + 1,
                      cameraX: newCameraX,
                      canLand: false,
                      lastRedCandleContact: 0,
                    };
                  } else {
                    return {
                      ...prev,
                      characterPosition: { x: constrainedCharacterX, y: newY },
                      characterVelocity: 0,
                      cameraX: newCameraX,
                      canLand: false,
                      lastRedCandleContact: 0,
                    };
                  }
                } else {
                  // Red candle - start grace period if first contact
                  const currentTime = Date.now();
                  if (prev.lastRedCandleContact === 0) {
                    // First contact - start grace period
                    return {
                      ...prev,
                      characterPosition: { x: constrainedCharacterX, y: newY },
                      characterVelocity: 0,
                      cameraX: newCameraX,
                      lastRedCandleContact: currentTime,
                      canLand: false,
                    };
                  } else {
                    // Already on red candle - continue (grace period check happens elsewhere)
                    return {
                      ...prev,
                      characterPosition: { x: constrainedCharacterX, y: newY },
                      characterVelocity: 0,
                      cameraX: newCameraX,
                      canLand: false,
                    };
                  }
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

        // Check if grace period has expired while on red candle - CRITICAL CHECK
        if (prev.lastRedCandleContact > 0 && !prev.isDead && !prev.isJumping) {
          const currentTime = Date.now();
          const timeSinceRedContact = currentTime - prev.lastRedCandleContact;
          
          // Debug logging for red candle timer
          if (process.env.NODE_ENV === 'development' && timeSinceRedContact > 0) {
            console.log('Red candle timer:', {
              timeSinceContact: timeSinceRedContact,
              graceTime: prev.redCandleGraceTime,
              remaining: prev.redCandleGraceTime - timeSinceRedContact,
              shouldDie: timeSinceRedContact >= prev.redCandleGraceTime
            });
          }
          
          if (timeSinceRedContact >= prev.redCandleGraceTime) {
            // Grace period expired - game over immediately
            console.log('GAME OVER: Red candle grace period expired!');
            return {
              ...prev,
              isDead: true,
              characterVelocity: 0,
              state: 'playing', // Keep in playing state so game over logic can handle it
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
      redCandleGraceTime: 500, // Reset grace period (0.5 seconds)
      lastRedCandleContact: 0,
      jumpStartX: 150,
      jumpTargetX: 150,
      jumpProgress: 1, // Not jumping initially
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
              Math.max(0, gameState.redCandleGraceTime - (Date.now() - gameState.lastRedCandleContact)).toFixed(0) + 'ms (0.5s total)' : 
              'Safe'}
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
