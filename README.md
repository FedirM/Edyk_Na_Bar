# Edyk Na Bar — Telegram Bot Relay

A minimal Vercel serverless app that lets you compose a message in your **sender bot**, confirm with an inline **Send** button, and forward it to a **target chat** where your second bot listens.

## How it works

1. You send text to the sender bot in Telegram.
2. The bot replies with a preview and **Send** / **Cancel** buttons.
3. Tapping **Send** posts the message in your chat with the sender bot, then forwards it to `TARGET_CHAT_ID`.

## Prerequisites

- A Telegram **sender bot** token from [@BotFather](https://t.me/BotFather)
- The **target chat ID** where your second bot receives updates
- Your Telegram **user ID** (optional but recommended)
- A [Vercel](https://vercel.com) account

## Environment variables

Copy `.env.example` to `.env` for local reference. Set these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Sender bot token from BotFather |
| `TARGET_CHAT_ID` | Chat ID where the second bot receives messages |
| `ALLOWED_USER_ID` | Your Telegram user ID — blocks other users |
| `WEBHOOK_SECRET` | Random string; must match the value used in `setWebhook` |

### Finding your user ID

Message [@userinfobot](https://t.me/userinfobot) on Telegram — it replies with your numeric ID.

### Finding / confirming TARGET_CHAT_ID

1. Send a message in the chat where Bot B should receive relayed text.
2. Call `getUpdates` with the **second bot's** token:

```bash
curl "https://api.telegram.org/bot<SECOND_BOT_TOKEN>/getUpdates"
```

Use the `message.chat.id` value from the response.

> **Note:** If the target is a group, your second bot may need privacy mode disabled (`/setprivacy` → Disable in BotFather) to see messages from another bot.

## Local development

Run the serverless API locally (no `npm run dev` — that causes a recursive loop with Vercel):

```bash
vercel dev
```

Load env vars from `.env` when prompted, or pull them from Vercel:

```bash
vercel env pull .env.local
vercel dev
```

API endpoint: `http://localhost:3000/api/webhook`

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com) and connect the repository.
3. Add all four environment variables for Production.
4. Deploy — note your deployment URL (e.g. `https://edyk-na-bar.vercel.app`).

## Register the Telegram webhook

Run once after deploy (replace placeholders):

```bash
curl -X POST "https://api.telegram.org/bot<SENDER_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<your-vercel-app>.vercel.app/api/webhook",
    "secret_token": "<WEBHOOK_SECRET>",
    "allowed_updates": ["message", "callback_query"]
  }'
```

Verify:

```bash
curl "https://api.telegram.org/bot<SENDER_TOKEN>/getWebhookInfo"
```

Or use the helper script after deploy:

```bash
TELEGRAM_BOT_TOKEN=<token> \
WEBHOOK_SECRET=<secret> \
VERCEL_URL=https://<your-vercel-app>.vercel.app \
./scripts/set-webhook.sh
```

## Usage

1. Open your sender bot in Telegram and send `/start`.
2. Send any text message.
3. Tap **Send** to post it in your chat and forward it to the target chat, or **Cancel** to discard.

## Project structure

```
api/webhook.js    — Vercel serverless handler
lib/telegram.js   — Telegram Bot API helpers
vercel.json       — Vercel configuration
```
