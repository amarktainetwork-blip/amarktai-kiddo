import { Router } from 'express';
import OpenAI from 'openai';
import pool from '../db/database.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate AI chat response using OpenAI
router.post('/chat', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { message, conversationId, childId } = req.body;

    if (!message || !conversationId) {
      return res.status(400).json({ error: 'Message and conversation ID are required' });
    }

    // Check user credits
    const userResult = await pool.query('SELECT credits FROM users WHERE id = $1', [userId]);
    if (userResult.rows[0].credits < 1) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    // Get conversation history for context (last 10 messages)
    const historyResult = await pool.query(
      `SELECT role, content FROM messages 
       WHERE conversation_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 10`,
      [conversationId]
    );

    const messages: any[] = historyResult.rows.reverse().map((row: any) => ({
      role: row.role,
      content: row.content
    }));

    messages.push({ role: 'user', content: message });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a friendly, age-appropriate AI companion for children. Keep responses simple, positive, and educational. Never share personal information or discuss inappropriate topics. Use emojis to make conversations fun!'
        },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content || 'I did not understand that.';

    // Detect emotion from response
    const emotion = detectEmotion(aiResponse);

    // Deduct credit
    await pool.query('UPDATE users SET credits = credits - 1 WHERE id = $1', [userId]);

    res.json({ 
      response: aiResponse,
      emotion,
      creditsRemaining: userResult.rows[0].credits - 1
    });
  } catch (error) {
    console.error('Error generating chat response:', error);
    
    // Fallback to simple response if API fails
    const fallbackResponses = [
      "That's interesting! Tell me more! 😊",
      "I'd love to hear more about that!",
      "That sounds great! What else is on your mind?"
    ];
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    res.json({ 
      response: randomResponse,
      emotion: 'happy',
      fallback: true
    });
  }
});

// Generate image using DALL-E
router.post('/image', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const { prompt, conversationId, childId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check user credits (10 credits for image generation)
    const userResult = await pool.query('SELECT credits FROM users WHERE id = $1', [userId]);
    if (userResult.rows[0].credits < 10) {
      return res.status(402).json({ error: 'Insufficient credits. Need 10 credits for image generation.' });
    }

    // Call DALL-E API
    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Child-friendly illustration: ${prompt}. Colorful, cartoon style, appropriate for children.`,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
    });

    const imageUrl = imageResponse.data?.[0]?.url || '';

    // Deduct credits
    await pool.query('UPDATE users SET credits = credits - 10 WHERE id = $1', [userId]);

    res.json({ 
      imageUrl,
      creditsRemaining: userResult.rows[0].credits - 10
    });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simple emotion detection
function detectEmotion(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('happy') || lowerContent.includes('wonderful') || lowerContent.includes('great')) {
    return 'happy';
  }
  if (lowerContent.includes('excited') || lowerContent.includes('amazing') || lowerContent.includes('awesome')) {
    return 'excited';
  }
  if (lowerContent.includes('think') || lowerContent.includes('wonder') || lowerContent.includes('hmm')) {
    return 'thinking';
  }
  if (lowerContent.includes('love') || lowerContent.includes('care') || lowerContent.includes('heart')) {
    return 'love';
  }
  if (lowerContent.includes('sad') || lowerContent.includes('sorry') || lowerContent.includes('unfortunately')) {
    return 'sad';
  }
  if (lowerContent.includes('scared') || lowerContent.includes('afraid') || lowerContent.includes('scary')) {
    return 'scared';
  }
  if (lowerContent.includes('surprised') || lowerContent.includes('wow') || lowerContent.includes('really')) {
    return 'surprised';
  }
  if (lowerContent.includes('curious') || lowerContent.includes('interesting')) {
    return 'curious';
  }
  
  return 'idle';
}

export default router;
