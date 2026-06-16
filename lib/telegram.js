function apiBase(token) {
  return `https://api.telegram.org/bot${token}`;
}

async function telegramApi(method, body, token = process.env.TELEGRAM_BOT_TOKEN) {
  if (!token) {
    throw new Error('Telegram bot token is not configured');
  }

  const response = await fetch(`${apiBase(token)}/${method}`, {
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

function sendMessage(chatId, text, options = {}, token) {
  return telegramApi('sendMessage', { chat_id: chatId, text, ...options }, token);
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

function forwardMessage(fromChatId, messageId, toChatId, token) {
  return telegramApi(
    'forwardMessage',
    { chat_id: toChatId, from_chat_id: fromChatId, message_id: messageId },
    token
  );
}

function copyMessage(toChatId, fromChatId, messageId, token) {
  return telegramApi(
    'copyMessage',
    { chat_id: toChatId, from_chat_id: fromChatId, message_id: messageId },
    token
  );
}

module.exports = {
  sendMessage,
  answerCallbackQuery,
  editMessageText,
  forwardMessage,
  copyMessage,
};
