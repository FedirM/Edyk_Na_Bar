const {
  sendMessage,
  answerCallbackQuery,
  editMessageText,
} = require('../lib/telegram');

const TARGET_CHAT_ID = process.env.TARGET_CHAT_ID;
const TARGET_BOT_TOKEN = process.env.TARGET_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const SEND_KEYBOARD = {
  inline_keyboard: [
    [
      { text: 'Send', callback_data: 'send' },
      { text: 'Cancel', callback_data: 'cancel' },
    ],
  ],
};

function formatSenderLabel(from) {
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ');
  const username = from.username ? `@${from.username}` : 'no username';
  return `${name} (${username}, id: ${from.id})`;
}

function formatRelayText(from, text) {
  return `📩 Message from ${formatSenderLabel(from)}\n\n${text}`;
}

async function deliverToTarget(text) {
  if (!TARGET_CHAT_ID) {
    throw new Error('TARGET_CHAT_ID is not configured');
  }
  return sendMessage(TARGET_CHAT_ID, text, {}, TARGET_BOT_TOKEN);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.headers['x-telegram-bot-api-secret-token'] !== WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const update = req.body;

  try {
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return res.status(200).json({ ok: true });
    }

    if (update.message) {
      await handleMessage(update.message);
      return res.status(200).json({ ok: true });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

async function handleCallbackQuery(callbackQuery) {
  const { data, id, message } = callbackQuery;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  if (data === 'cancel') {
    await answerCallbackQuery(id, 'Cancelled');
    await editMessageText(chatId, messageId, 'Cancelled.');
    return;
  }

  if (data === 'send') {
    const reply = message.reply_to_message;
    const text = reply?.text;
    if (!text) {
      await answerCallbackQuery(id, 'No message to send');
      return;
    }

    const author = reply.from || callbackQuery.from;

    try {
      await deliverToTarget(formatRelayText(author, text));
      await answerCallbackQuery(id, 'Sent!');
      await editMessageText(chatId, messageId, 'Sent to staff.');
    } catch (err) {
      console.error('Send failed:', err);
      await answerCallbackQuery(id, 'Failed to send');
      await editMessageText(
        chatId,
        messageId,
        `Failed to send: ${err.message}`
      );
    }
  }
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text;

  if (!text) return;

  if (text.startsWith('/start')) {
    await sendMessage(
      chatId,
      'Send any text message. Tap Send to deliver it to staff.'
    );
    return;
  }

  if (text.startsWith('/')) return;

  await sendMessage(chatId, 'Send this message to staff?', {
    reply_to_message_id: message.message_id,
    reply_markup: SEND_KEYBOARD,
  });
}
