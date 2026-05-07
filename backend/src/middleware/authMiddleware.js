const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');
const prisma = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'ruroxz-chat-secret';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];

    let decoded;
    let user;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
      user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    } catch (jwtError) {
      decoded = await admin.auth().verifyIdToken(token);
      user = await prisma.user.findUnique({ where: { id: decoded.uid } });
    }

    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
