# Ruroxz Chat - Full-Stack Real-Time Chat Application

A complete, production-ready WhatsApp-like chat application with real-time messaging, user authentication, and multi-platform support (Web, Mobile, Backend).

![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)
![GitHub Stars](https://img.shields.io/badge/stars-%E2%9C%A8-yellow)
![Status](https://img.shields.io/badge/status-Active-green)

---

## 🎯 Overview

**Ruroxz Chat** is a feature-rich real-time chat platform built with modern technologies. It supports:

- **1-to-1 Direct Messaging** - Private conversations
- **Group Chats** - Multi-user chat rooms
- **Real-Time Messaging** - Instant message delivery via Socket.IO
- **User Authentication** - Phone OTP (Mobile) & Email/Password (Web)
- **Media Sharing** - Image uploads via Cloudinary
- **Push Notifications** - FCM for mobile, Browser API for web
- **Typing Indicators** - Real-time typing status
- **Message History** - Persistent storage with pagination
- **Cross-Platform** - Web, Mobile, and Backend

---

## 🏗️ Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Web (React)│    │  Mobile (RN) │    │   Backend   │
│  + Vite     │    │  + Expo      │    │  Express.js │
└──────┬──────┘    └──────┬───────┘    └──────┬──────┘
       │                   │                    │
       └───────────────────┼────────────────────┘
                HTTP & WebSocket (Socket.IO)
                           │
                ┌──────────┴──────────┐
                │                     │
            ┌───▼────┐         ┌─────▼──────┐
            │Firebase│         │PostgreSQL  │
            │(Auth)  │         │+ Prisma    │
            │(FCM)   │         │            │
            └────────┘         └────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- PostgreSQL database
- Firebase project (for auth & notifications)
- Cloudinary account (for image uploads)

### 1️⃣ Backend Setup (Express + Socket.IO)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run prisma:push  # Create database tables
npm run dev
```

**Backend runs on:** `http://localhost:3000`

### 2️⃣ Web App Setup (React + Vite)

```bash
cd web
npm install
cp .env.example .env
# Update API_URL and SOCKET_URL in .env
npm run dev
```

**Web app runs on:** `http://localhost:5173`

### 3️⃣ Mobile App Setup (React Native + Expo)

```bash
cd mobile
npm install
cp .env.example .env
# Update Firebase config and API URLs in .env
npm start
```

**Mobile app:** Scan QR code with Expo Go app or build for iOS/Android

---

## 📦 Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Real-time:** Socket.IO v4.7.2
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** Firebase Admin SDK
- **Notifications:** Firebase Cloud Messaging (FCM)
- **Media:** Cloudinary

### Web Frontend
- **Framework:** React 18.2.0
- **Build Tool:** Vite 4.4.5
- **Routing:** React Router DOM v6
- **Real-time:** Socket.IO Client v4.7.2
- **State Management:** Zustand v4.4.2
- **HTTP Client:** Axios v1.5.0
- **Styling:** CSS3 with custom properties

### Mobile Frontend
- **Framework:** React Native
- **Development:** Expo 49
- **Navigation:** React Navigation v6
- **Real-time:** Socket.IO Client v4.7.2
- **State Management:** Zustand v4.4.2
- **HTTP Client:** Axios v1.5.0
- **Notifications:** Expo Notifications + Firebase
- **Auth:** Firebase Client SDK

---

## 📁 Project Structure

```
ruroxz_chat/
├── backend/
│   ├── src/
│   │   ├── config/          (Database, Firebase, Cloudinary)
│   │   ├── controllers/     (Business logic)
│   │   ├── routes/          (API endpoints)
│   │   ├── middleware/      (Auth, validation)
│   │   ├── sockets/         (Real-time messaging)
│   │   ├── services/        (Notifications)
│   │   ├── app.js           (Express setup)
│   │   └── server.js        (Entry point)
│   ├── prisma/
│   │   └── schema.prisma    (Database schema)
│   ├── .env.example
│   └── package.json
│
├── web/
│   ├── src/
│   │   ├── pages/           (Login, Chat)
│   │   ├── components/      (Reusable UI)
│   │   ├── services/        (API, Socket, Notifications)
│   │   ├── store/           (Zustand stores)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
│
├── mobile/
│   ├── src/
│   │   ├── screens/         (Login, ChatList, Chat, CreateGroup)
│   │   ├── components/      (MessageBubble, ChatInput, ChatItem)
│   │   ├── services/        (API, Firebase, Socket, Notifications)
│   │   ├── store/           (Zustand stores)
│   │   ├── App.js
│   │   └── app.json
│   ├── .env.example
│   └── package.json
│
├── README.md                (This file)
├── .gitignore
├── ARCHITECTURE.md          (System design)
├── API_DOCUMENTATION.md     (Endpoints & WebSocket events)
└── QUICKSTART.md           (5-minute setup)
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /auth/verify-otp         Verify Firebase OTP & login
GET    /auth/me                 Get current user profile
PATCH  /auth/profile            Update user profile
```

### Chats
```
POST   /chats                   Create 1-to-1 or group chat
GET    /chats                   List all user chats (paginated)
GET    /chats/:chatId           Get specific chat details
POST   /chats/:chatId/participants  Add user to group
```

### Messages
```
POST   /messages                Send message with optional media
GET    /messages/:chatId        Get chat messages (paginated, limit 50)
DELETE /messages/:messageId     Delete message (owner only)
```

---

## 🔌 Socket.IO Events

### Real-Time Messaging
```
Client → Server:
  join_chats          Join chat rooms
  send_message        Send message to room
  typing              Broadcast typing indicator
  stop_typing         Stop typing indicator

Server → Client:
  receive_message     New message broadcast
  user_typing         User is typing
  user_stopped_typing User stopped typing
```

---

## 🔐 Authentication Flow

### Mobile (Phone OTP)
1. User enters phone number
2. Firebase sends SMS OTP
3. User enters 6-digit code
4. Backend verifies with Firebase Admin SDK
5. Create/update user in database
6. Save FCM token for push notifications
7. Store auth token locally

### Web (Email/Password)
1. User enters email and password
2. Firebase authenticates
3. Backend verifies ID token
4. Create/update user in database
5. Store auth token in localStorage

---

## 📊 Database Schema

```
User
├── id (UUID)
├── phoneNumber (unique)
├── displayName
├── photoUrl
├── fcmToken
├── createdAt, updatedAt

Chat
├── id (UUID)
├── name (group only)
├── isGroup (boolean)
├── createdById
├── photoUrl
├── createdAt, updatedAt

ChatParticipant (N:M relationship)
├── userId
├── chatId
├── joinedAt

Message
├── id (UUID)
├── content
├── senderId
├── chatId
├── mediaUrl
├── mediaType
├── createdAt
```

---

## 📱 Features

### ✅ Implemented
- [x] Real-time messaging with Socket.IO
- [x] 1-to-1 and group chats
- [x] User authentication (OTP & Email)
- [x] Push notifications (FCM & Browser)
- [x] Image/media uploads
- [x] Message history with pagination
- [x] Typing indicators
- [x] User profiles
- [x] Cross-platform support
- [x] Production-ready code

### 🚀 Planned Features
- [ ] Voice/Video calls
- [ ] Message encryption (E2E)
- [ ] User search & discovery
- [ ] User blocking
- [ ] Read receipts
- [ ] Message reactions/emojis
- [ ] Admin features for groups
- [ ] Chat archiving

---

## 🚀 Deployment

### Backend Deployment
- **Heroku:** `git push heroku main`
- **Railway:** Deploy via CLI
- **AWS EC2:** Use PM2 for process management
- **DigitalOcean:** Droplet + Nginx reverse proxy

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for detailed deployment guides.

### Web Deployment
- **Vercel:** Connect GitHub repo
- **Netlify:** Connect GitHub repo
- **AWS S3 + CloudFront:** Static hosting
- **GitHub Pages:** Free static hosting

See [WEB_SETUP.md](WEB_SETUP.md) for details.

### Mobile Deployment
- **iOS App Store:** Build & sign with Xcode
- **Google Play Store:** Build & sign with Android Studio
- **Expo EAS:** Managed build service

See [MOBILE_SETUP.md](MOBILE_SETUP.md) for details.

---

## 📊 Performance & Scaling

### Current Setup
- Supports ~100-500 concurrent users
- Single server instance
- Direct database connection

### Optimization Strategies
1. **Caching:** Add Redis for sessions & message cache
2. **Database:** Add indexes & query optimization
3. **Frontend:** Code splitting, lazy loading, image optimization
4. **Backend:** Compression, connection pooling, async patterns

### Horizontal Scaling
1. Load balancer (Nginx/HAProxy)
2. Multiple backend instances
3. Redis adapter for Socket.IO
4. Database replicas & sharding

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed scaling strategies.

---

## 🔒 Security Features

✅ **Client-side:**
- Secure token storage (SecureStore mobile, localStorage web)
- HTTPS/TLS in production
- Input validation & sanitization

✅ **Network:**
- CORS validation
- JWT/Firebase token verification
- Rate limiting ready

✅ **Server-side:**
- Authentication middleware on all protected routes
- Database query parameterization (Prisma)
- No SQL injection vulnerabilities
- Error message filtering

✅ **Database:**
- User-scoped queries (no data leakage)
- Unique constraints on sensitive fields
- Automatic backups

---

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - 5-minute setup guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design & diagrams
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - All endpoints & WebSocket events
- **[BACKEND_SETUP.md](BACKEND_SETUP.md)** - Backend deployment options
- **[WEB_SETUP.md](WEB_SETUP.md)** - Web build & deployment
- **[MOBILE_SETUP.md](MOBILE_SETUP.md)** - Mobile build & deployment

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 Environment Variables

### Backend (.env)
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ruroxz_chat

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com

# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Web (.env)
```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=your-api-key
```

### Mobile (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👤 Author

**Dharshaneshwaran**
- GitHub: [@Dharshaneshwaran](https://github.com/Dharshaneshwaran)
- Repository: [ruroxz_chat](https://github.com/Dharshaneshwaran/ruroxz_chat)

---

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- Firebase for authentication & notifications
- Prisma for database management
- Zustand for state management
- React & React Native communities

---

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub:
[https://github.com/Dharshaneshwaran/ruroxz_chat/issues](https://github.com/Dharshaneshwaran/ruroxz_chat/issues)

---

## 🎯 Quick Links

- **Live Demo:** (Coming soon)
- **GitHub:** https://github.com/Dharshaneshwaran/ruroxz_chat
- **Issues:** https://github.com/Dharshaneshwaran/ruroxz_chat/issues
- **Discussions:** https://github.com/Dharshaneshwaran/ruroxz_chat/discussions

---

Made with ❤️ by Dharshaneshwaran | 2026
Last Updated: 2026-05-10 23:28:00 (IST)
