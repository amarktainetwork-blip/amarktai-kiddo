import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        children: true,
        _count: {
          conversations: true,
          mediaItems: true
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      credits: user.credits,
      children: user.children,
      conversationCount: user._count.conversations,
      mediaCount: user._count.mediaItems
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user credits
router.patch('/credits', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (typeof amount !== 'number') {
      return res.status(400).json({ error: 'Amount must be a number' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        credits: {
          increment: amount
        }
      }
    });

    res.json({ credits: user.credits });
  } catch (error) {
    console.error('Update credits error:', error);
    res.status(500).json({ error: 'Failed to update credits' });
  }
});

export default router;
