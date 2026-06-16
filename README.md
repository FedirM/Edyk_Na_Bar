# Edyk Na Bar — Telegram Bot Relay

A minimal Vercel serverless app with two entry points:

- **Sender bot** — anyone can message it; tapping Send delivers to staff via the target bot
- **Hookah order page** — web form at `/` that posts orders to the same staff chat

## How it works

### Sender bot
1. Anyone sends text to the sender bot in Telegram.
2. The bot shows **Send** / **Cancel** buttons.
3. Tapping **Send** delivers the message to staff using the **target bot token** (same chat as the hookah website).

Each relayed message includes the sender's name, username, and id.

### Hookah website
1. Customer opens your Vercel URL (`/`).
2. Fills the order form and submits.
3. Server sends the formatted order to staff via `TARGET_BOT_TOKEN` → `TARGET_CHAT_ID`.

## Prerequisites

- A Telegram **sender bot** token from [@BotFather](https://t.me/BotFather)
- The **target chat ID** where your second bot receives updates
- Your Telegram **user ID** (optional but recommended)
- A [Vercel](https://vercel.com) account

## Environment variables

Copy `.env.example` to `.env` for local reference. Set these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Sender bot token (public-facing, receives customer messages) |
| `TARGET_BOT_TOKEN` | Staff/target bot token (delivers to staff chat — same bot as hookah site) |
| `TARGET_CHAT_ID` | Staff chat id (e.g. `5184403466` from your hookah site config) |
| `WEBHOOK_SECRET` | Random string; must match the value used in `setWebhook` |

### Finding your user ID

Message [@userinfobot](https://t.me/userinfobot) on Telegram — it replies with your numeric ID.

### Finding / confirming TARGET_CHAT_ID

Use the same chat id as your hookah website (`TG_CHAT_ID`). This is the staff chat where the **target bot** already delivers orders.

To confirm, temporarily delete the target bot webhook and call `getUpdates`, or add [@getidsbot](https://t.me/getidsbot) to the chat.

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

### Sender bot (Telegram)
1. Anyone opens the sender bot and sends `/start`.
2. Send any text message.
3. Tap **Send** to deliver it to staff, or **Cancel** to discard.

### Hookah website
1. Deploy to Vercel — the order form is served at `/`.
2. Customers submit orders; they arrive in the same staff chat as bot messages.

## Project structure

```
api/webhook.js    — Sender bot webhook (open to everyone)
api/order.js      — Hookah order form API
public/index.html — Hookah order page
lib/telegram.js   — Telegram Bot API helpers
vercel.json       — Vercel configuration
```
