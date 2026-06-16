const { sendMessage } = require('./telegram');

const TARGET_CHAT_ID = process.env.TARGET_CHAT_ID;
const TARGET_BOT_TOKEN = process.env.TARGET_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

const REPEAT_COUNT = 10;
const REPEAT_INTERVAL_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deliverToTarget(text) {
  if (!TARGET_BOT_TOKEN) {
    throw new Error('TARGET_BOT_TOKEN is not configured');
  }
  if (!TARGET_CHAT_ID) {
    throw new Error('TARGET_CHAT_ID is not configured');
  }

  for (let i = 0; i < REPEAT_COUNT; i++) {
    await sendMessage(TARGET_CHAT_ID, text, {}, TARGET_BOT_TOKEN);
    if (i < REPEAT_COUNT - 1) {
      await sleep(REPEAT_INTERVAL_MS);
    }
  }
}

module.exports = {
  deliverToTarget,
  REPEAT_COUNT,
  REPEAT_INTERVAL_MS,
};
