import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Create a child profile
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, age, avatarChoice, language } = req.body;

    if (!name || !age || !avatarChoice) {
      return res.status(400).json({ error: 'Name, age, and avatar choice are required' });
    }

    const child = await prisma.child.create({
      data: {
        userId: req.user.userId,
        name,
        age,
        avatarChoice,
        language: language || 'en'
      }
    });

    res.json(child);
  } catch (error) {
    console.error('Create child error:', error);
    res.status(500).json({ error: 'Failed to create child' });
  }
});

// Get all children for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const children = await prisma.child.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(children);
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ error: 'Failed to get children' });
  }
});

// Get specific child
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const child = await prisma.child.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json(child);
  } catch (error) {
    console.error('Get child error:', error);
    res.status(500).json({ error: 'Failed to get child' });
  }
});

// Update child
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, age, avatarChoice, language } = req.body;

    const child = await prisma.child.updateMany({
      where: {
        id: req.params.id,
        userId: req.user.userId
      },
      data: {
        name,
        age,
        avatarChoice,
        language
      }
    });

    if (child.count === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({ message: 'Child updated successfully' });
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ error: 'Failed to update child' });
  }
});

// Delete child
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const child = await prisma.child.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (child.count === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({ message: 'Child deleted successfully' });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({ error: 'Failed to delete child' });
  }
});

export default router;
