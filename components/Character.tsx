'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CharacterProps {
  position: { x: number; y: number };
  isJumping: boolean;
  isDead: boolean;
}

const Character: React.FC<CharacterProps> = ({ position, isJumping, isDead }) => {
  return (
    <motion.div
      className="absolute character"
      style={{
        left: position.x - 25,
        top: position.y - 50,
        zIndex: 10,
      }}
      animate={{
        scale: isDead ? 0.8 : 1,
        rotate: isDead ? -90 : 0,
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Character SVG - High quality crypto trader */}
      <svg
        width="50"
        height="50"
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${isJumping ? 'animate-bounce-game' : ''} ${isDead ? 'opacity-70' : ''}`}
      >
        {/* Character body with gradient */}
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="hatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Character shadow */}
        <ellipse cx="25" cy="47" rx="8" ry="2" fill="rgba(0,0,0,0.3)" />
        
        {/* Legs */}
        <rect x="18" y="35" width="4" height="12" rx="2" fill="#4f46e5" />
        <rect x="28" y="35" width="4" height="12" rx="2" fill="#4f46e5" />
        
        {/* Shoes */}
        <ellipse cx="20" cy="47" rx="3" ry="1.5" fill="#1f2937" />
        <ellipse cx="30" cy="47" rx="3" ry="1.5" fill="#1f2937" />
        
        {/* Main body */}
        <rect x="15" y="20" width="20" height="18" rx="3" fill="url(#bodyGradient)" filter="url(#glow)" />
        
        {/* Arms */}
        <rect x="10" y="25" width="4" height="10" rx="2" fill="#4f46e5" />
        <rect x="36" y="25" width="4" height="10" rx="2" fill="#4f46e5" />
        
        {/* Hands */}
        <circle cx="12" cy="37" r="2.5" fill="#fbbf24" />
        <circle cx="38" cy="37" r="2.5" fill="#fbbf24" />
        
        {/* Head */}
        <circle cx="25" cy="15" r="8" fill="#fbbf24" filter="url(#glow)" />
        
        {/* Hat (crypto trader style) */}
        <path d="M17 10 L33 10 L31 5 L19 5 Z" fill="url(#hatGradient)" />
        <rect x="16" y="10" width="18" height="3" rx="1" fill="#374151" />
        
        {/* Bitcoin symbol on hat */}
        <text x="25" y="8" textAnchor="middle" fontSize="6" fill="#f59e0b" fontWeight="bold">₿</text>
        
        {/* Eyes */}
        <circle cx="21" cy="13" r="1.5" fill="white" />
        <circle cx="29" cy="13" r="1.5" fill="white" />
        <circle cx="21" cy="13" r="0.8" fill={isDead ? "#ff4757" : "#1f2937"} />
        <circle cx="29" cy="13" r="0.8" fill={isDead ? "#ff4757" : "#1f2937"} />
        
        {/* Mouth */}
        <path 
          d={isDead ? "M22 18 Q25 16 28 18" : "M22 18 Q25 20 28 18"} 
          stroke={isDead ? "#ff4757" : "#1f2937"} 
          strokeWidth="1.5" 
          fill="none" 
        />
        
        {/* Crypto coins floating around (when jumping) */}
        {isJumping && !isDead && (
          <g>
            <circle cx="5" cy="15" r="2" fill="#f59e0b" opacity="0.8">
              <animate attributeName="cy" values="15;10;15" dur="0.6s" repeatCount="1" />
            </circle>
            <circle cx="45" cy="20" r="2" fill="#00d4aa" opacity="0.8">
              <animate attributeName="cy" values="20;15;20" dur="0.6s" repeatCount="1" />
            </circle>
            <text x="5" y="17" textAnchor="middle" fontSize="2" fill="white">₿</text>
            <text x="45" y="22" textAnchor="middle" fontSize="2" fill="white">Ξ</text>
          </g>
        )}
        
        {/* Death effect */}
        {isDead && (
          <g>
            <text x="21" y="13" textAnchor="middle" fontSize="3" fill="#ff4757">×</text>
            <text x="29" y="13" textAnchor="middle" fontSize="3" fill="#ff4757">×</text>
          </g>
        )}
      </svg>
    </motion.div>
  );
};

export default Character;
