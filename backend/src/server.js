require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const chatSocket = require('./sockets/chatSocket');
const { startEphemeralCleanup } = require('./services/ephemeralCleanupService');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

chatSocket(io);
startEphemeralCleanup();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
