import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Create conversation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { childId, type, title } = req.body;

    if (!childId || !type) {
      return res.status(400).json({ error: 'Child ID and type are required' });
    }

    const conversation = await prisma.conversation.create({
      data: {
        userId: req.user.userId,
        childId,
        type,
        title: title || 'New Conversation'
      }
    });

    res.json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get all conversations for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.user.userId },
      include: {
        child: {
          select: { id: true, name: true, avatarChoice: true }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get specific conversation with messages
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      },
      include: {
        child: true,
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// Delete conversation
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const conversation = await prisma.conversation.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (conversation.count === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
