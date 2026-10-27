// Collects every English string the player can see (data + rendered screens) for translators.
// Usage: node tests/dump-strings.mjs <out.json>
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
for (const ch of ['msedge', 'chrome']) { try { browser = await chromium.launch({ channel: ch }); break; } catch { /* next */ } }
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
await page.goto(`http://127.0.0.1:${server.address().port}/tests/index.html?only=__load_only__`);
await page.waitForFunction(() => window.__TESTS_DONE__ === true, null, { timeout: 120000, polling: 500 });
const data = await page.evaluate(() => {
  const ui = new Set();
  const grab = rootEl => {
    const w = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.nodeValue.trim(); if (t && /[A-Za-z]{2}/.test(t)) ui.add(t); }
    rootEl.querySelectorAll('[title],[placeholder]').forEach(e => { for (const a of ['title', 'placeholder']) { const t = (e.getAttribute(a) || '').trim(); if (t && /[A-Za-z]{2}/.test(t)) ui.add(t); } });
  };
  H.save({ level: 70, cleared: 48, stones: 99999, cardLv: 30, fusions: true });
  SAVE.mats = { shard: 99, horn: 99, star: 99 };
  for (const s of ['title', 'newgame', 'map', 'grimoire', 'codex', 'settings', 'help', 'pause', 'result']) { try { showScreen(s); grab(document.getElementById('scr-' + s)); } catch (e) { /* skip */ } }
  for (const m of ['tower', 'rush', 'daily', 'sanctum', 'quests', 'worldboss', 'rift', 'event', 0]) { try { selectStage(m); grab(document.getElementById('stageInfo')); } catch (e) { /* skip */ } }
  for (const t of ['cards', 'fusion', 'talents', 'relics', 'equip']) { try { grimTab = t; showScreen('grimoire'); grab(document.getElementById('scr-grimoire')); } catch (e) { /* skip */ } }
  for (const t of ['bestiary', 'ach', 'records', 'wardrobe', 'stats', 'boards']) { try { codexTab = t; showScreen('codex'); grab(document.getElementById('scr-codex')); } catch (e) { /* skip */ } }
  for (const t of ['buildings', 'altar', 'calendar', 'weekly', 'arena']) { try { vilTab = t; showScreen('village'); grab(document.getElementById('scr-village')); } catch (e) { /* skip */ } }
  H.start(3); grab(document.getElementById('hud'));
  try { openAutomation(); grab(document.getElementById('infoCard')); openPriorityEditor('run'); grab(document.getElementById('infoCard')); } catch (e) { /* skip */ }
  const pick = (o, keys) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, keys.map(x => (typeof v[x] === 'function' ? v[x](v.v ?? 1) : v[x]))]));
  return {
    ui: [...ui].sort(),
    cards: Object.fromEntries(CARD_IDS.map(id => [id, [CARDS[id].name, CARDS[id].role, CARDS[id].desc, CARD_SKILLS[id] ? CARD_SKILLS[id].name : '', CARD_SKILLS[id] ? CARD_SKILLS[id].desc : '']])),
    enemies: Object.fromEntries(Object.keys(ENEMIES).filter(k => !ENEMIES[k].hidden).map(k => [k, [ENEMIES[k].name, LORE[k] || '']])),
    bosses: Object.fromEntries(Object.keys(BOSSES).filter(k => !BOSSES[k].awakened).map(k => [k, [BOSSES[k].name, BOSSES[k].title || '', LORE[k] || '', ...(BOSSES[k].phases || []).map(p => p.name)]])),
    stages: STAGES.map(s => [s.name, s.blurb || '']),
    regions: REGIONS.map(r => [r.name, r.act]),
    ranks: RANKS.map(r => r.name),
    story: STORY,
    ach: Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, [a.name, a.desc]])),
    relics: Object.fromEntries(RELICS.map(r => [r.id, [r.name, r.desc(r.v)]])),
    runups: pick(RU_BY_ID, ['name', 'desc']),
    boosts: Object.fromEntries(BOOSTS.map(b => [b.id, [b.name, b.desc]])),
    talents: Object.fromEntries(TALENTS.map(t => [t.id, [t.name, t.desc]])),
    synergies: pick(SYNERGIES, ['name', 'desc']),
    skills: SKILLS.map(s => [s.key, s.name, s.desc]),
    companions: pick(COMPANIONS, ['name', 'title', 'desc', 'unlock']),
    outfits: OUTFITS.map(o => [o.id, o.name, o.req]),
    circles: CIRCLES.map(o => [o.id, o.name, o.req]),
    mats: pick(MATS, ['name', 'from']),
    curses: CURSES.map(c => [c.id, c.name, c.desc]),
    buildings: BUILDINGS.map(b => [b.id, b.name, b.fmt(b.per)]),
    skins: SKINS.map(s => [s.id, s.name, s.from]),
    evo: pick(EVO_STYLES, ['name', 'desc', 'sk']),
    perks: RIFT_PERKS.map(p => [p.id, p.name, p.desc(1)]),
    events: EVENTS.map(e => [e.id, e.name, e.blurb, e.stage.name, e.currency.name, ...e.shop.map(s => s.name)]),
    modes: Object.fromEntries(Object.entries(MODES).map(([k, m]) => [k, [m.name, m.desc || '']])),
    weekly: WEEKLY_POOL.map(w => [w.id, w.name, w.desc(w.n)]),
    arena: ARENA_RANKS.map(r => r.name),
    whatsnew: WHATS_NEW, tips: TIPS, heroes: HERO_SKILLS,
    equip: typeof EQUIP !== 'undefined' ? EQUIP.map(e => [e.id, e.name, e.desc || '']) : [],
    quests: typeof QUEST_POOL !== 'undefined' ? QUEST_POOL.map(q => [q.id, q.name || '', typeof q.desc === 'function' ? q.desc(q.n || 1) : q.desc || '']) : [],
  };
});
fs.writeFileSync(process.argv[2], JSON.stringify(data, null, 0));
console.log(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.length : Object.keys(v).length}`).join(' · '));
await browser.close(); server.close();
