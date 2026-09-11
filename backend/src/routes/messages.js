import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Add message to conversation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { conversationId, role, content, emotion } = req.body;

    if (!conversationId || !role || !content) {
      return res.status(400).json({ error: 'Conversation ID, role, and content are required' });
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: req.user.userId
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        emotion
      }
    });

    // Award credits for chatting
    if (role === 'user') {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { credits: { increment: 1 } }
      });
    }

    res.json(message);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Get messages for conversation
router.get('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.conversationId,
        userId: req.user.userId
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.conversationId },
      orderBy: { timestamp: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Delete message
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const message = await prisma.message.findUnique({
      include: { conversation: true }
    });

    if (!message || message.conversation.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await prisma.message.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;
