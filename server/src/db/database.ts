import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;

// Database schema initialization
export async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        credits INTEGER DEFAULT 100,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Children table
    await client.query(`
      CREATE TABLE IF NOT EXISTS children (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        age INTEGER NOT NULL,
        avatar_choice VARCHAR(255) NOT NULL,
        language VARCHAR(50) DEFAULT 'en',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        child_id VARCHAR(255) REFERENCES children(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('chat', 'music', 'story')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        conversation_id VARCHAR(255) REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        emotion VARCHAR(100),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Media items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_items (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        child_id VARCHAR(255) REFERENCES children(id) ON DELETE CASCADE,
        conversation_id VARCHAR(255) REFERENCES conversations(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('audio', 'image')),
        title VARCHAR(255) NOT NULL,
        prompt TEXT NOT NULL,
        s3_key VARCHAR(500),
        s3_url VARCHAR(1000),
        file_size INTEGER,
        mime_type VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Clarification states table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clarification_states (
        conversation_id VARCHAR(255) PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
        step INTEGER NOT NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_child_id ON conversations(child_id);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_media_items_user_id ON media_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_media_items_type ON media_items(type);
    `);

    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database schema:', error);
    throw error;
  } finally {
    client.release();
  }
}
