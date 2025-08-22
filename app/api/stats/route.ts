import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboardStats, initDatabase } from '@/lib/db';

// Initialize database on first API call
let dbInitialized = false;

async function ensureDbInitialized() {
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const stats = await getLeaderboardStats();
    
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
