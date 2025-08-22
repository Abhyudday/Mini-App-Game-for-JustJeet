import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initDatabase() {
  const client = await pool.connect();
  
  try {
    // Create leaderboard table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        telegram_user_id BIGINT,
        CONSTRAINT positive_score CHECK (score >= 0)
      );
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_score 
      ON leaderboard (score DESC, created_at DESC);
    `);

    // Create index for telegram user lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leaderboard_telegram_user 
      ON leaderboard (telegram_user_id);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getLeaderboard(limit: number = 50) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT id, username, score, created_at
      FROM leaderboard
      ORDER BY score DESC, created_at ASC
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function addScore(username: string, score: number, telegramUserId?: number) {
  const client = await pool.connect();
  
  try {
    // Validate input
    if (!username || username.trim().length === 0) {
      throw new Error('Username is required');
    }
    
    if (score < 0) {
      throw new Error('Score must be non-negative');
    }

    // Sanitize username
    const sanitizedUsername = username.trim().substring(0, 50);
    
    const result = await client.query(`
      INSERT INTO leaderboard (username, score, telegram_user_id)
      VALUES ($1, $2, $3)
      RETURNING id, username, score, created_at
    `, [sanitizedUsername, score, telegramUserId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error adding score:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserBestScore(telegramUserId: number) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT MAX(score) as best_score
      FROM leaderboard
      WHERE telegram_user_id = $1
    `, [telegramUserId]);
    
    return result.rows[0]?.best_score || 0;
  } catch (error) {
    console.error('Error fetching user best score:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getLeaderboardStats() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        COUNT(*) as total_players,
        MAX(score) as highest_score,
        AVG(score) as average_score,
        COUNT(DISTINCT telegram_user_id) as unique_players
      FROM leaderboard
    `);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching leaderboard stats:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
