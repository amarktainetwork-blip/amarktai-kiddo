import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getChildren, createConversation, addMessage, getMessages, getClarificationState, setClarificationState, clearClarificationState, addMediaItem, updateUserCredits } from '../lib/store';
import { generateAIResponse, generateAudio, generateImage, detectEmotion } from '../lib/generators';
import CompanionAvatar from '../components/CompanionAvatar';

export default function Chat() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [currentEmotion, setCurrentEmotion] = useState('idle');
  const [isTyping, setIsTyping] = useState(false);
  const [clarification, setClarification] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const kids = getChildren(user.id);
    setChildren(kids);
    
    if (kids.length > 0 && !selectedChild) {
      setSelectedChild(kids[0]);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (selectedChild && !conversationId) {
      const convId = createConversation(user!.id, selectedChild.id, 'chat', 'New Chat');
      setConversationId(convId);
      const msgs = getMessages(convId);
      setMessages(msgs);
    }
  }, [selectedChild, user]);

  const handleSend = () => {
    if (!input.trim() || !conversationId || !user) return;

    // Check if this is a clarification answer
    if (clarification) {
      handleClarificationAnswer(input);
      return;
    }

    // Add user message
    addMessage(conversationId, 'user', input);
    
    // Check if this is a music or story request
    const lowerInput = input.toLowerCase();
    const isMusicRequest = lowerInput.includes('music') || lowerInput.includes('song') || lowerInput.includes('create audio');
    const isStoryRequest = lowerInput.includes('story') || lowerInput.includes('create story');

    if (isMusicRequest || isStoryRequest) {
      // Check credits
      if (user.credits < 10) {
        addMessage(conversationId, 'assistant', 'Sorry, you need at least 10 credits to create music or stories. You can earn more credits by chatting!');
        const msgs = getMessages(conversationId);
        setMessages(msgs);
        setInput('');
        return;
      }

      // Start clarification flow
      const clarState = {
        conversationId,
        step: 1,
        data: { type: isMusicRequest ? 'music' : 'story' }
      };
      setClarificationState(conversationId, clarState);
      
      const question = isMusicRequest 
        ? 'What kind of music would you like me to create? (e.g., happy, sad, energetic)'
        : 'What kind of story would you like me to create? (e.g., adventure, fairy tale, mystery)';
      
      addMessage(conversationId, 'assistant', question);
      setClarification(clarState);
      
      const msgs = getMessages(conversationId);
      setMessages(msgs);
      setInput('');
      return;
    }

    // Regular chat
    setIsTyping(true);
    setCurrentEmotion('thinking');

    setTimeout(() => {
      const emotion = detectEmotion(input);
      const response = generateAIResponse(input, emotion);
      
      addMessage(conversationId, 'assistant', response, emotion);
      setCurrentEmotion(emotion);
      setIsTyping(false);
      
      const msgs = getMessages(conversationId);
      setMessages(msgs);
      setInput('');
    }, 1000);
  };

  const handleClarificationAnswer = (answer: string) => {
    if (!clarification || !conversationId || !user || !selectedChild) return;

    addMessage(conversationId, 'user', answer);
    
    if (clarification.step === 1) {
      // First clarification answer
      const newState = {
        ...clarification,
        step: 2,
        data: { ...clarification.data, style: answer }
      };
      setClarificationState(conversationId, newState);
      setClarification(newState);

      const question = clarification.data.type === 'music'
        ? 'Great! What mood should it have? (e.g., calm, upbeat, mysterious)'
        : 'Great! What should the main character be like? (e.g., brave, curious, kind)';
      
      addMessage(conversationId, 'assistant', question);
      
      const msgs = getMessages(conversationId);
      setMessages(msgs);
      setInput('');
    } else if (clarification.step === 2) {
      // Second clarification answer - generate content
      const newState = {
        ...clarification,
        step: 3,
        data: { ...clarification.data, mood: answer }
      };
      setClarification(newState);

      setIsTyping(true);
      setCurrentEmotion('thinking');

      setTimeout(() => {
        const prompt = `${clarification.data.style} ${answer}`;
        
        if (clarification.data.type === 'music') {
          // Generate audio
          const audioData = generateAudio(prompt, 5);
          const title = `Music: ${clarification.data.style}`;
          addMediaItem(user.id, selectedChild.id, conversationId, 'audio', title, prompt, audioData);
          
          // Deduct credits
          updateUserCredits(user.id, -10);
          
          addMessage(conversationId, 'assistant', `I've created a ${clarification.data.style} song for you! You can find it in your library. 🎵`);
        } else {
          // Generate image for story
          const imageData = generateImage(prompt);
          const title = `Story: ${clarification.data.style}`;
          addMediaItem(user.id, selectedChild.id, conversationId, 'image', title, prompt, imageData);
          
          // Deduct credits
          updateUserCredits(user.id, -10);
          
          addMessage(conversationId, 'assistant', `I've created a ${clarification.data.style} story illustration for you! You can find it in your library. 📖`);
        }

        clearClarificationState(conversationId);
        setClarification(null);
        setCurrentEmotion('happy');
        setIsTyping(false);
        
        const msgs = getMessages(conversationId);
        setMessages(msgs);
        setInput('');
      }, 2000);
    }
  };

  if (!user || !selectedChild) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white/5 p-4">
          <h2 className="text-white font-bold mb-4">Children</h2>
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => {
                setSelectedChild(child);
                setConversationId(null);
              }}
              className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                selectedChild.id === child.id ? 'bg-indigo-600' : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="text-white font-semibold">{child.name}</div>
              <div className="text-white/60 text-sm">Age {child.age}</div>
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              {messages.map(msg => (
                <div key={msg.id} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-lg ${
                    msg.role === 'user' ? 'bg-indigo-600' : 'bg-white/10'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="text-left mb-4">
                  <div className="inline-block p-3 rounded-lg bg-white/10">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-white/10 p-4">
            <div className="max-w-3xl mx-auto flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 input"
              />
              <button onClick={handleSend} className="btn-primary">
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Avatar sidebar */}
        <div className="w-full md:w-64 bg-white/5 p-4 flex items-center justify-center">
          <CompanionAvatar emotion={currentEmotion} isSpeaking={isTyping} />
        </div>
      </div>
    </div>
  );
}
