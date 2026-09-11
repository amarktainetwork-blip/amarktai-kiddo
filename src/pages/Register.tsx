import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, setCurrentUser, createChild } from '../lib/store';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childAvatar, setChildAvatar] = useState('🦊');
  const [childLanguage, setChildLanguage] = useState('English');
  const [error, setError] = useState('');

  const avatars = ['🦊', '🐼', '🦄', '🐯', '🐸', '🦉'];

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const user = createUser(email, password, name);
      setCurrentUser(user.id);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
      createChild(user.id, childName, parseInt(childAge), childAvatar, childLanguage);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            {step === 1 ? 'Create Account' : 'Add Your Child'}
          </h1>
          <p className="text-white/60">
            {step === 1 ? 'Join the adventure' : 'Tell us about your child'}
          </p>
        </div>

        <form onSubmit={step === 1 ? handleUserSubmit : handleChildSubmit} className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-2">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="John Doe"
                  required
                />
              </div>

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
                  minLength={6}
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-2">Child's Name</label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="input"
                  placeholder="Emma"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-2">Child's Age</label>
                <input
                  type="number"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  className="input"
                  placeholder="8"
                  min="3"
                  max="12"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-2">Choose Avatar</label>
                <div className="grid grid-cols-6 gap-2">
                  {avatars.map(avatar => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setChildAvatar(avatar)}
                      className={`p-3 rounded-lg text-2xl ${
                        childAvatar === avatar ? 'bg-indigo-600' : 'bg-white/5'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2">Preferred Language</label>
                <select
                  value={childLanguage}
                  onChange={(e) => setChildLanguage(e.target.value)}
                  className="input"
                >
                  <option>English</option>
                  <option>Afrikaans</option>
                  <option>Zulu</option>
                </select>
              </div>

              <button type="submit" className="btn-primary w-full">
                Complete Registration
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
