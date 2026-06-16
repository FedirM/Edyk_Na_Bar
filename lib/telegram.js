const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function telegramApi(method, body) {
  const response = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Telegram API ${method} failed: ${data.description}`);
  }
  return data.result;
}

function sendMessage(chatId, text, options = {}) {
  return telegramApi('sendMessage', { chat_id: chatId, text, ...options });
}

function answerCallbackQuery(callbackQueryId, text) {
  return telegramApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
  });
}

function editMessageText(chatId, messageId, text, options = {}) {
  return telegramApi('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    ...options,
  });
}

function forwardMessage(fromChatId, messageId, toChatId) {
  return telegramApi('forwardMessage', {
    chat_id: toChatId,
    from_chat_id: fromChatId,
    message_id: messageId,
  });
}

module.exports = {
  sendMessage,
  answerCallbackQuery,
  editMessageText,
  forwardMessage,
};
