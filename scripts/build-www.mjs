// Copies the game into www/ for the Android app (Capacitor serves that folder inside the app).
// Tests, docs and tooling stay out of the app.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'www');
const keep = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'icons'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const item of keep) fs.cpSync(path.join(root, item), path.join(out, item), { recursive: true });
const files = fs.readdirSync(out, { recursive: true }).filter(f => fs.statSync(path.join(out, f)).isFile());
console.log(`www/ ready: ${files.length} files`);
