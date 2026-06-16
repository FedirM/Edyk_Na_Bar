const { sendMessage } = require('../lib/telegram');

const TARGET_CHAT_ID = process.env.TARGET_CHAT_ID;
const TARGET_BOT_TOKEN = process.env.TARGET_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function configError(res) {
  if (!TARGET_BOT_TOKEN) {
    return 'TARGET_BOT_TOKEN is not set in Vercel environment variables';
  }
  if (!TARGET_CHAT_ID) {
    return 'TARGET_CHAT_ID is not set in Vercel environment variables';
  }
  return null;
}

module.exports = async (req, res) => {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const misconfigured = configError(res);
  if (misconfigured) {
    console.error('Order config error:', misconfigured);
    return res.status(500).json({ error: misconfigured });
  }

  const { table, strength, tastes, comments } = req.body || {};

  if (!table) {
    return res.status(400).json({ error: 'Table number is required' });
  }

  const tastesText = Array.isArray(tastes) && tastes.length > 0
    ? tastes.join(', ')
    : 'Не выбрано';
  const commentsText = comments?.trim() || 'Нет особых пожеланий';

  const message =
    `🚨 НОВЫЙ ЗАКАЗ КАЛЬЯНА 🚨\n\n` +
    `🪑 Стол №: ${table}\n` +
    `💪 Крепость: ${strength || 'Средний (Medium)'}\n` +
    `🍓 Профиль вкуса: ${tastesText}\n` +
    `📝 Комментарий: ${commentsText}`;

  try {
    await sendMessage(TARGET_CHAT_ID, message, {}, TARGET_BOT_TOKEN);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Order failed:', err);
    return res.status(500).json({ error: err.message });
  }
};
