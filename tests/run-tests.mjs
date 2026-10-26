// Runs tests/index.html in a headless browser and prints the results.
// Usage: npm test            (uses Edge or Chrome if installed, else Playwright's Chromium)
//        npm test -- boss    (only tests whose name contains "boss")
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2).join(' ');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(root, url.endsWith('/') ? url + 'index.html' : url);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

async function launch() {
  for (const channel of [process.env.BROWSER_CHANNEL, 'msedge', 'chrome'].filter(Boolean)) {
    try { return await chromium.launch({ channel, args: ['--mute-audio'] }); } catch { /* try the next one */ }
  }
  return chromium.launch({ args: ['--mute-audio'] });
}

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));
await page.goto(`http://127.0.0.1:${port}/tests/index.html${only ? '?only=' + encodeURIComponent(only) : ''}`);
// poll on a timer: the test page freezes requestAnimationFrame, which Playwright would otherwise use
await page.waitForFunction(() => window.__TESTS_DONE__ === true, null, { timeout: 10 * 60 * 1000, polling: 500 });
const R = await page.evaluate(() => window.__TEST_RESULTS__);
await browser.close();
server.close();

const color = (c, s) => (process.stdout.isTTY ? `\x1b[${c}m${s}\x1b[0m` : s);
let lastGroup = '';
for (const r of R.results) {
  if (r.group !== lastGroup) { console.log('\n' + color('1', r.group)); lastGroup = r.group; }
  const mark = r.status === 'pass' ? color('32', '✓') : r.status === 'warn' ? color('33', '!') : color('31', '✗');
  console.log(`  ${mark} ${r.name} ${color('2', `(${r.ms} ms)`)}`);
  if (r.msg) console.log(color(r.status === 'warn' ? '33' : '31', r.msg.split('\n').map(l => '      ' + l).join('\n')));
}
if (pageErrors.length) console.log(color('31', `\nUncaught page errors:\n  ${pageErrors.join('\n  ')}`));
const s = R.summary;
console.log(`\n${s.fail ? color('31', `${s.fail} failing`) : color('32', 'All features working')} · ${s.pass} passed · ${s.fail} failed · ${s.warn} warnings · ${R.results.length} tests in ${R.seconds}s`);
process.exit(s.fail || pageErrors.length ? 1 : 0);
