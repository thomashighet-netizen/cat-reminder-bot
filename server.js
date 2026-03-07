// 🐱 Whisker Meals — WhatsApp + Web Push Reminder Bot
// Sends WhatsApp AND web push notifications every Wednesday & Sunday evening

const express = require('express');
const cron = require('node-cron');
const twilio = require('twilio');
const webpush = require('web-push');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Allow requests from your Netlify app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const ACCOUNT_SID  = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER  = process.env.TWILIO_WHATSAPP_FROM;
const TO_NUMBER    = process.env.YOUR_WHATSAPP_NUMBER;

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL   = process.env.VAPID_EMAIL || 'mailto:you@example.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
  console.log('✅ Web push configured');
} else {
  console.warn('⚠️  VAPID keys not set — web push disabled');
}

const twilioClient = ACCOUNT_SID && AUTH_TOKEN ? twilio(ACCOUNT_SID, AUTH_TOKEN) : null;

// ─── SUBSCRIPTION STORE ──────────────────────────────────────────────────────
const subscriptions = new Set();

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.post('/subscribe', (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
  subscriptions.add(JSON.stringify(sub));
  console.log(`📱 New push subscription. Total: ${subscriptions.size}`);
  res.json({ ok: true });
});

app.get('/vapid-public-key', (req, res) => {
  res.json({ key: VAPID_PUBLIC || '' });
});

// ─── SEND FUNCTIONS ──────────────────────────────────────────────────────────
const REMINDER_MESSAGES = [
  '🐟 Wet food time! Your cats are waiting for their evening meal.',
  '😺 Mrow! Your cats say it\'s wet food evening. Time to open a pouch!',
  '🐱 Don\'t forget — it\'s wet food night for the cats!',
];

async function sendWhatsApp() {
  if (!twilioClient) return;
  const message = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
  try {
    await twilioClient.messages.create({ body: message, from: FROM_NUMBER, to: TO_NUMBER });
    console.log('✅ WhatsApp sent!');
  } catch (err) {
    console.error('❌ WhatsApp failed:', err.message);
  }
}

async function sendWebPush() {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;
  const message = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
  const payload = JSON.stringify({
    title: '🐱 Whisker Meals',
    body: message,
    icon: '/icon-192.png',
    tag: 'whisker-reminder',
    requireInteraction: true,
  });

  const failed = [];
  for (const subStr of subscriptions) {
    try {
      await webpush.sendNotification(JSON.parse(subStr), payload);
      console.log('✅ Push sent!');
    } catch (err) {
      if (err.statusCode === 410) failed.push(subStr);
    }
  }
  failed.forEach(s => subscriptions.delete(s));
}

async function sendAllReminders() {
  await sendWhatsApp();
  await sendWebPush();
}

// ─── SCHEDULE ────────────────────────────────────────────────────────────────
cron.schedule('0 18 * * 3', () => { console.log('📅 Wednesday!'); sendAllReminders(); }, { timezone: 'Europe/London' });
cron.schedule('0 18 * * 0', () => { console.log('📅 Sunday!'); sendAllReminders(); }, { timezone: 'Europe/London' });

console.log('🐱 Whisker Meals running. Wed & Sun at 6pm.');

// ─── TEST ─────────────────────────────────────────────────────────────────────
app.get('/test', async (req, res) => {
  await sendAllReminders();
  res.send(`<html><body style="font-family:sans-serif;background:#0f0f1a;color:white;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px">
    <h1>🐟 Test sent!</h1><p style="color:#aaa">Check your phone for WhatsApp + push notification</p>
    <a href="/test" style="color:#a78bfa;border:1px solid #a78bfa;padding:10px 20px;border-radius:8px;text-decoration:none">Send again</a>
  </body></html>`);
});

// ─── TWILIO WEBHOOK ───────────────────────────────────────────────────────────
app.post('/webhook', (req, res) => {
  const body = (req.body.Body || '').trim().toLowerCase();
  let reply = ['fed','done','yes'].includes(body)
    ? '✅ Logged! Great job feeding the cats 🐾'
    : body === 'help'
    ? 'Reply *fed* when cats are fed. Reminders: Wed & Sun at 6pm.'
    : 'Hi! Reply *fed* when the cats have been fed 🐱';
  res.set('Content-Type', 'text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${reply}</Message></Response>`);
});

app.get('/', (req, res) => res.send('🐱 Whisker Meals running! <a href="/test">/test</a>'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
