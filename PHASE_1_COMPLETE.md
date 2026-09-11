# Amarktai Kiddo - Phase 1 Backend Implementation

## ✅ COMPLETED: Backend API Foundation

### Files Created

#### Database Schema
- `backend/prisma/schema.prisma` - Complete Prisma schema with 6 models:
  - User (with credits, password hashing)
  - Child (profiles with avatar/language)
  - Conversation (chat/music/story types)
  - Message (with emotion tracking)
  - MediaItem (audio/images with S3 support)
  - ClarificationState (multi-step generation flow)

#### Server & Middleware
- `backend/src/server.js` - Express server with CORS, Helmet security
- `backend/src/middleware/auth.js` - JWT authentication middleware

#### API Routes (6 endpoints, 20+ routes)
- `backend/src/routes/auth.js` - Register/Login with bcrypt password hashing
- `backend/src/routes/users.js` - User profile, credit management
- `backend/src/routes/children.js` - Child CRUD operations
- `backend/src/routes/conversations.js` - Conversation management
- `backend/src/routes/messages.js` - Message handling with auto-credits
- `backend/src/routes/media.js` - Media library management

#### Configuration
- `backend/package.json` - Dependencies and scripts
- `backend/.env.example` - Environment template
- `backend/.env` - **YOU MUST CREATE THIS** (see setup below)

---

## 🔧 SETUP INSTRUCTIONS

### 1. Create .env File
```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/amarktai_kiddo?schema=public"
JWT_SECRET="change-this-to-a-random-secure-string-min-32-chars"
PORT=3001
NODE_ENV=development
```

### 2. Install PostgreSQL

**Option A: Docker (Recommended)**
```bash
docker run --name amarktai-postgres -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=amarktai_kiddo -p 5432:5432 -d postgres:15
```

**Option B: Local Installation**
- macOS: `brew install postgresql`
- Ubuntu: `sudo apt install postgresql`
- Windows: Download from postgresql.org

### 3. Run Database Migrations
```bash
cd backend
npx prisma migrate dev --name init
```

### 4. Start Backend Server
```bash
npm run dev
```

Server will start on `http://localhost:3001`

---

## 📡 API ENDPOINTS

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/credits` | Update user credits |

### Children
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/children` | Create child profile |
| GET | `/api/children` | Get all children |
| GET | `/api/children/:id` | Get specific child |
| PATCH | `/api/children/:id` | Update child |
| DELETE | `/api/children/:id` | Delete child |

### Conversations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/conversations` | Create conversation |
| GET | `/api/conversations` | Get all conversations |
| GET | `/api/conversations/:id` | Get conversation with messages |
| DELETE | `/api/conversations/:id` | Delete conversation |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages` | Add message to conversation |
| GET | `/api/messages/:conversationId` | Get messages |
| DELETE | `/api/messages/:id` | Delete message |

### Media
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/media` | Create media item |
| GET | `/api/media` | Get all media (filter by type) |
| GET | `/api/media/:id` | Get specific media |
| DELETE | `/api/media/:id` | Delete media |

---

## 🧪 TESTING THE API

### Register a User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Create Child (requires token)
```bash
curl -X POST http://localhost:3001/api/children \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"Emma","age":7,"avatarChoice":"princess","language":"en"}'
```

---

## 🔄 FRONTEND INTEGRATION NEEDED

The frontend (`src/lib/store.ts`) currently uses localStorage. It needs to be updated to:

1. **Replace localStorage calls with API calls**
2. **Store JWT token in sessionStorage**
3. **Add token to all API requests**
4. **Handle authentication state**

### Example Migration (store.ts → API)

**Before (localStorage):**
```typescript
export function authenticateUser(email: string, password: string): User | null {
  const users = getStorage<User[]>('users', []);
  return users.find(u => u.email === email && u.password === password) || null;
}
```

**After (API):**
```typescript
export async function loginUser(email: string, password: string) {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) throw new Error('Login failed');
  
  const data = await response.json();
  sessionStorage.setItem('token', data.token);
  return data.user;
}
```

---

## 📋 PHASE 1 CHECKLIST

- [x] Backend server with Express
- [x] PostgreSQL database schema
- [x] User authentication (JWT + bcrypt)
- [x] All CRUD API endpoints
- [x] Credit system implementation
- [x] Security middleware (Helmet, CORS)
- [ ] **Frontend integration with API** ⬅️ NEXT TASK
- [ ] **Create .env file** ⬅️ YOU MUST DO THIS
- [ ] **Setup PostgreSQL database** ⬅️ YOU MUST DO THIS
- [ ] Run migrations

---

## 🚀 WHAT'S NEXT (Phase 2)

Phase 2 will implement:
1. Real AI integrations (OpenAI, ElevenLabs, DALL-E)
2. AWS S3 file upload/storage
3. WebSocket for real-time chat
4. Email verification
5. Password reset flow

---

**Status**: Backend API foundation complete. Frontend integration required next.
