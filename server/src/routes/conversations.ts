import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Create a new conversation
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { childId, type, title } = req.body;

    if (!childId || !type || !title) {
      return res.status(400).json({ error: 'Child ID, type, and title are required' });
    }

    if (!['chat', 'music', 'story'].includes(type)) {
      return res.status(400).json({ error: 'Type must be chat, music, or story' });
    }

    // Verify child belongs to user
    const childCheck = await pool.query(
      'SELECT id FROM children WHERE id = $1 AND user_id = $2',
      [childId, userId]
    );

    if (childCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const conversationId = uuidv4();
    const result = await pool.query(
      `INSERT INTO conversations (id, user_id, child_id, type, title) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [conversationId, userId, childId, type, title]
    );

    res.status(201).json({ conversation: result.rows[0] });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get all conversations for current user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT c.*, ch.name as child_name 
       FROM conversations c 
       JOIN children ch ON c.child_id = ch.id 
       WHERE c.user_id = $1 
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get specific conversation with messages
router.get('/:conversationId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    // Get conversation details
    const convResult = await pool.query(
      `SELECT c.*, ch.name as child_name 
       FROM conversations c 
       JOIN children ch ON c.child_id = ch.id 
       WHERE c.id = $1 AND c.user_id = $2`,
      [conversationId, userId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages
    const msgResult = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC',
      [conversationId]
    );

    res.json({ 
      conversation: convResult.rows[0],
      messages: msgResult.rows 
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Add a message to conversation
router.post('/:conversationId/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const { role, content, emotion } = req.body;

    if (!role || !content) {
      return res.status(400).json({ error: 'Role and content are required' });
    }

    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({ error: 'Role must be user or assistant' });
    }

    // Verify conversation belongs to user
    const convCheck = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messageId = uuidv4();
    const result = await pool.query(
      `INSERT INTO messages (id, conversation_id, role, content, emotion) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [messageId, conversationId, role, content, emotion || null]
    );

    res.status(201).json({ message: result.rows[0] });
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// Delete a conversation
router.delete('/:conversationId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    const result = await pool.query(
      'DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING *',
      [conversationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
