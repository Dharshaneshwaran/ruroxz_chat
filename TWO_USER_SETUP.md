# Two-User Chat Testing Setup

This setup allows you to run two separate instances of the chat application to simulate a conversation between two users.

## How to Run

1. **Start all services at once:**
   - Double-click `start-two-chats.bat` in the root directory
   - This will start:
     - Backend server on port 3000
     - User 1 frontend (starts on 5173 or next available port)
     - User 2 frontend (starts on 5174 or next available port)

2. **Manual startup (alternative):**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev

   # Terminal 2: Start User 1 frontend
   cd web
   npm run dev:user1

   # Terminal 3: Start User 2 frontend
   cd web
   npm run dev:user2
   ```

## Usage

1. Open two browser windows/tabs with the URLs shown in the terminal output
   - User 1: Usually http://localhost:5173 (or next available port)
   - User 2: Usually http://localhost:5174 (or next available port)

2. Log in with different accounts in each window

3. In one window, start a chat with the other user's ID, email, or phone

4. Start messaging between the two instances!

## Available Scripts

- `npm run dev:user1` - Start frontend on port 5173 (or next available)
- `npm run dev:user2` - Start frontend on port 5174 (or next available)
- `run-two-chats.bat` - Start only the two frontend instances
- `start-two-chats.bat` - Start backend + both frontends

## Troubleshooting

- Make sure the backend is running on port 3000
- Check terminal output for actual port numbers if 5173/5174 are in use
- Clear browser cache if you encounter login issues
- Each browser window should use a different user account