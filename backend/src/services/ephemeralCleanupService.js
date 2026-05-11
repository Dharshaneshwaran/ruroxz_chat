const prisma = require('../config/db');

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

const deleteExpiredMessages = async () => {
  try {
    const result = await prisma.message.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    if (result.count > 0) {
      console.log(`Deleted ${result.count} expired snap message(s)`);
    }
  } catch (error) {
    console.error('deleteExpiredMessages error:', error);
  }
};

const startEphemeralCleanup = () => {
  deleteExpiredMessages();
  return setInterval(deleteExpiredMessages, CLEANUP_INTERVAL_MS);
};

module.exports = { startEphemeralCleanup, deleteExpiredMessages };
