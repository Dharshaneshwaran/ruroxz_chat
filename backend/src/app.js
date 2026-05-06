require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

const clientOrigins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim()) : ['*'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || clientOrigins.includes('*') || clientOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/chats', chatRoutes);
app.use('/chats/:chatId/messages', messageRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

module.exports = app;
