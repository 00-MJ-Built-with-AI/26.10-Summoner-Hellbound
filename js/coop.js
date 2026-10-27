'use strict';
// ---------- Local co-op: Player 2 plays a companion (Roran, Lysa or Kael) on the same screen ----------
// Keyboard: I J K L move · H dash · U hero skill.  Controller: left stick · A dash · X (or B) hero skill.

const P2_KEYS = { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', dash: 'KeyH', skill: 'KeyU' };
const P2IN = { mx: 0, my: 0, dash: false, skill: false, prev: {}, pad: null };
const HERO_SKILLS = {
  roran: { name: 'Whirlwind', cd: 7, desc: 'Spins through nearby enemies and knocks them back.' },
  lysa:  { name: 'Sanctuary', cd: 10, desc: 'Heals Allen and every summon by 25% and shields them.' },
  kael:  { name: 'Arrow Rain', cd: 8, desc: 'Three volleys of arrows rain down on the nearest crowd.' },
};
const coopOn = () => SETTINGS.p2 === 'keys' || SETTINGS.p2 === 'pad';
const p2Hero = () => (W && W.summons ? W.summons.find(s => s.p2 && !s.dead) : null);

// controller for Player 2: with two pads the second one is P2; with one pad, P1 keeps keyboard + mouse
const _co_pollGamepad = pollGamepad;
pollGamepad = function () {
  if (SETTINGS.p2 !== 'pad') { _co_pollGamepad(); return; }
  const pads = [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter(g => g && g.connected);
  if (pads.length >= 2) _co_pollGamepad();
  P2IN.pad = pads.length >= 2 ? pads[1] : pads[0] || null;
};
function p2Read() {
  let mx = 0, my = 0, dash = false, skill = false;
  if (SETTINGS.p2 === 'pad' && P2IN.pad) {
    const gp = P2IN.pad, held = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
    const dz = v => (Math.abs(v) < 0.22 ? 0 : v);
    mx = dz(gp.axes[0] || 0); my = dz(gp.axes[1] || 0);
    dash = held(0); skill = held(2) || held(1);
  } else if (SETTINGS.p2 === 'keys') {
    const k = INPUT.keys;
    mx = (k.has(P2_KEYS.right) ? 1 : 0) - (k.has(P2_KEYS.left) ? 1 : 0);
    my = (k.has(P2_KEYS.down) ? 1 : 0) - (k.has(P2_KEYS.up) ? 1 : 0);
    dash = k.has(P2_KEYS.dash); skill = k.has(P2_KEYS.skill);
  }
  const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
  const out = { mx, my, dash: dash && !P2IN.prev.dash, skill: skill && !P2IN.prev.skill };
  P2IN.prev = { dash, skill };
  return out;
}

const _co_startStage = startStage;
startStage = function (idx, kind) {
  _co_startStage(idx, kind);
  P2IN.prev = {};
  if (!coopOn()) return;
  let h = W.summons.find(s => s.c.comp);
  if (!h) { h = makeCompanion(SAVE.companion && COMPANIONS[SAVE.companion] ? SAVE.companion : 'roran', -50, 30); W.summons.push(h); }
  h.p2 = true; h.p2cd = 0; h.p2dashCd = 0; h.p2dashT = 0; h.hero = h.id.replace('comp_', '');
  h.hp = h.maxHp = h.maxHp * 1.5;   // a player-driven hero gets a sturdier body
  setTimeout(() => { if (W.active) toast(`Player 2 joined as ${h.c.name}!`, 'card'); }, 600);
};
const _co_updateSummon = updateSummon;
updateSummon = function (s, dt) {
  if (!s.p2) { _co_updateSummon(s, dt); return; }
  const x0 = s.x, y0 = s.y;
  s.p2cd = Math.max(0, s.p2cd - dt); s.p2dashCd = Math.max(0, s.p2dashCd - dt);
  _co_updateSummon(s, dt);
  if (s.dead || s.down) { P2IN.prev = {}; return; }
  const inp = p2Read(), p = W.player;
  s.x = x0; s.y = y0;
  if (inp.dash && s.p2dashCd <= 0) {
    let dx = inp.mx, dy = inp.my;
    if (!dx && !dy) dx = s.face || 1;
    const l = Math.hypot(dx, dy); s.p2dx = dx / l; s.p2dy = dy / l;
    s.p2dashT = 0.16; s.p2dashCd = 1.2; s.fortT = Math.max(s.fortT, 0.3);
    SFX.whoosh();
  }
  if (inp.skill) heroSkill(s);
  if (s.p2dashT > 0) {
    s.p2dashT -= dt; s.vx = s.p2dx * 1150; s.vy = s.p2dy * 1150;
    spawnP({ x: s.x + rand(-5, 5), y: s.y + rand(-5, 8), life: 0.3, size: 6, color: s.col });
  } else {
    const sp = (s.c.speed || 230) * 1.05, a = Math.min(1, dt * 14);
    s.vx += (inp.mx * sp - s.vx) * a; s.vy += (inp.my * sp - s.vy) * a;
  }
  s.x = clamp(s.x + s.vx * dt, -BOUND, BOUND); s.y = clamp(s.y + s.vy * dt, -BOUND, BOUND);
  // stay on the shared screen: P2 can't wander more than 650px from Allen
  const dx = s.x - p.x, dy = s.y - p.y, d = Math.hypot(dx, dy);
  if (d > 650) { s.x = p.x + dx / d * 650; s.y = p.y + dy / d * 650; }
  if (Math.abs(s.vx) > 8) s.face = s.vx > 0 ? 1 : -1;
};
function heroSkill(s) {
  const sk = HERO_SKILLS[s.hero];
  if (!sk) return false;
  if (s.p2cd > 0) { SFX.fail(); return false; }
  s.p2cd = sk.cd;
  const p = W.player;
  if (s.hero === 'roran') {
    allyBlast(s.x, s.y, 135, s.dmg * 5 * sMult(s), '#8fb0ff', s, { knock: 320 });
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; spawnP({ x: s.x + Math.cos(a) * 40, y: s.y + Math.sin(a) * 40, vx: Math.cos(a + 1.4) * 320, vy: Math.sin(a + 1.4) * 320, life: 0.4, size: 5, color: '#cfdcff', kind: 'spark', drag: 1 }); }
  } else if (s.hero === 'lysa') {
    healPlayer(p.maxHp * 0.25);
    p.shield = Math.max(p.shield, p.maxHp * 0.15);
    for (const o of W.summons) if (!o.dead && !o.down) { o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.25); o.shield = Math.max(o.shield, o.maxHp * 0.15); }
    ring(s.x, s.y, '#fff2a8', 10, 260, 0.8, 4); ring(p.x, p.y, '#fff2a8', 10, 80, 0.6, 3);
    SFX.heal();
  } else {
    const tgt = nearestEnemy(s.x, s.y, 520) || (W.boss && !W.boss.dead ? W.boss : null);
    const x = tgt ? tgt.x : s.x + (s.face || 1) * 200, y = tgt ? tgt.y : s.y;
    for (let k = 0; k < 3; k++) W.later.push({ t: 0.15 + k * 0.3, fn: () => {
      for (let i = 0; i < 10; i++) { const ax = x + rand(-90, 90), ay = y + rand(-70, 70); spawnP({ x: ax - 40, y: ay - 260, vx: 160, vy: 1050, life: 0.25, size: 3, color: '#d6ffb8', kind: 'spark', drag: 0 }); }
      allyBlast(x, y, 110, s.dmg * 3 * sMult(s), '#9dff7a', s);
    } });
  }
  txt(s.x, s.y - 34, sk.name + '!', s.col, 15, 1);
  SFX.skill();
  return true;
}

// shared camera: follow the midpoint and zoom out so both players stay on screen
const _co_updateWorld = updateWorld;
updateWorld = function (rawDt) {
  _co_updateWorld(rawDt);
  const h = coopOn() && W.active ? p2Hero() : null, p = W.player;
  if (!h || h.down || p.dead || W.focus) return;
  const dx = Math.abs(h.x - p.x), dy = Math.abs(h.y - p.y);
  const fit = Math.min(1, (VW / ZOOM * 0.4) / Math.max(1, dx), (VH / ZOOM * 0.38) / Math.max(1, dy));
  W.zk = Math.min(W.zk, Math.max(0.68, fit));
  const a = Math.min(1, rawDt * 6), mx = Math.max(0, BOUND + 40 - VW / 2 / ZOOM), my = Math.max(0, BOUND + 40 - VH / 2 / ZOOM);
  W.camX = clamp(lerp(W.camX, (p.x + h.x) / 2, a), -mx, mx); W.camY = clamp(lerp(W.camY, (p.y + h.y) / 2, a), -my, my);
};

// P2 marker under the hero
const _co_drawEntity = drawEntity;
drawEntity = function (c, e, kind, t) {
  if (kind === 'summon' && e.p2 && !e.down) {
    c.save(); c.translate(e.x, e.y + e.r * 0.9); c.scale(1, 0.4);
    c.strokeStyle = rgba('#5dff9a', 0.8); c.lineWidth = 3; circ(c, 0, 0, e.r + 10 + Math.sin(t * 5) * 1.5); c.stroke();
    c.restore();
    c.fillStyle = '#5dff9a'; c.font = '900 11px Inter, sans-serif'; c.textAlign = 'center';
    c.fillText('P2', e.x, e.y - e.r - 32);
  }
  _co_drawEntity(c, e, kind, t);
};

// P2 status panel
const _co_updateHUD = updateHUD;
updateHUD = function () {
  _co_updateHUD();
  let el = $('p2Hud');
  const h = coopOn() && W.active ? W.summons.find(s => s.p2) : null;
  if (!h) { if (el) el.classList.add('hidden'); return; }
  if (!el) {
    el = document.createElement('div'); el.id = 'p2Hud'; el.className = 'p2-hud';
    el.innerHTML = '<div class="p2-name"><b>P2</b> <span id="p2Name"></span></div><div class="bar hp"><div class="fill" id="p2Hp"></div></div><div class="p2-sk" id="p2Sk"></div>';
    $('hud').appendChild(el);
  }
  el.classList.remove('hidden');
  const sk = HERO_SKILLS[h.hero];
  $('p2Name').textContent = h.c.name + (h.down ? ` · KO ${Math.ceil(h.downT)}s` : '');
  $('p2Hp').style.width = (h.down ? 0 : 100 * h.hp / h.maxHp) + '%';
  const key = SETTINGS.p2 === 'pad' ? 'X' : 'U';
  $('p2Sk').textContent = h.p2cd > 0 ? `${sk.name} ${Math.ceil(h.p2cd)}s` : `${key}: ${sk.name} ready`;
  $('p2Sk').classList.toggle('ready', !(h.p2cd > 0));
};
