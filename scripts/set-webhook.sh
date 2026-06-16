#!/usr/bin/env bash
set -euo pipefail

# Registers the Telegram webhook after Vercel deploy.
# Usage: TELEGRAM_BOT_TOKEN=... WEBHOOK_SECRET=... VERCEL_URL=... ./scripts/set-webhook.sh

: "${TELEGRAM_BOT_TOKEN:?Set TELEGRAM_BOT_TOKEN}"
: "${WEBHOOK_SECRET:?Set WEBHOOK_SECRET}"
: "${VERCEL_URL:?Set VERCEL_URL (e.g. https://edyk-na-bar.vercel.app)}"

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${VERCEL_URL}/api/webhook\",
    \"secret_token\": \"${WEBHOOK_SECRET}\",
    \"allowed_updates\": [\"message\", \"callback_query\"]
  }" | python3 -m json.tool

echo ""
echo "Webhook info:"
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool
