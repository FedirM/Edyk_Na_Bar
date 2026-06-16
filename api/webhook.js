const {
  sendMessage,
  answerCallbackQuery,
  editMessageText,
  copyMessage,
} = require('../lib/telegram');

const TARGET_CHAT_ID = process.env.TARGET_CHAT_ID;
const ALLOWED_USER_ID = process.env.ALLOWED_USER_ID
  ? Number(process.env.ALLOWED_USER_ID)
  : null;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const SEND_KEYBOARD = {
  inline_keyboard: [
    [
      { text: 'Send', callback_data: 'send' },
      { text: 'Cancel', callback_data: 'cancel' },
    ],
  ],
};

function isAllowedUser(userId) {
  if (ALLOWED_USER_ID === null) return true;
  return userId === ALLOWED_USER_ID;
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

function isSameChat(a, b) {
  return String(a) === String(b);
}

async function deliverToTarget(fromChatId, messageId, text) {
  if (!TARGET_CHAT_ID) {
    throw new Error('TARGET_CHAT_ID is not configured');
  }

  try {
    return await copyMessage(TARGET_CHAT_ID, fromChatId, messageId);
  } catch (copyError) {
    console.warn('copyMessage failed, falling back to sendMessage:', copyError.message);
    return sendMessage(TARGET_CHAT_ID, text);
  }
}

async function handleCallbackQuery(callbackQuery) {
  const userId = callbackQuery.from.id;
  if (!isAllowedUser(userId)) {
    await answerCallbackQuery(callbackQuery.id, 'Not authorized');
    return;
  }

  const { data, id, message } = callbackQuery;
  const chatId = message.chat.id;
  const messageId = message.message_id;

  if (data === 'cancel') {
    await answerCallbackQuery(id, 'Cancelled');
    await editMessageText(chatId, messageId, 'Cancelled.');
    return;
  }

  if (data === 'send') {
    const text = message.reply_to_message?.text;
    if (!text) {
      await answerCallbackQuery(id, 'No message to send');
      return;
    }

    if (isSameChat(chatId, TARGET_CHAT_ID)) {
      await answerCallbackQuery(
        id,
        'TARGET_CHAT_ID matches this chat — use a group/channel id'
      );
      await editMessageText(
        chatId,
        messageId,
        'Cannot deliver: TARGET_CHAT_ID is the same as this chat. Use a group where both bots are members, then set TARGET_CHAT_ID to that group id.'
      );
      return;
    }

    try {
      const posted = await sendMessage(chatId, text);
      await deliverToTarget(chatId, posted.message_id, text);
      await answerCallbackQuery(id, 'Sent!');
      await editMessageText(chatId, messageId, 'Posted and sent to target chat.');
    } catch (err) {
      console.error('Send failed:', err);
      await answerCallbackQuery(id, 'Failed to send');
      await editMessageText(
        chatId,
        messageId,
        `Failed to send to target chat: ${err.message}`
      );
    }
  }
}

async function handleMessage(message) {
  const userId = message.from.id;
  const chatId = message.chat.id;
  const text = message.text;

  if (!text) return;

  if (text.startsWith('/start')) {
    if (!isAllowedUser(userId)) return;
    await sendMessage(
      chatId,
      'Send me any text message. Tap Send to post it here and forward it to Bot B.'
    );
    return;
  }

  if (text.startsWith('/')) return;

  if (!isAllowedUser(userId)) return;

  await sendMessage(chatId, 'Post this in chat and forward to Bot B?', {
    reply_to_message_id: message.message_id,
    reply_markup: SEND_KEYBOARD,
  });
}
