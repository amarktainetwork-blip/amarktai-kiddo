import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Create media item (metadata only, file upload handled separately)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { childId, conversationId, type, title, prompt, s3Key, s3Url } = req.body;

    if (!childId || !type || !title || !prompt) {
      return res.status(400).json({ error: 'Child ID, type, title, and prompt are required' });
    }

    const mediaItem = await prisma.mediaItem.create({
      data: {
        userId: req.user.userId,
        childId,
        conversationId,
        type,
        title,
        prompt,
        s3Key,
        s3Url
      }
    });

    res.json(mediaItem);
  } catch (error) {
    console.error('Create media error:', error);
    res.status(500).json({ error: 'Failed to create media item' });
  }
});

// Get all media items for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query;
    
    const where = {
      userId: req.user.userId
    };

    if (type) {
      where.type = type;
    }

    const mediaItems = await prisma.mediaItem.findMany({
      where,
      include: {
        child: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(mediaItems);
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Failed to get media items' });
  }
});

// Get specific media item
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const mediaItem = await prisma.mediaItem.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      },
      include: {
        child: true,
        conversation: true
      }
    });

    if (!mediaItem) {
      return res.status(404).json({ error: 'Media item not found' });
    }

    res.json(mediaItem);
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Failed to get media item' });
  }
});

// Delete media item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const mediaItem = await prisma.mediaItem.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (mediaItem.count === 0) {
      return res.status(404).json({ error: 'Media item not found' });
    }

    res.json({ message: 'Media item deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media item' });
  }
});

export default router;
