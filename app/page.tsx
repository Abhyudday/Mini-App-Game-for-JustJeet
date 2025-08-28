'use client';

import React, { useEffect } from 'react';
import Game from '@/components/Game';

export default function Home() {
  useEffect(() => {
    // Initialize Telegram Web App
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      // Set theme
      tg.setHeaderColor('#16213e');
      tg.setBackgroundColor('#16213e');
      
      // Disable back button initially
      tg.BackButton.hide();
    }
  }, []);

  return (
    <main className="w-full min-h-screen overflow-y-auto">
      <Game />
    </main>
  );
}
