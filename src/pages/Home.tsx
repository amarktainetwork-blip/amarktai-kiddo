import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../lib/store';
import CompanionAvatar from '../components/CompanionAvatar';

export default function Home() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 gradient-text">
          Welcome to Amarktai Kiddo
        </h1>
        <p className="text-xl text-white/70 mb-8">
          Your AI companion for creative adventures
        </p>
      </div>

      <div className="mb-12">
        <CompanionAvatar emotion="happy" />
      </div>

      <div className="flex gap-4">
        {!user ? (
          <>
            <button onClick={() => navigate('/login')} className="btn-primary">
              Login
            </button>
            <button onClick={() => navigate('/register')} className="btn-secondary">
              Register
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/chat')} className="btn-primary">
              Start Chatting
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">
              Dashboard
            </button>
          </>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <div className="card">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-xl font-bold mb-2">Chat</h3>
          <p className="text-white/60">Have conversations with your AI buddy</p>
        </div>
        <div className="card">
          <div className="text-4xl mb-4">🎵</div>
          <h3 className="text-xl font-bold mb-2">Music</h3>
          <p className="text-white/60">Create music with AI assistance</p>
        </div>
        <div className="card">
          <div className="text-4xl mb-4">📖</div>
          <h3 className="text-xl font-bold mb-2">Stories</h3>
          <p className="text-white/60">Generate creative stories together</p>
        </div>
      </div>
    </div>
  );
}
