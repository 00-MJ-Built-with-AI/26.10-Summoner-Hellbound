// Balance probe: plays every story stage with a typical loadout for its recommended level and reports
// how hard it was. Usage: node tests/balance.mjs [first] [last]   (writes tests/balance-report.json)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = path.join(root, url.endsWith('/') ? url + 'index.html' : url);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
let browser;
for (const ch of [process.env.BROWSER_CHANNEL, 'msedge', 'chrome'].filter(Boolean)) { try { browser = await chromium.launch({ channel: ch, args: ['--mute-audio'] }); break; } catch { /* next */ } }
browser = browser || await chromium.launch({ args: ['--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
await page.goto(`http://127.0.0.1:${server.address().port}/tests/index.html?only=__load_only__`);
await page.waitForFunction(() => window.__TESTS_DONE__ === true, null, { timeout: 120000, polling: 500 });

const first = +(process.argv[2] || 0), last = +(process.argv[3] || 47);
const out = [];
for (let i = first; i <= last; i++) {
  const r = await page.evaluate(idx => {
    const s = STAGES[idx], L = s.rec;
    const ranks = RANKS.filter(r => r.level <= L).map(r => r.id);
    const pick = [];
    for (const rk of [...ranks].reverse()) for (const id of CARD_IDS) if (!CARDS[id].fusion && CARDS[id].rank === rk && pick.length < 6 && !pick.includes(id)) { pick.push(id); break; }
    for (const id of CARD_IDS) if (pick.length < 6 && !CARDS[id].fusion && ranks.includes(CARDS[id].rank) && !pick.includes(id)) pick.push(id);
    H.save({ level: L, cleared: idx, cardLv: Math.min(CARD_PROG.maxLv, Math.max(1, Math.round(L * 0.65))), enh: Math.min(5, Math.floor(L / 10)), hotbar: pick });
    SAVE.auto = { run: true, runOrder: [], soul: true, soulOrder: [], q: true, f: true, skills: Object.fromEntries(pick.map(id => [id, true])) };
    H.start(idx);
    const p = W.player; let minHp = 1, dmg = 0, bossT = 0, t = 0;
    const dt = 1 / 30, maxT = s.duration + 150;
    while (t < maxT && STATE === 'play' && !p.dead && !W.won) {
      if (W.choosing) pickBoost(0);
      if ((t * 30 | 0) % 15 === 0) for (let k = 0; k < 6; k++) trySummon(k);
      // wander in a slow circle like a player kiting
      INPUT.keys.clear();
      const a = t * 0.35; p.vx = Math.cos(a) * W.ps.speed * 0.6; p.vy = Math.sin(a) * W.ps.speed * 0.6;
      const hp0 = p.hp;
      updateWorld(dt);
      if (p.hp < hp0) dmg += hp0 - p.hp;
      minHp = Math.min(minHp, p.hp / p.maxHp);
      if (W.boss && !W.boss.dead) bossT += dt;
      t += dt;
    }
    const res = { i: idx, name: s.name, rec: L, won: !!W.won, died: !!p.dead, minHp: +minHp.toFixed(2), dps: +(dmg / Math.max(1, t) / p.maxHp * 100).toFixed(2), bossT: Math.round(bossT), t: Math.round(t), bossLeft: W.boss && !W.boss.dead ? +(W.boss.hp / W.boss.maxHp).toFixed(2) : 0 };
    W.ended = true; STATE = 'title';
    return res;
  }, i);
  out.push(r);
  console.log(`${String(r.i + 1).padStart(2)} ${r.name.padEnd(24)} Lv${String(r.rec).padStart(3)}  ${r.won ? 'WIN ' : r.died ? 'DIED' : 'TIME'}  minHP ${String(Math.round(r.minHp * 100)).padStart(3)}%  hurt ${String(r.dps).padStart(5)}%/s  boss ${String(r.bossT).padStart(3)}s${r.bossLeft ? ` (${Math.round(r.bossLeft * 100)}% left)` : ''}`);
}
fs.writeFileSync(path.join(root, 'tests', 'balance-report.json'), JSON.stringify(out, null, 1));
await browser.close(); server.close();
