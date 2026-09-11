import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getChildren, getConversations, getMediaItems, getUser } from '../lib/store';
import { AudioPlayer, ImageViewer } from '../components/MediaPlayers';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [children, setChildren] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const kids = getChildren(user.id);
    setChildren(kids);

    const convs = getConversations(user.id);
    setConversations(convs);

    const media = getMediaItems(user.id);
    setMediaItems(media);

    const userData = getUser(user.id);
    if (userData) {
      setUserCredits(userData.credits);
    }
  }, [user, navigate]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Welcome back, {user.name}!
            </h1>
            <p className="text-white/60">Here's what's been happening</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-yellow-400">{userCredits}</div>
            <div className="text-white/60 text-sm">Credits</div>
          </div>
        </div>

        {/* Children */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Your Children</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {children.map(child => (
              <div key={child.id} className="card">
                <div className="text-4xl mb-2">{child.avatarChoice}</div>
                <h3 className="text-xl font-bold text-white">{child.name}</h3>
                <p className="text-white/60">Age {child.age}</p>
                <p className="text-white/40 text-sm">Language: {child.language}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Recent Conversations</h2>
            <button onClick={() => navigate('/chat')} className="btn-secondary">
              Start New Chat
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conversations.slice(0, 4).map(conv => (
              <div key={conv.id} className="card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">
                    {conv.type === 'chat' ? '💬' : conv.type === 'music' ? '🎵' : '📖'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{conv.title}</h3>
                    <p className="text-white/40 text-sm">
                      {new Date(conv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Media Library */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Media Library</h2>
            <button onClick={() => navigate('/library')} className="btn-secondary">
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mediaItems.slice(0, 4).map(item => (
              <div key={item.id}>
                {item.type === 'audio' ? (
                  <AudioPlayer src={item.dataUrl} title={item.title} />
                ) : (
                  <ImageViewer src={item.dataUrl} title={item.title} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
