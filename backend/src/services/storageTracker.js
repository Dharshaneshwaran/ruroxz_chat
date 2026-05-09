const fs = require('fs');
const path = require('path');
const axios = require('axios');

const STATS_FILE = path.join(__dirname, '../../storage_stats.json');
const MAX_BYTES = 8 * 1024 * 1024 * 1024; // 8 GB
const MILESTONE_BYTES = 500 * 1024 * 1024; // 500 MB
const ALERT_EMAIL = 'dharshaneshwaran@gmail.com';

function readStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    }
  } catch (_) {}
  return { totalBytes: 0, lastMilestone: 0 };
}

function writeStats(stats) {
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

function getStorageUsed() {
  return readStats().totalBytes;
}

async function sendStorageAlert(totalBytes) {
  const usedMB = Math.round(totalBytes / (1024 * 1024));
  const usedGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'WhatApp Clone',
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: ALERT_EMAIL }],
        subject: `Storage Alert: ${usedMB}MB used on WhatApp Clone R2`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
            <h2 style="color:#25D366">WhatApp Clone — Storage Alert</h2>
            <p>Your R2 bucket <strong>(chatmedia)</strong> has reached <strong>${usedMB} MB (${usedGB} GB)</strong> of media storage.</p>
            <p>The hard limit is <strong>8 GB</strong>. Uploads will be blocked once that limit is hit.</p>
            <p style="color:#888;font-size:13px">This is an automated alert sent every 500 MB of usage.</p>
          </div>
        `,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`[Storage] Alert email sent — ${usedMB}MB used`);
  } catch (err) {
    console.error('[Storage] Failed to send alert email:', err.message);
  }
}

async function addBytes(bytes) {
  const stats = readStats();
  const prevMilestone = Math.floor(stats.totalBytes / MILESTONE_BYTES);
  stats.totalBytes += bytes;
  const newMilestone = Math.floor(stats.totalBytes / MILESTONE_BYTES);

  if (newMilestone > prevMilestone) {
    stats.lastMilestone = newMilestone;
    writeStats(stats);
    await sendStorageAlert(stats.totalBytes);
  } else {
    writeStats(stats);
  }

  return stats.totalBytes;
}

module.exports = { getStorageUsed, addBytes, MAX_BYTES };
