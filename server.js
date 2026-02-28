// 🐱 Whisker Meals — WhatsApp Reminder Bot
// Sends a WhatsApp reminder every Wednesday & Sunday evening
// Built with Twilio + Node.js

const express = require('express');
const cron = require('node-cron');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ─── CONFIG ─────────────────────────────────────────────────────────────────
// Fill these in from your Twilio dashboard + .env file
const ACCOUNT_SID  = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER  = process.env.TWILIO_WHATSAPP_FROM;  // e.g. 'whatsapp:+14155238886'
const TO_NUMBER    = process.env.YOUR_WHATSAPP_NUMBER;  // e.g. 'whatsapp:+447700900000'

const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

// ─── SEND REMINDER ──────────────────────────────────────────────────────────
async function sendReminder() {
  const messages = [
    '🐱 *Wet food time!* Your cats are waiting for their evening meal. Don\'t forget to log it in the tracker!',
    '🐟 *Reminder:* It\'s wet food night for the cats! Serve it up and stay on schedule.',
    '😺 *Mrow!* Your cats say it\'s wet food evening. Time to open a pouch!',
  ];
  const message = messages[Math.floor(Math.random() * messages.length)];

  try {
    const result = await client.messages.create({
      body: message,
      from: FROM_NUMBER,
      to: TO_NUMBER,
    });
    console.log(`✅ Reminder sent! SID: ${result.sid}`);
  } catch (err) {
    console.error('❌ Failed to send reminder:', err.message);
  }
}

// ─── SCHEDULE ───────────────────────────────────────────────────────────────
// Every Wednesday at 6:00 PM
cron.schedule('0 18 * * 3', () => {
  console.log('📅 Wednesday reminder firing...');
  sendReminder();
}, { timezone: 'Europe/London' }); // ← change to your timezone if needed

// Every Sunday at 6:00 PM
cron.schedule('0 18 * * 0', () => {
  console.log('📅 Sunday reminder firing...');
  sendReminder();
}, { timezone: 'Europe/London' });

console.log('🐱 Whisker Meals bot running. Reminders scheduled for Wed & Sun at 6pm.');

// ─── OPTIONAL: WEBHOOK (receive replies from WhatsApp) ──────────────────────
// If someone replies "fed" or "done", it logs it
app.post('/webhook', (req, res) => {
  const body = (req.body.Body || '').trim().toLowerCase();
  const from = req.body.From;

  let reply = '';

  if (['fed', 'done', 'yes', '✓', '✅'].includes(body)) {
    reply = '✅ Logged! Great job feeding the cats 🐾 See you next time.';
  } else if (body === 'help') {
    reply = 'Reply *fed* or *done* to log today\'s meal. Reminders fire every Wed & Sun at 6pm.';
  } else {
    reply = 'Hi! Reply *fed* when you\'ve given the cats their wet food, or *help* for more info 🐱';
  }

  // Respond with TwiML
  res.set('Content-Type', 'text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${reply}</Message>
</Response>`);
});

// ─── TEST ENDPOINT ──────────────────────────────────────────────────────────
app.get('/test', async (req, res) => {
  await sendReminder();
  res.send(`
    <html>
      <head>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f0f1a; color: white; flex-direction: column; gap: 16px; }
          h1 { font-size: 2rem; }
          p { color: #aaa; }
          a { color: #a78bfa; text-decoration: none; border: 1px solid #a78bfa; padding: 10px 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>🐟 Test message sent!</h1>
        <p>Check your WhatsApp — a reminder should arrive shortly.</p>
        <a href="/test">Send another</a>
      </body>
    </html>
  `);
});

// ─── HEALTH CHECK ───────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('🐱 Whisker Meals bot is running! Visit <a href="/test">/test</a> to send a test WhatsApp message.'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
