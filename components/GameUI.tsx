'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameUIProps {
  score: number;
  highScore: number;
  gameState: 'menu' | 'playing' | 'gameOver';
  onStartGame: () => void;
  onRestartGame: () => void;
  onShowLeaderboard: () => void;
}

const GameUI: React.FC<GameUIProps> = ({
  score,
  highScore,
  gameState,
  onStartGame,
  onRestartGame,
  onShowLeaderboard,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
      {/* Score Display */}
      <AnimatePresence>
        {gameState === 'playing' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 score-display rounded-xl p-4"
          >
            <div className="text-2xl font-bold text-white mb-1">
              {score.toLocaleString()}
            </div>
            <div className="text-sm text-gray-300">
              Best: {highScore.toLocaleString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <AnimatePresence>
        {gameState === 'playing' && score < 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center"
          >
            <div className="bg-black/70 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-white text-lg font-semibold mb-2">
                Tap anywhere to jump!
              </div>
              <div className="text-gray-300 text-sm">
                Avoid the red candles 🔴
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Menu */}
      <AnimatePresence>
        {gameState === 'menu' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto"
          >
            <div className="text-center max-w-sm mx-auto p-6">
              {/* Game Logo */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8"
              >
                <h1 className="text-4xl font-bold text-white mb-2">
                  Crypto Jump
                </h1>
                <div className="text-6xl mb-4">₿🚀</div>
                <p className="text-gray-300 text-lg">
                  Jump over red candles and survive!
                </p>
              </motion.div>

              {/* High Score Display */}
              {highScore > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
                  <div className="text-yellow-400 text-sm font-semibold">BEST SCORE</div>
                  <div className="text-white text-2xl font-bold">{highScore.toLocaleString()}</div>
                </div>
              )}

              {/* Buttons */}
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onStartGame}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200"
                >
                  🚀 Start Game
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onShowLeaderboard}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-200"
                >
                  🏆 Leaderboard
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Screen */}
      <AnimatePresence>
        {gameState === 'gameOver' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm pointer-events-auto"
          >
            <div className="text-center max-w-sm mx-auto p-6">
              {/* Game Over Animation */}
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                className="mb-6"
              >
                <div className="text-6xl mb-4">💥</div>
                <h2 className="text-3xl font-bold text-red-400 mb-2">Game Over!</h2>
                <p className="text-gray-300">You hit a red candle!</p>
              </motion.div>

              {/* Score Results */}
              <div className="mb-8 space-y-3">
                <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
                  <div className="text-blue-400 text-sm font-semibold">YOUR SCORE</div>
                  <div className="text-white text-3xl font-bold">{score.toLocaleString()}</div>
                </div>
                
                {score > highScore && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30"
                  >
                    <div className="text-yellow-400 text-sm font-bold">🎉 NEW BEST SCORE! 🎉</div>
                  </motion.div>
                )}
                
                <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-600/30">
                  <div className="text-gray-400 text-sm">Best: {Math.max(score, highScore).toLocaleString()}</div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRestartGame}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200"
                >
                  🔄 Play Again
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onShowLeaderboard}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-200"
                >
                  🏆 Leaderboard
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameUI;
