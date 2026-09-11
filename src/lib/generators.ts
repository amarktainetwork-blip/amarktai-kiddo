// Audio and Image generators
// These generate actual playable/viewable files in the browser

// Generate a WAV audio file with a simple melody
export function generateAudio(prompt: string, duration: number = 5): string {
  const sampleRate = 44100;
  const numSamples = sampleRate * duration;
  const numChannels = 1;
  const bitsPerSample = 16;
  
  // Create audio buffer
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  
  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);
  
  // Generate melody based on prompt
  const words = prompt.toLowerCase().split(' ');
  const baseFreq = 220 + (words.length * 20); // Base frequency varies with prompt
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = baseFreq + Math.sin(t * 2) * 50;
    const amplitude = 0.3 * (1 - t / duration); // Fade out
    const sample = Math.sin(2 * Math.PI * freq * t) * amplitude;
    
    const offset = 44 + i * 2;
    view.setInt16(offset, sample * 32767, true);
  }
  
  // Convert to base64 data URL
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  
  return `data:audio/wav;base64,${base64}`;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Generate a PNG image using canvas
export function generateImage(prompt: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  // Generate color based on prompt
  const words = prompt.toLowerCase().split(' ');
  const hue = (words.length * 37) % 360;
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
  gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 70%, 40%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // Draw shapes based on keywords
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  
  if (prompt.toLowerCase().includes('circle') || prompt.toLowerCase().includes('sun')) {
    ctx.beginPath();
    ctx.arc(256, 256, 100, 0, Math.PI * 2);
    ctx.fill();
  } else if (prompt.toLowerCase().includes('square') || prompt.toLowerCase().includes('box')) {
    ctx.fillRect(156, 156, 200, 200);
  } else if (prompt.toLowerCase().includes('triangle') || prompt.toLowerCase().includes('mountain')) {
    ctx.beginPath();
    ctx.moveTo(256, 100);
    ctx.lineTo(156, 400);
    ctx.lineTo(356, 400);
    ctx.closePath();
    ctx.fill();
  } else {
    // Default: draw random circles
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = 20 + Math.random() * 50;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Add text overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(prompt.substring(0, 30), 256, 480);
  
  return canvas.toDataURL('image/png');
}

// Emotion detection from AI response
export function detectEmotion(content: string): string {
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
  if (lowerContent.includes('curious') || lowerContent.includes('interesting') || lowerContent.includes('wonder')) {
    return 'curious';
  }
  
  return 'idle';
}

// Generate AI response (simulated)
export function generateAIResponse(prompt: string, emotion?: string): string {
  const responses: Record<string, string[]> = {
    happy: [
      "That's wonderful! I'm so happy for you! 😊",
      "That sounds amazing! You're doing great!",
      "I'm thrilled to hear that! Keep up the great work!"
    ],
    excited: [
      "Wow, that's amazing! I'm so excited! ✨",
      "That's incredible! I can't wait to see more!",
      "This is so exciting! Let's keep going!"
    ],
    thinking: [
      "Hmm, let me think about that... 🤔",
      "That's an interesting question. Let me consider it.",
      "Let me think... I have an idea!"
    ],
    love: [
      "I care about you so much! 💖",
      "You're so special to me!",
      "I love hearing from you!"
    ],
    sad: [
      "I'm sorry to hear that... 😔",
      "That must be hard. I'm here for you.",
      "I understand. It's okay to feel that way."
    ],
    scared: [
      "Oh no, that sounds scary! 😨",
      "Don't worry, I'm here with you.",
      "That does sound frightening. Let's talk about it."
    ],
    surprised: [
      "Wow, really? That's surprising! 😮",
      "I didn't expect that! Tell me more!",
      "That's unexpected! How interesting!"
    ],
    curious: [
      "That's interesting! Tell me more!",
      "I'm curious too! What else can you tell me?",
      "That's a great question! Let's explore it together."
    ],
    idle: [
      "That's interesting! Tell me more about it.",
      "I'd love to hear more about that!",
      "That sounds great! What else is on your mind?"
    ]
  };
  
  const emotionKey = emotion || 'idle';
  const responsesForEmotion = responses[emotionKey] || responses.idle;
  const randomIndex = Math.floor(Math.random() * responsesForEmotion.length);
  
  return responsesForEmotion[randomIndex];
}
