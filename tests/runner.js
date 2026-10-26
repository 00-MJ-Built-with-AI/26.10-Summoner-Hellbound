'use strict';
// ---------- Test harness: loads the real game into this page and runs every spec ----------
// The game gets an in-memory localStorage, so tests never touch a real save on this origin,
// and its animation loop is frozen so tests drive every frame themselves.

(function sandbox() {
  const mem = new Map();
  const storage = {
    getItem: k => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: k => { mem.delete(k); },
    clear: () => mem.clear(),
    key: i => [...mem.keys()][i] ?? null,
    get length() { return mem.size; },
  };
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  window.__realRAF = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = () => 0;
  window.__loadErrors = [];
  window.addEventListener('error', e => window.__loadErrors.push(`${e.message} (${(e.filename || '').split('/').pop()}:${e.lineno})`));
})();

const TESTS = [];
let GROUP = '';
function group(name, fn) { GROUP = name; fn(); }
function test(name, fn, opts = {}) { TESTS.push({ group: GROUP, name, fn, warnOnly: !!opts.warn }); }

class AssertError extends Error {}
const show = v => (typeof v === 'string' ? `"${v}"` : JSON.stringify(v));
function expect(v, label = '') {
  const L = label ? label + ': ' : '';
  const fail = msg => { throw new AssertError(L + msg); };
  return {
    toBe: x => { if (v !== x) fail(`expected ${show(x)}, got ${show(v)}`); },
    toEqual: x => { if (JSON.stringify(v) !== JSON.stringify(x)) fail(`expected ${show(x)}, got ${show(v)}`); },
    toBeTruthy: () => { if (!v) fail(`expected a truthy value, got ${show(v)}`); },
    toBeFalsy: () => { if (v) fail(`expected a falsy value, got ${show(v)}`); },
    toBeGreaterThan: x => { if (!(v > x)) fail(`expected > ${x}, got ${show(v)}`); },
    toBeAtLeast: x => { if (!(v >= x)) fail(`expected ≥ ${x}, got ${show(v)}`); },
    toBeLessThan: x => { if (!(v < x)) fail(`expected < ${x}, got ${show(v)}`); },
    toBeCloseTo: (x, eps = 1e-6) => { if (Math.abs(v - x) > eps) fail(`expected ≈ ${x}, got ${show(v)}`); },
    toContain: x => { if (!(v && v.includes && v.includes(x))) fail(`expected to contain ${show(x)}, got ${show(v)}`); },
    toBeEmpty: () => { if (v && v.length) fail(`expected nothing, got ${show(v.slice ? v.slice(0, 8) : v)}${v.length > 8 ? ` (+${v.length - 8} more)` : ''}`); },
  };
}

// ---------- helpers shared by all specs ----------
const H = {
  // a fresh save: level, cleared stages, card levels, fusions, …
  save(o = {}) {
    const s = defaultSave(o.mode || 'normal');
    s.level = o.level ?? 1;
    s.tutorialDone = !o.tutorial;
    const cleared = o.cleared ?? 0;
    for (let i = 0; i < STAGES.length; i++) { s.cleared[i] = i < cleared; if (i < cleared) s.stars[i][0] = true; }
    for (const k in s.seenStory) delete s.seenStory[k];
    for (let i = 0; i < STAGES.length; i++) s.seenStory[i] = !o.story;
    s.seenStory.tower = true; s.endingSeen = true; s.seenStory.ending2 = true; s.seenStory.ending3 = true;
    if (o.cardLv) for (const id of CARD_IDS) s.cards[id] = { lv: o.cardLv, exp: 0, enh: o.enh || 0 };
    if (o.fusions) for (const id of CARD_IDS) if (CARDS[id].fusion) s.fused[id] = true;
    if (o.hotbar) s.hotbar = o.hotbar;
    s.stones = o.stones ?? 0;
    // achievements pay stones when they unlock; mark them earned so stone math in tests stays exact
    if (!o.achievements) for (const a of ACHIEVEMENTS) s.ach[a.id] = 1;
    SAVE = s; saveGame();
    return s;
  },
  start(idx, kind = 'stage') {
    startStage(idx, kind);
    buildHUD();
    STATE = 'play';
    INPUT.mx = VW / 2 + 120; INPUT.my = VH / 2;
  },
  // advance the simulation; o.god keeps Allen alive, o.summon/o.skills spam the hotbar
  sim(sec, o = {}) {
    const n = Math.round(sec * 60);
    for (let i = 0; i < n; i++) {
      if (o.god) { W.player.hp = W.player.maxHp; W.player.mp = 99999; }
      if (o.summon && i % 30 === 0) for (let k = 0; k < 6; k++) { W.slotCd[k] = 0; trySummon(k); }
      if (o.skills && i % 90 === 45) for (let k = 0; k < 6; k++) { const id = SAVE.hotbar[k]; if (id) { W.cskCd[id] = 0; useCardSkill(k); } }
      if (W.choosing) pickBoost(0);
      if (STATE !== 'play') break;
      updateWorld(1 / 60);
      if (o.render && i % 30 === 0) { renderWorld(1 / 60); updateHUD(); }
      if (o.until && o.until()) break;
    }
  },
  // skip the waves, spawn the boss and finish it off
  killBoss() {
    W.time = W.st.duration;
    H.sim(6, { god: true, until: () => W.boss });
    if (!W.boss) throw new AssertError('the boss never spawned');
    W.boss.hp = 1; W.boss.shield = 0;
    damageEnemy(W.boss, 999, null);
    H.sim(5, { god: true, until: () => STATE !== 'play' });
  },
  spawnNear(type, n = 1, d = 120) {
    const out = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; out.push(spawnEnemy(type, W.player.x + Math.cos(a) * d, W.player.y + Math.sin(a) * d)); }
    return out;
  },
  key(code, extra = {}) { window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ code, bubbles: true }, extra))); },
  keyUp(code) { window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); },
  reset() {
    if (W && W.active) W.ended = true;
    SETTINGS = Object.assign(defaultSettings(), { quality: 'auto' });
    rebuildKeymap();
    INPUT.keys.clear(); INPUT.joy = null; INPUT.aimV = null; INPUT.padMode = false; INPUT.touchMode = false;
    document.body.classList.remove('touch');
    REBIND = null;
    if (window.__realGetGamepads) navigator.getGamepads = window.__realGetGamepads;
    P.length = 0; TXT.length = 0;
    STATE = 'title';
  },
};
window.__realGetGamepads = navigator.getGamepads ? navigator.getGamepads.bind(navigator) : null;

// ---------- load the real game page into this one ----------
async function loadGame() {
  const base = new URL('../', location.href);
  const html = await (await fetch(new URL('index.html', base), { cache: 'no-store' })).text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const l of doc.querySelectorAll('link[rel=stylesheet]')) {
    const n = document.createElement('link'); n.rel = 'stylesheet'; n.href = new URL(l.getAttribute('href'), base).href;
    document.head.appendChild(n);
  }
  const scripts = [...doc.querySelectorAll('script[src]')].map(s => s.getAttribute('src'));
  doc.querySelectorAll('script').forEach(s => s.remove());
  document.getElementById('gameHost').innerHTML = doc.body.innerHTML;
  for (const src of scripts) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = new URL(src, base).href;
      s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src));
      document.body.appendChild(s);
    });
  }
}

// ---------- run + report ----------
async function runAll() {
  const out = document.getElementById('trResults'), bar = document.getElementById('trSummary');
  const results = [];
  const t0 = performance.now();
  const only = new URLSearchParams(location.search).get('only');
  const list = only ? TESTS.filter(t => (t.group + ' ' + t.name).toLowerCase().includes(only.toLowerCase())) : TESTS;
  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    bar.textContent = `Running ${i + 1} / ${list.length}: ${t.group} › ${t.name}`;
    await new Promise(r => setTimeout(r, 0));
    H.reset();
    const s = performance.now();
    let status = 'pass', msg = '';
    try {
      await Promise.race([Promise.resolve().then(t.fn), new Promise((_, rej) => setTimeout(() => rej(new Error('Timed out after 60s')), 60000))]);
    } catch (e) {
      status = t.warnOnly ? 'warn' : 'fail';
      msg = e instanceof AssertError ? e.message : `${e.message}\n${(e.stack || '').split('\n').slice(1, 4).join('\n')}`;
    }
    results.push({ group: t.group, name: t.name, status, msg, ms: Math.round(performance.now() - s) });
  }
  H.reset();
  const sum = { pass: 0, fail: 0, warn: 0 };
  results.forEach(r => sum[r.status]++);
  const groups = [...new Set(results.map(r => r.group))];
  out.innerHTML = groups.map(g => {
    const rs = results.filter(r => r.group === g), bad = rs.filter(r => r.status !== 'pass').length;
    return `<section class="tr-group ${bad ? 'has-bad' : ''}"><h2>${g} <span>${rs.length - bad} / ${rs.length}</span></h2>${rs.map(r =>
      `<div class="tr-row ${r.status}"><span class="tr-dot"></span><span class="tr-name">${r.name}</span><span class="tr-ms">${r.ms} ms</span>${r.msg ? `<pre>${r.msg.replace(/</g, '&lt;')}</pre>` : ''}</div>`).join('')}</section>`;
  }).join('');
  const secs = ((performance.now() - t0) / 1000).toFixed(1);
  bar.innerHTML = `<b class="${sum.fail ? 'bad' : 'ok'}">${sum.fail ? `${sum.fail} failing` : 'All features working'}</b> · ${sum.pass} passed · ${sum.fail} failed · ${sum.warn} warnings · ${results.length} tests in ${secs}s`;
  document.title = (sum.fail ? '✗ ' : '✓ ') + 'Summoner tests';
  window.__TEST_RESULTS__ = { summary: sum, results, seconds: +secs };
  window.__TESTS_DONE__ = true;
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadGame();
  } catch (e) {
    document.getElementById('trSummary').innerHTML = `<b class="bad">The game failed to load: ${e.message}</b>`;
    window.__TEST_RESULTS__ = { summary: { pass: 0, fail: 1, warn: 0 }, results: [{ group: 'Boot', name: 'load game', status: 'fail', msg: e.message }] };
    window.__TESTS_DONE__ = true;
    return;
  }
  await runAll();
});
