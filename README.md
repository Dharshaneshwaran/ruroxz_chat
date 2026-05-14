# ruroxz chat 💬

A modern, real-time chat application with a premium UI, supporting direct messages, group chats, and real-time notifications.

## 🚀 Features
- **Real-time Messaging**: Instant message delivery using Socket.io.
- **Group Chats**: Create and manage group conversations.
- **Premium Design**: Sleek dark-mode interface with vibrant purple accents.
- **Authentication**: Easy email-based sign-in.
- **Firebase Integration**: Supports Firebase tokens for cross-platform compatibility.
- **File/Image Support**: Cloudinary integration for media sharing (optional).

## 🛠️ Technology Stack
- **Frontend**: React (Vite), Zustand (State Management), Axios, Socket.io-client.
- **Backend**: Node.js, Express, Prisma (PostgreSQL), Socket.io, Firebase Admin SDK.
- **Mobile**: React Native / Expo (in progress).

## 📦 Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (or Supabase)
- Firebase Project (for Admin SDK)

### 1. Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your credentials:
   - `DATABASE_URL`: Your PostgreSQL connection string.
   - `FIREBASE_*`: Your Firebase Service Account details.
   - `JWT_SECRET`: A secure string for signing tokens.
4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
5. Run migrations (if needed):
   ```bash
   npm run prisma:push
   ```

### 2. Web Frontend Setup
1. Navigate to the `web` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file:
   - `VITE_API_URL`: `http://localhost:3000`
   - `VITE_SOCKET_URL`: `http://localhost:3000`

## 🏃 Running the Application

### Option 1: Using the Batch Script (Recommended)
Run the `start-multi-localhost.bat` script in the root directory to start everything at once:
- **Option 1**: Starts Backend + User 1 (Port 5173) + User 2 (Port 5174).

### Option 2: Manual Start
- **Backend**: `cd backend && npm run dev`
- **Frontend**: `cd web && npm run dev`

## 🛠️ Troubleshooting

### Login Issues?
If you are unable to go past the login page:
1. **Check Backend**: Ensure the backend is running on port 3000 (`netstat -ano | findstr :3000`).
2. **Database**: Verify your `DATABASE_URL` is correct and accessible.
3. **Firebase**: Ensure your Firebase Private Key in `.env` is correctly formatted (with `\n` characters).
4. **Console Logs**: Check the browser's Inspect -> Console for any "Network Error" messages.

---
Built with ❤️ by the ruroxz team.
