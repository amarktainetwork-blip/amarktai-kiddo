import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getMediaItems } from '../lib/store';
import { AudioPlayer, ImageViewer } from '../components/MediaPlayers';

export default function Library() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'audio' | 'image'>('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const media = getMediaItems(user.id, filter === 'all' ? undefined : filter);
    setMediaItems(media);
  }, [user, navigate, filter]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Media Library</h1>
          <p className="text-white/60">All your created content in one place</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/60'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('audio')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'audio' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/60'
            }`}
          >
            🎵 Audio
          </button>
          <button
            onClick={() => setFilter('image')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'image' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/60'
            }`}
          >
            🖼️ Images
          </button>
        </div>

        {/* Media Grid */}
        {mediaItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-white mb-2">No media yet</h2>
            <p className="text-white/60 mb-6">Start creating to see your content here!</p>
            <button onClick={() => navigate('/chat')} className="btn-primary">
              Start Creating
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mediaItems.map(item => (
              <div key={item.id} className="card">
                {item.type === 'audio' ? (
                  <AudioPlayer src={item.dataUrl} title={item.title} />
                ) : (
                  <ImageViewer src={item.dataUrl} title={item.title} />
                )}
                <div className="mt-3 text-sm text-white/40">
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
