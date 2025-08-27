'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameUIProps {
  score: number;
  highScore: number;
  gameState: 'menu' | 'playing' | 'gameOver' | 'mysteryCandle';
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
        {(gameState === 'playing' || gameState === 'mysteryCandle') && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 flex justify-between items-center"
          >
            <div className="bg-black/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-green-500/30">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {score.toLocaleString()}
              </div>
              <div className="text-xs text-gray-300">
                Best: {highScore.toLocaleString()}
              </div>
            </div>
            <div className="bg-black/80 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-600/30">
              <div className="text-yellow-400 text-lg">₿</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <AnimatePresence>
        {gameState === 'playing' && score < 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-4 right-4 text-center"
          >
            <div className="bg-black/90 backdrop-blur-md rounded-2xl p-4 border border-green-500/30 mx-auto max-w-sm">
              <div className="text-green-400 text-xl font-bold mb-2">
                TAP TO JUMP!
              </div>
              <div className="text-gray-300 text-sm">
                Avoid the red candles or you'll get REKT! 🔴
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Menu */}
      <AnimatePresence>
        {gameState === 'menu' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black pointer-events-auto px-4"
          >
            {/* Header Section - Compact Layout */}
            <div className="text-center mb-4">
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-3"
              >
                <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                  JUSTJEET
                </h1>
                <div className="w-full max-w-sm mx-auto bg-white rounded-lg p-3 mb-3">
                  <div className="text-black text-xs font-mono break-all leading-tight">
                    JustJeet: The ultimate meme coin roasting crypto's paper-handed jeets—panic sellers who buy high, sell low, and fuel the chaos. Jeets gonna jeet!
                  </div>
                </div>
              </motion.div>

              {/* Buy Button and DEX Links - Compact */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center space-y-3 mb-4"
              >
                <a 
                  href="https://dexscreener.com/solana/GbU8mGX8wtDFWysGLBhQXbvRzeqBdMrvCuwqKNWJ7kwu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-bold py-2 px-6 rounded-full text-base transition-all duration-200 shadow-lg"
                >
                  BUY HERE
                </a>
                
                {/* DEX Logo and Socials - Compact */}
                <div className="flex items-center space-x-4">
                  <a 
                    href="https://dexscreener.com/solana/GbU8mGX8wtDFWysGLBhQXbvRzeqBdMrvCuwqKNWJ7kwu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-white hover:text-green-400 transition-colors"
                  >
                    <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">DX</span>
                    </div>
                    <span className="text-xs">DEX</span>
                  </a>
                  
                  <a 
                    href="https://x.com/JustJeetSol?t=6f6zFN6IERRjkEjALDXpZQ&s=09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-white hover:text-blue-400 transition-colors"
                  >
                    <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">𝕏</span>
                    </div>
                    <span className="text-xs">X</span>
                  </a>
                  
                  <a 
                    href="https://t.me/officialJustJeet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-white hover:text-blue-500 transition-colors"
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">📱</span>
                    </div>
                    <span className="text-xs">TG</span>
                  </a>
                </div>
              </motion.div>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-white text-sm mb-4 max-w-lg mx-auto font-light italic"
              >
                think you've got what it takes? test your Degen skills with our own JustJeet mini trading game below
              </motion.p>
            </div>

            {/* Game Preview Area - Compact */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="w-full max-w-sm aspect-video bg-gray-800 rounded-lg mb-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 opacity-50"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-2xl font-bold text-white">JustJeet</div>
                <div className="text-lg ml-2">🎮</div>
              </div>
              {highScore > 0 && (
                <div className="absolute top-2 right-2 bg-yellow-500/20 backdrop-blur-sm rounded-lg px-2 py-1">
                  <div className="text-yellow-400 text-xs font-semibold">BEST</div>
                  <div className="text-white text-sm font-bold">{highScore.toLocaleString()}</div>
                </div>
              )}
            </motion.div>

            {/* Contract Address and Description - Compact */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="bg-green-500 text-black p-3 rounded-lg mb-4 max-w-lg mx-auto"
            >
              <p className="font-bold text-center mb-2 text-sm leading-tight">
                JustJeet: The ultimate meme coin roasting crypto's paper-handed jeets—panic sellers who buy high, sell low, and fuel the chaos. Jeets gonna jeet!
              </p>
              <div className="bg-black/20 rounded-lg p-2">
                <p className="text-xs font-mono break-all text-center">
                  $JustJeet CA: 9M7eYNNP4TdJCmMspKqpbEhvpddsSE5WFVTTLXNY2y
                </p>
              </div>
            </motion.div>

            {/* Play Button - Prominent */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStartGame}
              onTouchStart={(e) => {
                e.preventDefault();
                onStartGame();
              }}
              className="w-full max-w-sm bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-bold py-3 px-6 rounded-full text-lg transition-all duration-200 shadow-lg mb-3 cursor-pointer select-none border-2 border-green-300"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              PLAY JUSTJEET GAME
            </motion.button>

            {/* Leaderboard Button - Compact */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onShowLeaderboard}
              onTouchStart={(e) => {
                e.preventDefault();
                onShowLeaderboard();
              }}
              className="text-green-400 hover:text-green-300 active:text-green-500 font-semibold transition-colors duration-200 cursor-pointer select-none text-sm"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              🏆 View Leaderboard
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Screen */}
      <AnimatePresence>
        {gameState === 'gameOver' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm pointer-events-auto px-4"
          >
            <div className="text-center max-w-sm mx-auto">
              {/* Game Over Animation */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="mb-8"
              >
                <div className="text-8xl mb-4">💥</div>
                <h2 className="text-4xl font-black text-red-400 mb-2">REKT!</h2>
                <p className="text-gray-300 text-lg">You got caught by the red candle!</p>
              </motion.div>

              {/* Score Results */}
              <div className="mb-8 space-y-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-6 bg-black/80 backdrop-blur-sm rounded-2xl border border-green-500/30"
                >
                  <div className="text-green-400 text-sm font-semibold mb-1">YOUR SCORE</div>
                  <div className="text-white text-4xl font-black">{score.toLocaleString()}</div>
                </motion.div>
                
                {score > highScore && (
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="p-4 bg-yellow-500/20 backdrop-blur-sm rounded-xl border border-yellow-500/50"
                  >
                    <div className="text-yellow-400 text-lg font-bold">🎉 NEW BEST SCORE! 🎉</div>
                  </motion.div>
                )}
                
                <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-600/30">
                  <div className="text-gray-400 text-sm">Best: {Math.max(score, highScore).toLocaleString()}</div>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-4">
                <motion.button
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRestartGame}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    onRestartGame();
                  }}
                  className="w-full bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-bold py-4 px-8 rounded-full text-xl transition-all duration-200 shadow-lg cursor-pointer select-none"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  PLAY AGAIN
                </motion.button>
                
                <motion.button
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onShowLeaderboard}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    onShowLeaderboard();
                  }}
                  className="text-green-400 hover:text-green-300 active:text-green-500 font-semibold transition-colors duration-200 cursor-pointer select-none"
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                >
                  🏆 View Leaderboard
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
