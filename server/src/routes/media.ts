import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { uploadToS3, deleteFromS3 } from '../lib/s3.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio and image files are allowed.'));
    }
  },
});

// Upload media file
router.post('/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { childId, conversationId, title, prompt, type } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!type || !['audio', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Type must be audio or image' });
    }

    // Check credits (10 for media upload)
    const userResult = await pool.query('SELECT credits FROM users WHERE id = $1', [userId]);
    if (userResult.rows[0].credits < 10) {
      return res.status(402).json({ error: 'Insufficient credits. Need 10 credits for media upload.' });
    }

    // Upload to S3
    const uploadedFile = await uploadToS3(req.file.buffer, req.file.mimetype, type as 'audio' | 'image');

    // Create media item record
    const mediaId = uuidv4();
    const result = await pool.query(
      `INSERT INTO media_items (id, user_id, child_id, conversation_id, type, title, prompt, s3_key, s3_url, file_size, mime_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [mediaId, userId, childId, conversationId, type, title || 'Untitled', prompt || '', uploadedFile.key, uploadedFile.url, uploadedFile.size, uploadedFile.mimeType]
    );

    // Deduct credits
    await pool.query('UPDATE users SET credits = credits - 10 WHERE id = $1', [userId]);

    res.status(201).json({ 
      mediaItem: result.rows[0],
      creditsRemaining: userResult.rows[0].credits - 10
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'Failed to upload media file' });
  }
});

// Get all media items for current user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { type } = req.query;

    let query = 'SELECT * FROM media_items WHERE user_id = $1';
    const values: any[] = [userId];

    if (type && ['audio', 'image'].includes(type as string)) {
      query += ' AND type = $2';
      values.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);

    res.json({ mediaItems: result.rows });
  } catch (error) {
    console.error('Error fetching media items:', error);
    res.status(500).json({ error: 'Failed to fetch media items' });
  }
});

// Delete media item
router.delete('/:mediaId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { mediaId } = req.params;

    // Get media item to delete from S3
    const getResult = await pool.query(
      'SELECT s3_key FROM media_items WHERE id = $1 AND user_id = $2',
      [mediaId, userId]
    );

    if (getResult.rows.length === 0) {
      return res.status(404).json({ error: 'Media item not found' });
    }

    const s3Key = getResult.rows[0].s3_key;

    // Delete from S3
    if (s3Key) {
      await deleteFromS3(s3Key);
    }

    // Delete from database
    await pool.query('DELETE FROM media_items WHERE id = $1 AND user_id = $2', [mediaId, userId]);

    res.json({ message: 'Media item deleted successfully' });
  } catch (error) {
    console.error('Error deleting media item:', error);
    res.status(500).json({ error: 'Failed to delete media item' });
  }
});

export default router;
