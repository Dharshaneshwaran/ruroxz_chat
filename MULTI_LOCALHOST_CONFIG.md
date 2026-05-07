# RUROXZ CHAT - Multi-Localhost Configuration Guide

Complete guide for managing multiple localhost instances with independent configurations.

## 📋 Quick Start

### Option 1: Use the Enhanced Batch File (Recommended)
```bash
# Double-click this file:
start-multi-localhost.bat
```
Then select from the menu options.

### Option 2: Manual Terminal Commands
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: User 1 Frontend
cd web
npm run dev:user1

# Terminal 3: User 2 Frontend
cd web
npm run dev:user2
```

---

## 🔧 Configuration Files

### User 1 Configuration (`.env.user1`)
Located at: `web/.env.user1`

```env
PORT=5173
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_USER_INSTANCE=user1
VITE_INSTANCE_NAME=User 1
VITE_INSTANCE_COLOR=#6D28D9
```

### User 2 Configuration (`.env.user2`)
Located at: `web/.env.user2`

```env
PORT=5174
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_USER_INSTANCE=user2
VITE_INSTANCE_NAME=User 2
VITE_INSTANCE_COLOR=#7C3AED
```

---

## 🎛️ Available Startup Options

### 1. Full Setup (Backend + Both Frontends)
```bash
npm run dev:both
# or
start-multi-localhost.bat → Option 1
```
**Starts:**
- Backend on `http://localhost:3000`
- User 1 on `http://localhost:5173`
- User 2 on `http://localhost:5174`

### 2. Backend Only
```bash
cd backend && npm run dev
# or
start-multi-localhost.bat → Option 2
```

### 3. User 1 Frontend Only
```bash
cd web && npm run dev:user1
# or
start-multi-localhost.bat → Option 3
```

### 4. User 2 Frontend Only
```bash
cd web && npm run dev:user2
# or
start-multi-localhost.bat → Option 4
```

### 5. Both Frontends (Backend must run separately)
```bash
start-multi-localhost.bat → Option 5
```

---

## ⚙️ Customizing Configurations

### Change Ports
Edit `.env.user1` or `.env.user2`:
```env
PORT=5173  # Change to desired port
```

### Change API URL
If backend runs on different host/port:
```env
VITE_API_URL=http://your-backend-url:3000
VITE_SOCKET_URL=http://your-backend-url:3000
```

### Add Custom Variables
Both `.env` files support any custom variables:
```env
VITE_CUSTOM_VAR=value
VITE_ANOTHER_VAR=another_value
```

Access in your code:
```javascript
console.log(import.meta.env.VITE_CUSTOM_VAR)
```

### Different Firebase Keys Per User
You can set different Firebase configurations:
```env
VITE_FIREBASE_API_KEY=user1_key
VITE_FIREBASE_AUTH_DOMAIN=user1.domain
```

---

## 🚀 NPM Scripts Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start single dev instance |
| `npm run dev:user1` | Start User 1 with .env.user1 |
| `npm run dev:user2` | Start User 2 with .env.user2 |
| `npm run dev:both` | Start both instances concurrently |
| `npm run build` | Build for production |
| `npm run preview:user1` | Preview User 1 build on port 5173 |
| `npm run preview:user2` | Preview User 2 build on port 5174 |

---

## 🔌 Network Configuration

### Access Across Network
To access instances from other machines on your network:

1. Find your local IP:
   ```bash
   ipconfig  # Windows
   # Look for IPv4 Address (e.g., 192.168.x.x)
   ```

2. Use that IP instead of localhost:
   ```
   http://192.168.x.x:5173  # User 1
   http://192.168.x.x:5174  # User 2
   http://192.168.x.x:3000  # Backend
   ```

---

## 🛠️ Troubleshooting

### Port Already in Use
If a port is already in use, Vite will automatically use the next available port. Check the terminal output for the actual URL.

To manually change ports:
1. Edit `.env.user1` or `.env.user2`
2. Change the `PORT` variable to an unused port (e.g., 5175, 5176)

### Backend Not Responding
Ensure:
- Backend is running on port 3000
- Both `.env` files point to correct backend URL
- Firewall allows connections on these ports

### Changes Not Reflecting
- Restart the Vite dev server
- Clear browser cache
- Check `.env` files are saved correctly

### Multiple Instances Interfering
Each instance should:
- Have its own `.env` file with unique settings
- Use unique ports
- Be started in separate terminal windows

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────┐
│     RUROXZ CHAT - Multi-Localhost Setup     │
├─────────────────────────────────────────────┤
│                                             │
│  Backend Server                             │
│  ├─ Node.js + Express                      │
│  ├─ Port: 3000                             │
│  └─ Prisma + PostgreSQL                    │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  Frontend Instance 1 (User 1)               │
│  ├─ Config: .env.user1                     │
│  ├─ Port: 5173                             │
│  ├─ API: http://localhost:3000             │
│  └─ Socket: ws://localhost:3000            │
│                                             │
│  Frontend Instance 2 (User 2)               │
│  ├─ Config: .env.user2                     │
│  ├─ Port: 5174                             │
│  ├─ API: http://localhost:3000             │
│  └─ Socket: ws://localhost:3000            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 💡 Pro Tips

1. **Open Both in Same Browser**: Use incognito/private windows to avoid login conflicts
2. **Window Management**: Arrange terminal windows side-by-side for easy monitoring
3. **Real-time Testing**: Make changes in one terminal and see them in both browser instances
4. **Debugging**: Each instance can be debugged independently in browser DevTools
5. **Mobile Testing**: Run User 1 on web, User 2 on mobile with same backend

---

## 🎯 Use Cases

### 1. Testing Chat Between Two Users
```bash
start-multi-localhost.bat
# Select Option 1 (Full Setup)
# Log in as different users in each browser
# Test messaging between them
```

### 2. Feature Testing on Multiple Instances
```bash
# Make changes to code
# Both instances will hot-reload with your changes
# See behavior on both frontends simultaneously
```

### 3. Mobile + Web Testing
```bash
# Terminal 1: Backend
# Terminal 2: User 1 on web (localhost:5173)
# Connect mobile to: http://192.168.x.x:5174 for User 2
```

### 4. Custom Environment Testing
Edit `.env.user1` and `.env.user2` with different settings, then run both instances to compare behavior.

---

For more help, check the main README.md
