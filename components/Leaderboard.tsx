'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  created_at: string;
}

interface LeaderboardProps {
  currentScore: number;
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ currentScore, onBack }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Get username from Telegram if available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUsername(user.first_name + (user.last_name ? ` ${user.last_name}` : ''));
      }
    }
  }, []);

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit score
  const submitScore = async () => {
    if (!username.trim() || submitting || currentScore === 0) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          score: currentScore,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit score');
      
      setHasSubmitted(true);
      await fetchLeaderboard();
    } catch (err) {
      setError('Failed to submit score');
      console.error('Submit score error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}.`;
    }
  };

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 25 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden border border-gray-600"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🏆</span>
            <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
          </div>
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Score Submission */}
        {currentScore > 0 && !hasSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30"
          >
            <div className="text-center mb-3">
              <div className="text-blue-400 text-sm font-semibold">YOUR SCORE</div>
              <div className="text-white text-2xl font-bold">{currentScore.toLocaleString()}</div>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                maxLength={20}
              />
              <button
                onClick={submitScore}
                disabled={!username.trim() || submitting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
              >
                {submitting ? 'Submitting...' : 'Submit Score'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Leaderboard Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <div className="text-gray-400">Loading leaderboard...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-400 mb-4">⚠️</div>
              <div className="text-red-400">{error}</div>
              <button
                onClick={fetchLeaderboard}
                className="mt-4 text-blue-400 hover:text-blue-300 underline"
              >
                Try Again
              </button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎮</div>
              <div className="text-gray-400">No scores yet!</div>
              <div className="text-gray-500 text-sm mt-2">Be the first to set a record!</div>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {leaderboard.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      index < 3
                        ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                        : 'bg-gray-800/50 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-bold w-8">
                        {getRankIcon(index + 1)}
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {entry.username}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {formatDate(entry.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">
                        {entry.score.toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
          >
            ← Back to Menu
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Leaderboard;
