# 🐱 Whisker Meals — WhatsApp Bot Setup Guide

Sends you a WhatsApp message every **Wednesday & Sunday at 6pm** to remind you to feed the cats wet food.

---

## What you need
- A free [Twilio account](https://www.twilio.com/try-twilio) (~5 min signup)
- A free [Railway](https://railway.app) or [Render](https://render.com) account to host the bot (both have free tiers)
- [Node.js](https://nodejs.org) installed if running locally

---

## Step 1 — Set up Twilio WhatsApp Sandbox

1. Sign up at [twilio.com](https://www.twilio.com/try-twilio)
2. In the Twilio Console, go to **Messaging → Try it out → Send a WhatsApp message**
3. Follow the instructions to join the sandbox — you'll send a WhatsApp message like `join <word-word>` to a Twilio number
4. Note down your:
   - **Account SID** (starts with AC...)
   - **Auth Token**
   - **Sandbox WhatsApp number** (e.g. +14155238886)

---

## Step 2 — Configure the bot

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
2. Fill in your credentials:
   ```
   TWILIO_ACCOUNT_SID=ACxxxx...
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   YOUR_WHATSAPP_NUMBER=whatsapp:+447700900000
   ```
   *(Replace the last number with your own WhatsApp number including country code)*

---

## Step 3 — Run locally (optional test)

```bash
npm install
npm start
```

The bot will log `Whisker Meals bot running` and wait for the scheduled times. To test immediately, you can temporarily call `sendReminder()` on startup.

---

## Step 4 — Deploy to Railway (free hosting)

1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add your environment variables in Railway's **Variables** tab
4. Deploy! Railway will keep it running 24/7

Alternatively use **Render** (render.com) — same process, also free.

---

## Bonus: Reply "fed" to log it

Once the bot is running, you can reply **fed** or **done** to the WhatsApp message and the bot will confirm the meal is logged.

---

## Changing the reminder time

In `server.js`, find these lines and adjust the time (uses 24h format):

```js
// Wednesday at 6pm → change '18' to your preferred hour
cron.schedule('0 18 * * 3', ...)

// Sunday at 6pm
cron.schedule('0 18 * * 0', ...)
```

Also update the timezone if you're not in the UK:
```js
{ timezone: 'Europe/London' }
// Other options: 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', etc.
```
