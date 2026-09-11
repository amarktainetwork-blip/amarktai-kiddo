# Amarktai Kiddo - AI Companion for Kids

A complete AI companion application for children with chat, music generation, and story creation features.

## 🎯 Features Implemented

### Phase 1: Core Generation Pipeline ✅
- **Music Generation**: Generate playable WAV audio files with custom melodies
- **Image Generation**: Generate viewable PNG images using canvas
- **Clarification Flow**: Multi-step conversation to refine music/story requests
- **Emotion Detection**: AI detects emotions from user input and responds accordingly
- **Credit System**: Users earn and spend credits for premium features

### Phase 2: Child Dashboard & Library ✅
- **Dashboard**: Overview of recent conversations and media
- **Media Library**: Browse all generated audio and images
- **Media Players**: Built-in audio player and image viewer
- **Child Management**: Add and manage multiple children profiles

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Access the App

1. Open your browser to `http://localhost:5173`
2. Click "Register" to create an account
3. Add your child's profile (name, age, avatar, language)
4. Start chatting with Kiddo!

## 📁 Project Structure

```
src/
├── App.tsx                    # Main app with routing
├── index.css                  # Global styles with Tailwind
├── main.tsx                   # Entry point
├── components/
│   ├── CompanionAvatar.tsx    # Animated AI avatar with emotions
│   └── MediaPlayers.tsx       # Audio and image players
├── lib/
│   ├── store.ts               # localStorage data management
│   └── generators.ts          # Audio/image generation logic
└── pages/
    ├── Home.tsx               # Landing page
    ├── Login.tsx              # User login
    ├── Register.tsx           # User registration with child profile
    ├── Chat.tsx               # Chat interface with clarification
    ├── Dashboard.tsx          # User dashboard
    └── Library.tsx            # Media library browser
```

## 🎨 Features

### Chat System
- Real-time conversations with AI companion
- Emotion detection and responsive avatar
- Clarification flow for music/story generation
- Credit-based premium features

### Music Generation
- Generates actual playable WAV audio files
- Custom melodies based on user prompts
- 5-second duration clips
- Stored in media library

### Image Generation
- Generates PNG images using HTML5 Canvas
- Custom visuals based on prompts
- Full-screen image viewer
- Stored in media library

### Companion Avatar
- Animated character with 9 emotional states
- Real-time emotion display
- Visual feedback during interactions
- Customizable per child

### Dashboard
- Overview of recent activity
- Quick access to conversations
- Media preview
- Credit balance display

### Media Library
- Browse all generated content
- Filter by type (audio/image)
- Built-in media players
- Date-sorted organization

## 💾 Data Storage

All data is stored in browser localStorage:
- User accounts
- Child profiles
- Conversations and messages
- Generated media (base64 encoded)
- Credit balances

**Note**: This is a frontend-only implementation. For production, you would need:
- Backend API server
- Database (PostgreSQL recommended)
- File storage (S3 or similar)
- Real AI API integration (OpenAI, Anthropic, etc.)

## 🎯 Credit System

- **Free Chat**: Unlimited basic conversations
- **Music Generation**: 10 credits per song
- **Story Generation**: 10 credits per story
- **Starting Credits**: 100 credits for new users

## 🎨 Customization

Each child can customize:
- Avatar emoji (🦊, 🐼, 🦄, 🐯, 🐸, 🦉)
- Preferred language (English, Afrikaans, Zulu)
- Age-appropriate responses

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy!

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking

### Tech Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Framer Motion** - Animations
- **Lucide React** - Icons

## 📝 Next Steps for Production

To make this production-ready:

1. **Backend API**
   - Create Node.js/Express server
   - Implement user authentication (JWT)
   - Add database integration (PostgreSQL)

2. **AI Integration**
   - Connect to OpenAI API for chat
   - Integrate music generation API (e.g., AIVA, Amper)
   - Add image generation API (e.g., DALL-E, Stable Diffusion)

3. **File Storage**
   - Set up S3 or similar for media storage
   - Implement file upload/download

4. **Authentication**
   - Add proper password hashing (bcrypt)
   - Implement session management
   - Add email verification

5. **Database Schema**
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     name VARCHAR(255) NOT NULL,
     credits INTEGER DEFAULT 100,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE children (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     name VARCHAR(255) NOT NULL,
     age INTEGER NOT NULL,
     avatar_choice VARCHAR(10),
     language VARCHAR(50),
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE conversations (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     child_id UUID REFERENCES children(id),
     title VARCHAR(255),
     type VARCHAR(50),
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE messages (
     id UUID PRIMARY KEY,
     conversation_id UUID REFERENCES conversations(id),
     role VARCHAR(50),
     content TEXT,
     emotion VARCHAR(50),
     timestamp TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE media_items (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     child_id UUID REFERENCES children(id),
     conversation_id UUID REFERENCES conversations(id),
     type VARCHAR(50),
     title VARCHAR(255),
     prompt TEXT,
     file_url TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Known Limitations

- Data stored in localStorage (not persistent across devices)
- No real AI integration (simulated responses)
- Audio generation is basic (simple sine waves)
- Image generation is basic (canvas shapes)
- No user authentication security
- No file upload to cloud storage

## 📞 Support

For questions or issues, please open an issue on GitHub.

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
