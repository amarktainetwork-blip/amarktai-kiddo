// Data store using localStorage to simulate backend
// This handles users, conversations, media, credits, and clarification state

export interface User {
  id: string;
  email: string;
  password: string; // In real app, this would be hashed
  name: string;
  credits: number;
  createdAt: string;
}

export interface Child {
  id: string;
  userId: string;
  name: string;
  age: number;
  avatarChoice: string;
  language: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: string;
  childId: string;
  title: string;
  type: 'chat' | 'music' | 'story';
  createdAt: string;
}

export interface MediaItem {
  id: string;
  userId: string;
  childId: string;
  conversationId: string;
  type: 'audio' | 'image';
  title: string;
  prompt: string;
  dataUrl: string; // Base64 data URL for audio/image
  createdAt: string;
}

export interface ClarificationState {
  conversationId: string;
  step: number;
  data: Record<string, string>;
}

// Helper functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getStorage<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// User management
export function createUser(email: string, password: string, name: string): User {
  const users = getStorage<User[]>('users', []);
  
  if (users.find(u => u.email === email)) {
    throw new Error('User already exists');
  }

  const user: User = {
    id: generateId(),
    email,
    password,
    name,
    credits: 100,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  setStorage('users', users);
  return user;
}

export function authenticateUser(email: string, password: string): User | null {
  const users = getStorage<User[]>('users', []);
  const user = users.find(u => u.email === email && u.password === password);
  return user || null;
}

export function getUser(userId: string): User | null {
  const users = getStorage<User[]>('users', []);
  return users.find(u => u.id === userId) || null;
}

export function updateUserCredits(userId: string, amount: number): number {
  const users = getStorage<User[]>('users', []);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) throw new Error('User not found');
  
  users[userIndex].credits += amount;
  setStorage('users', users);
  
  return users[userIndex].credits;
}

// Child management
export function createChild(userId: string, name: string, age: number, avatarChoice: string, language: string): string {
  const children = getStorage<Child[]>('children', []);
  
  const child: Child = {
    id: generateId(),
    userId,
    name,
    age,
    avatarChoice,
    language,
    createdAt: new Date().toISOString()
  };

  children.push(child);
  setStorage('children', children);
  return child.id;
}

export function getChildren(userId: string): Child[] {
  const children = getStorage<Child[]>('children', []);
  return children.filter(c => c.userId === userId);
}

// Conversation management
export function createConversation(userId: string, childId: string, type: 'chat' | 'music' | 'story', title: string): string {
  const conversations = getStorage<Conversation[]>('conversations', []);
  
  const conversation: Conversation = {
    id: generateId(),
    userId,
    childId,
    type,
    title,
    createdAt: new Date().toISOString()
  };

  conversations.push(conversation);
  setStorage('conversations', conversations);
  return conversation.id;
}

export function getConversations(userId: string): Conversation[] {
  const conversations = getStorage<Conversation[]>('conversations', []);
  return conversations.filter(c => c.userId === userId).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Message management
export function addMessage(conversationId: string, role: 'user' | 'assistant', content: string, emotion?: string): string {
  const messages = getStorage<Message[]>('messages', []);
  
  const message: Message = {
    id: generateId(),
    conversationId,
    role,
    content,
    emotion,
    timestamp: new Date().toISOString()
  };

  messages.push(message);
  setStorage('messages', messages);
  return message.id;
}

export function getMessages(conversationId: string): Message[] {
  const messages = getStorage<Message[]>('messages', []);
  return messages.filter(m => m.conversationId === conversationId).sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

// Media management
export function addMediaItem(
  userId: string,
  childId: string,
  conversationId: string,
  type: 'audio' | 'image',
  title: string,
  prompt: string,
  dataUrl: string
): string {
  const mediaItems = getStorage<MediaItem[]>('mediaItems', []);
  
  const mediaItem: MediaItem = {
    id: generateId(),
    userId,
    childId,
    conversationId,
    type,
    title,
    prompt,
    dataUrl,
    createdAt: new Date().toISOString()
  };

  mediaItems.push(mediaItem);
  setStorage('mediaItems', mediaItems);
  return mediaItem.id;
}

export function getMediaItems(userId: string, type?: 'audio' | 'image'): MediaItem[] {
  const mediaItems = getStorage<MediaItem[]>('mediaItems', []);
  let filtered = mediaItems.filter(m => m.userId === userId);
  
  if (type) {
    filtered = filtered.filter(m => m.type === type);
  }
  
  return filtered.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Clarification state management
export function getClarificationState(conversationId: string): ClarificationState | null {
  const states = getStorage<Record<string, ClarificationState>>('clarificationStates', {});
  return states[conversationId] || null;
}

export function setClarificationState(conversationId: string, state: ClarificationState): void {
  const states = getStorage<Record<string, ClarificationState>>('clarificationStates', {});
  states[conversationId] = state;
  setStorage('clarificationStates', states);
}

export function clearClarificationState(conversationId: string): void {
  const states = getStorage<Record<string, ClarificationState>>('clarificationStates', {});
  delete states[conversationId];
  setStorage('clarificationStates', states);
}

// Session management
export function setCurrentUser(userId: string): void {
  sessionStorage.setItem('currentUserId', userId);
}

export function getCurrentUser(): User | null {
  const userId = sessionStorage.getItem('currentUserId');
  if (!userId) return null;
  return getUser(userId);
}

export function clearCurrentUser(): void {
  sessionStorage.removeItem('currentUserId');
}
