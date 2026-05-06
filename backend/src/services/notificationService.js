const admin = require('../config/firebase');

const sendPushNotification = async ({ token, title, body, data = {} }) => {
  if (!token) return;
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });
  } catch (error) {
    console.error('Push notification error:', error.message);
  }
};

module.exports = { sendPushNotification };
