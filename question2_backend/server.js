import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { requestLogger, event } from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ urls: {} }, null, 2), 'utf8');
const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(requestLogger);
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}
const BASE = (req) => {
  const host = req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'http';
  return `${proto}://${host}`;
};
const isValidUrl = (u) => {
  try { new URL(u); return true; } catch { return false; }
};
const isValidShortcode = (s) => /^[A-Za-z0-9]{4,20}$/.test(s);
function genCode(db, size = 6) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  while (true) {
    let code = Array.from(crypto.randomBytes(size)).map(b => alphabet[b % alphabet.length]).join('');
    if (!db.urls[code]) return code;
  }
}
app.get('/:code', (req, res, next) => {
  const { code } = req.params;
  if (code === 'shorturls') return next();
  const db = readDB();
  const entry = db.urls[code];
  if (!entry) {
    event('redirect_not_found', { code });
    return res.status(404).json({ error: 'Shortcode not found' });
  }
  if (Date.now() > new Date(entry.expiry).getTime()) {
    event('redirect_expired', { code });
    return res.status(410).json({ error: 'Link expired' });
  }
  const click = {
    at: new Date().toISOString(),
    referrer: req.get('referer') || req.get('referrer') || 'direct',
    location: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
      .toString()
      .split(',')[0]
      .replace('::ffff:', '')
  };
  entry.clicks.push(click);
  writeDB(db);
  event('redirect', { code, to: entry.url });
  res.redirect(entry.url);
});
app.post('/shorturls', (req, res) => {
  const { url, validity, shortcode } = req.body || {};
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid or missing url' });
  }
  let minutes = 30;
  if (validity !== undefined) {
    if (!Number.isInteger(validity) || validity <= 0) {
      return res.status(400).json({ error: 'validity must be a positive integer (minutes)' });
    }
    minutes = validity;
  }
  const db = readDB();
  let code;
  if (shortcode !== undefined && shortcode !== null && shortcode !== '') {
    if (!isValidShortcode(shortcode)) {
      return res.status(400).json({ error: 'shortcode must be alphanumeric, 4–20 chars' });
    }
    if (db.urls[shortcode]) {
      return res.status(409).json({ error: 'shortcode already in use' });
    }
    code = shortcode;
  } else {
    code = genCode(db, 6);
  }
  const now = new Date();
  const expiry = new Date(now.getTime() + minutes * 60 * 1000);
  db.urls[code] = {
    code,
    url,
    createdAt: now.toISOString(),
    expiry: expiry.toISOString(),
    clicks: []
  };
  writeDB(db);
  event('short_created', { code, url, expiry: expiry.toISOString() });
  return res.status(201).json({
    shortLink: `${BASE(req)}/${code}`,
    expiry: expiry.toISOString()
  });
});
app.get('/shorturls/:code', (req, res) => {
  const { code } = req.params;
  const db = readDB();
  const entry = db.urls[code];
  if (!entry) {
    return res.status(404).json({ error: 'Shortcode not found' });
  }
  const total = entry.clicks.length;
  return res.json({
    shortcode: code,
    originalUrl: entry.url,
    createdAt: entry.createdAt,
    expiry: entry.expiry,
    totalClicks: total,
    clicks: entry.clicks
  });
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});