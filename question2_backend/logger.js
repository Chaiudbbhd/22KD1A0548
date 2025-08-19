import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '', 'utf8');
function write(lineObj) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...lineObj }) + '\n';
  fs.appendFile(LOG_FILE, line, () => {});
}
export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;
  res.on('finish', () => {
    write({
      type: 'http',
      method,
      url: originalUrl,
      status: res.statusCode,
      duration_ms: Date.now() - start,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });
  });
  next();
}
export function event(type, payload = {}) {
  write({ type, ...payload });
}
