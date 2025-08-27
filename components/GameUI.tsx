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
            className="absolute inset-0 flex flex-col bg-black pointer-events-auto px-4 py-6 overflow-y-auto"
          >
            {/* Top Section - Logo and Buy Button */}
            <div className="flex justify-between items-start mb-6">
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-1 text-center"
              >
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  JustJeet
                </h1>
              </motion.div>
              
              <motion.a
                href="https://dexscreener.com/solana/9M7eYNNP4TdJCmMspKpdbEhvpdds6E5WFVTTLjXfVray"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-6 rounded-lg transition-all duration-200 cursor-pointer select-none pointer-events-auto"
              >
                BUY HERE
              </motion.a>
            </div>

            {/* Contract Address - Top White Box */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg p-4 mb-6"
            >
              <div className="text-black text-sm font-mono break-all text-center">
                $JustJeet CA: 9M7eYNNP4TdJCmMspKpdbEhvpdds6E5WFVTTLjXfVray
              </div>
            </motion.div>

            {/* DEX Logo and Socials */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center space-x-6 mb-6"
            >
              {/* DEX Logo */}
              <a
                href="https://dexscreener.com/solana/GbU8mGX8wtDFWysGLBhQXbvRzeqBdMrvCuwqKNWJ7kwu"
                target="_blank"
                rel="noopener noreferrer"
                className="w-16 h-16 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer pointer-events-auto p-2"
              >
                <img 
                  src="https://images.seeklogo.com/logo-png/52/2/dex-screener-logo-png_seeklogo-527276.png" 
                  alt="DEXScreener" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error('Failed to load DEXScreener logo');
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Fallback text if image fails to load */}
                <span className="text-white text-lg font-bold hidden" id="dex-fallback">DEX</span>
              </a>
              
              {/* Social Links */}
              <a
                href="https://x.com/JustJeetSol?t=6f6zFN6IERRjkEjALDXpZQ&s=09"
                target="_blank"
                rel="noopener noreferrer"
                className="w-16 h-16 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer pointer-events-auto"
              >
                <span className="text-white text-2xl">𝕏</span>
              </a>
              
              <a
                href="https://t.me/officialJustJeet"
                target="_blank"
                rel="noopener noreferrer"
                className="w-16 h-16 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer pointer-events-auto p-2"
              >
                <img 
                  src="https://pngimg.com/uploads/telegram/telegram_PNG35.png" 
                  alt="Telegram" 
                  className="w-full h-full object-contain"
                />
              </a>
            </motion.div>

            {/* Game Introduction */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center space-x-3 mb-4">
                <span className="text-green-400 text-xl">↗</span>
                <p className="text-white text-lg md:text-xl font-light">
                  think you've got what it takes? test your Degen skills with our own JustJeet mini trading game below
                </p>
                <span className="text-white text-xl">✕</span>
                <span className="text-white text-xl">🎭</span>
              </div>
            </motion.div>

            {/* Game Preview Area */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="w-full max-w-lg aspect-video bg-gray-800 rounded-lg mb-6 relative overflow-hidden mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 opacity-50"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl">₿</div>
              </div>
              {highScore > 0 && (
                <div className="absolute top-4 right-4 bg-yellow-500/20 backdrop-blur-sm rounded-lg px-3 py-1">
                  <div className="text-yellow-400 text-xs font-semibold">BEST</div>
                  <div className="text-white text-lg font-bold">{highScore.toLocaleString()}</div>
                </div>
              )}
            </motion.div>

            {/* Play Button */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStartGame}
              onTouchStart={(e) => {
                e.preventDefault();
                onStartGame();
              }}
              className="w-full max-w-md bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-bold py-4 px-8 rounded-full text-xl transition-all duration-200 shadow-lg mb-6 cursor-pointer select-none mx-auto pointer-events-auto block text-center"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              PLAY GAME
            </motion.button>

            {/* Leaderboard Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onShowLeaderboard}
              onTouchStart={(e) => {
                e.preventDefault();
                onShowLeaderboard();
              }}
              className="text-green-400 hover:text-green-300 active:text-green-500 font-semibold transition-colors duration-200 cursor-pointer select-none pointer-events-auto text-center block mx-auto mb-6"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              🏆 View Leaderboard
            </motion.button>

            {/* Bottom Green Bar - Contract Address */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="bg-green-500 text-black p-4 rounded-lg max-w-2xl mx-auto w-full"
            >
              <p className="font-bold text-center text-sm">
                JustJeet: The ultimate meme coin roasting crypto's paper-handed jeets—panic sellers who buy high, sell low, and fuel the chaos. Jeets gonna jeet!
              </p>
            </motion.div>
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
