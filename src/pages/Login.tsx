import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateUser, setCurrentUser } from '../lib/store';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = authenticateUser(email, password);
    if (user) {
      setCurrentUser(user.id);
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Welcome Back</h1>
          <p className="text-white/60">Login to continue your adventure</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-white/80 text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-white/80 text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            Login
          </button>

          <div className="mt-4 text-center">
            <span className="text-white/60">Don't have an account? </span>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-indigo-400 hover:text-indigo-300"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
