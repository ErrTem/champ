/**
 * Injects API_PUBLIC_URL (and optional VAPID_PUBLIC_KEY) into environment.prod.ts
 * before `ng build` on Render. Keeps repo default for local production builds.
 */
const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
let s = fs.readFileSync(envFile, 'utf8');

const apiUrl = process.env.API_PUBLIC_URL || 'https://champ-api.onrender.com';
const vapid = process.env.VAPID_PUBLIC_KEY || '';

function esc(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

s = s.replace(/apiUrl:\s*'[^']*'/, `apiUrl: '${esc(apiUrl)}'`);
s = s.replace(/vapidPublicKey:\s*'[^']*'/, `vapidPublicKey: '${esc(vapid)}'`);

fs.writeFileSync(envFile, s);
console.log('[render-inject-api-url] apiUrl=%s vapid=%s', apiUrl, vapid ? '(set)' : '(empty)');
