import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Create a child profile
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { name, age, avatarChoice, language } = req.body;

    if (!name || !age || !avatarChoice) {
      return res.status(400).json({ error: 'Name, age, and avatar choice are required' });
    }

    const childId = uuidv4();
    const result = await pool.query(
      `INSERT INTO children (id, user_id, name, age, avatar_choice, language) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [childId, userId, name, age, avatarChoice, language || 'en']
    );

    res.status(201).json({ child: result.rows[0] });
  } catch (error) {
    console.error('Error creating child:', error);
    res.status(500).json({ error: 'Failed to create child profile' });
  }
});

// Get all children for current user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      'SELECT * FROM children WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ children: result.rows });
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// Get specific child
router.get('/:childId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { childId } = req.params;

    const result = await pool.query(
      'SELECT * FROM children WHERE id = $1 AND user_id = $2',
      [childId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({ child: result.rows[0] });
  } catch (error) {
    console.error('Error fetching child:', error);
    res.status(500).json({ error: 'Failed to fetch child' });
  }
});

// Update child profile
router.patch('/:childId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { childId } = req.params;
    const { name, age, avatarChoice, language } = req.body;

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id FROM children WHERE id = $1 AND user_id = $2',
      [childId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (age !== undefined) {
      updates.push(`age = $${paramCount++}`);
      values.push(age);
    }
    if (avatarChoice !== undefined) {
      updates.push(`avatar_choice = $${paramCount++}`);
      values.push(avatarChoice);
    }
    if (language !== undefined) {
      updates.push(`language = $${paramCount++}`);
      values.push(language);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(childId);

    const result = await pool.query(
      `UPDATE children SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json({ child: result.rows[0] });
  } catch (error) {
    console.error('Error updating child:', error);
    res.status(500).json({ error: 'Failed to update child profile' });
  }
});

// Delete child profile
router.delete('/:childId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { childId } = req.params;

    const result = await pool.query(
      'DELETE FROM children WHERE id = $1 AND user_id = $2 RETURNING *',
      [childId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({ message: 'Child profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting child:', error);
    res.status(500).json({ error: 'Failed to delete child profile' });
  }
});

export default router;
