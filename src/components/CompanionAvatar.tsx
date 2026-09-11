import React from 'react';

interface CompanionAvatarProps {
  emotion?: string;
  isSpeaking?: boolean;
}

export default function CompanionAvatar({ emotion = 'idle', isSpeaking = false }: CompanionAvatarProps) {
  // Color mapping based on emotion
  const getEmotionColor = () => {
    switch (emotion) {
      case 'happy': return { primary: '#fbbf24', secondary: '#f59e0b' };
      case 'excited': return { primary: '#f472b6', secondary: '#ec4899' };
      case 'thinking': return { primary: '#a78bfa', secondary: '#8b5cf6' };
      case 'love': return { primary: '#fb7185', secondary: '#f43f5e' };
      case 'sad': return { primary: '#60a5fa', secondary: '#3b82f6' };
      case 'scared': return { primary: '#a78bfa', secondary: '#6b21a8' };
      case 'surprised': return { primary: '#fbbf24', secondary: '#f59e0b' };
      case 'curious': return { primary: '#6ee7b7', secondary: '#10b981' };
      default: return { primary: '#6366f1', secondary: '#4f46e5' };
    }
  };

  const colors = getEmotionColor();

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Glow effect */}
      <div 
        className="absolute w-48 h-48 rounded-full animate-pulse-glow"
        style={{
          background: `radial-gradient(circle, ${colors.primary}60 0%, transparent 70%)`
        }}
      />

      {/* Main orb */}
      <div 
        className="relative w-40 h-40 rounded-full animate-float"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${colors.primary}, ${colors.secondary})`,
          boxShadow: `0 0 40px ${colors.primary}80`
        }}
      >
        {/* Face */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Eyes */}
          <div className="flex gap-6">
            <div 
              className="w-6 h-8 bg-white rounded-full animate-blink"
              style={{ animationDelay: '0s' }}
            />
            <div 
              className="w-6 h-8 bg-white rounded-full animate-blink"
              style={{ animationDelay: '0.1s' }}
            />
          </div>

          {/* Mouth */}
          <div 
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-8 h-4 border-2 border-white rounded-full ${isSpeaking ? 'animate-mouth' : ''}`}
          />
        </div>

        {/* Particles for different emotions */}
        {emotion === 'excited' && (
          <>
            <div className="absolute -top-4 left-1/4 text-2xl animate-float" style={{ animationDelay: '0s' }}>✨</div>
            <div className="absolute -top-4 right-1/4 text-2xl animate-float" style={{ animationDelay: '0.3s' }}>✨</div>
            <div className="absolute -top-4 left-1/2 text-2xl animate-float" style={{ animationDelay: '0.6s' }}>✨</div>
          </>
        )}

        {emotion === 'love' && (
          <>
            <div className="absolute -top-4 left-1/3 text-2xl animate-float" style={{ animationDelay: '0s' }}>💖</div>
            <div className="absolute -top-4 right-1/3 text-2xl animate-float" style={{ animationDelay: '0.3s' }}>💖</div>
          </>
        )}

        {emotion === 'thinking' && (
          <div className="absolute -top-4 right-0 text-2xl animate-float">💭</div>
        )}
      </div>
    </div>
  );
}
