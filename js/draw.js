'use strict';
// ---------- Procedural drawings for every character + world renderer ----------

let FLASH = false;                       // when true, shapes render white (hit flash)
let OUTLINE = false, OUTLINES_ON = false;   // OUTLINE: draw a dark silhouette pass (character outlines)
const F = col => (OUTLINE ? '#06030f' : FLASH ? '#ffffff' : col);
function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, TAU); }
function ell(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); }
function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function tri(c, x1, y1, x2, y2, x3, y3) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); }
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = s => clamp(Math.round(((n >> s) & 255) * f), 0, 255);
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}
const moving = e => e.iconMode || Math.hypot(e.vx || 0, e.vy || 0) > 15;

const DR = {};

// ===== Allen, the summoner =====
DR.allen = (c, p, t) => {
  const mv = Math.hypot(p.vx, p.vy) > 20;
  const ph = p.walkT || 0;
  const bob = mv ? -Math.abs(Math.sin(ph * 12)) * 2 : Math.sin(t * 3) * 0.8;
  c.save(); c.scale(p.face || 1, 1);
  c.strokeStyle = F('#151a38'); c.lineWidth = 4; c.lineCap = 'round';
  const s = mv ? Math.sin(ph * 12) * 4 : 0;
  c.beginPath(); c.moveTo(-3, 12); c.lineTo(-3 + s, 19); c.moveTo(3, 12); c.lineTo(3 - s, 19); c.stroke();
  // cloak
  const of = outfit();
  c.fillStyle = F(of.cloak);
  c.beginPath(); c.moveTo(-9, -2 + bob); c.lineTo(9, -2 + bob); c.lineTo(13, 15 + bob * 0.5);
  c.quadraticCurveTo(0, 19, -13, 15 + bob * 0.5); c.closePath(); c.fill();
  c.strokeStyle = F(of.trim); c.lineWidth = 1.4; c.stroke();
  c.strokeStyle = F(of.gold); c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(0, -1 + bob); c.lineTo(0, 17); c.stroke();
  // arm holding toward grimoire
  c.strokeStyle = F('#283276'); c.lineWidth = 3.5;
  c.beginPath(); c.moveTo(-6, 2 + bob); c.lineTo(-11, 6 + bob); c.stroke();
  // head + hair
  c.fillStyle = F('#f3cfae'); circ(c, 1, -10 + bob, 8); c.fill();
  c.fillStyle = F('#15131f');
  c.beginPath(); c.moveTo(-8, -8 + bob); c.lineTo(-10, -15 + bob); c.lineTo(-5, -14 + bob); c.lineTo(-4, -21 + bob);
  c.lineTo(0, -16 + bob); c.lineTo(3, -22 + bob); c.lineTo(5, -16 + bob); c.lineTo(11, -18 + bob); c.lineTo(9, -11 + bob);
  c.quadraticCurveTo(4, -14 + bob, -1, -12 + bob); c.closePath(); c.fill();
  c.fillStyle = F('#3b7bff'); c.fillRect(4, -10 + bob, 2.2, 3);
  c.restore();
  // floating grimoire
  const gx = -(p.face || 1) * 18, gy = -14 + Math.sin(t * 2.6) * 3;
  c.save(); c.translate(gx, gy); c.rotate(Math.sin(t * 1.7) * 0.2);
  c.fillStyle = F('#43206b'); c.fillRect(-6, -8, 12, 16);
  c.strokeStyle = F('#ffd66b'); c.lineWidth = 1.2; c.strokeRect(-6, -8, 12, 16);
  c.fillStyle = F('#ffe9a8'); circ(c, 0, 0, 2.4); c.fill();
  c.restore();
};

// ===== generic quadruped (wolves) =====
function quad(c, e, t, body, dark, eye) {
  const mv = moving(e);
  const ph = t * 14 + (e.seed || 0);
  const s = mv ? Math.sin(ph) * 4 : 0;
  c.save(); c.scale(e.face || 1, 1);
  if (e.lunge > 0) c.translate(e.lunge * 30, 0);
  c.strokeStyle = F(dark); c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-8, 4); c.lineTo(-8 + s, 12); c.moveTo(-4, 4); c.lineTo(-4 - s, 12);
  c.moveTo(6, 4); c.lineTo(6 - s, 12); c.moveTo(9, 4); c.lineTo(9 + s, 12);
  c.stroke();
  c.strokeStyle = F(body); c.lineWidth = 3.5;
  c.beginPath(); c.moveTo(-12, -1); c.quadraticCurveTo(-18, -6 + Math.sin(t * 8) * 3, -21, -10); c.stroke();
  c.fillStyle = F(body); ell(c, 0, 0, 13, 7.5); c.fill();
  c.fillStyle = F(dark); ell(c, 0, -3, 10, 3); c.fill();
  c.fillStyle = F(body); ell(c, 12, -5, 6.5, 5.5); c.fill();
  ell(c, 17.5, -3.5, 4, 2.8); c.fill();
  tri(c, 9, -9, 10, -15, 13, -9.5); c.fill();
  tri(c, 12, -9.5, 14.5, -14.5, 16, -8.5); c.fill();
  c.fillStyle = eye; circ(c, 14, -6, 1.6); c.fill();
  c.restore();
}

// ===== SUMMONS =====
DR.spark_beetle = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  if (e.lunge > 0) c.translate(e.lunge * 25, 0);
  const w = moving(e) ? Math.sin(t * 30 + (e.seed || 0)) * 2.5 : 0;
  c.strokeStyle = F('#3a6a12'); c.lineWidth = 1.5;
  for (let i = -1; i <= 1; i++) {
    const o = i % 2 ? w : -w;
    c.beginPath(); c.moveTo(i * 4, 0); c.lineTo(i * 4 + o, -9); c.moveTo(i * 4, 0); c.lineTo(i * 4 - o, 9); c.stroke();
  }
  c.fillStyle = F(e.col); ell(c, 0, 0, 9, 6.5); c.fill();
  c.strokeStyle = F('#f2ffd8'); c.lineWidth = 1;
  c.beginPath(); c.moveTo(-7, 0); c.lineTo(7, 0); c.stroke();
  c.fillStyle = F('#1c3008'); circ(c, 9, 0, 3.6); c.fill();
  c.fillStyle = '#ffffff'; circ(c, 10.4, -1.6, 1); c.fill(); circ(c, 10.4, 1.6, 1); c.fill();
  c.restore();
};

DR.venom_mantis = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  const sw = e.lunge > 0 ? e.lunge * 8 : Math.sin(t * 4) * 0.15;
  c.strokeStyle = F('#5f7a14'); c.lineWidth = 1.6;
  const w = moving(e) ? Math.sin(t * 20) * 3 : 0;
  c.beginPath(); c.moveTo(-6, 2); c.lineTo(-10 + w, 11); c.moveTo(-2, 2); c.lineTo(-2 - w, 11); c.moveTo(2, 2); c.lineTo(4 + w, 11); c.stroke();
  c.fillStyle = F('#9fcf2a'); ell(c, -8, 2, 10, 4, -0.15); c.fill();
  c.fillStyle = F(e.col); ell(c, 3, -3, 6, 3.5, -0.6); c.fill();
  c.fillStyle = F(e.col); tri(c, 7, -10, 14, -8, 9, -4); c.fill();
  c.fillStyle = '#ff2a6a'; circ(c, 11, -8, 1.3); c.fill();
  c.strokeStyle = F('#e9ff9a'); c.lineWidth = 2;
  c.save(); c.translate(6, -5); c.rotate(-0.6 - sw);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(8, -2); c.lineTo(14, 4); c.stroke();
  c.restore();
  c.restore();
};

DR.fang_wolf = (c, e, t) => quad(c, e, t, '#ffb347', '#9a5a1a', '#fff6c0');

DR.iron_boar = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  const mv = moving(e), s = mv ? Math.sin(t * 16 + (e.seed || 0)) * 3 : 0;
  c.strokeStyle = F('#3b2010'); c.lineWidth = 4; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-10, 7); c.lineTo(-10 + s, 14); c.moveTo(-4, 7); c.lineTo(-4 - s, 14);
  c.moveTo(7, 7); c.lineTo(7 - s, 14); c.moveTo(12, 7); c.lineTo(12 + s, 14); c.stroke();
  c.fillStyle = F('#6b3a1f'); ell(c, 0, 0, 17, 11); c.fill();
  c.strokeStyle = F('#c9d2e0'); c.lineWidth = 3;
  for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(i * 7, 4, 10, -2.2, -0.9); c.stroke(); }
  c.fillStyle = F('#7d4526'); ell(c, 15, 1, 8, 7); c.fill();
  c.fillStyle = F('#c97a6a'); ell(c, 21.5, 3, 3.5, 3); c.fill();
  c.strokeStyle = F('#fff3d6'); c.lineWidth = 2;
  c.beginPath(); c.moveTo(19, 6); c.quadraticCurveTo(24, 6, 24, 0); c.stroke();
  c.fillStyle = F('#ff8a3d'); circ(c, 16, -2, 1.7); c.fill();
  c.fillStyle = F('#3b2010'); tri(c, 10, -5, 12, -11, 15, -5); c.fill();
  c.restore();
};

DR.gale_hawk = (c, e, t) => {
  c.save(); c.rotate(e.ang || 0);
  const flap = e.state === 'dive' ? 0.25 : Math.sin(t * 12 + (e.seed || 0)) * 0.45 + 0.6;
  c.fillStyle = F('#2f7fb8'); c.strokeStyle = F('#c4f2ff'); c.lineWidth = 1;
  for (const sg of [-1, 1]) {
    c.beginPath(); c.moveTo(3, 0);
    c.quadraticCurveTo(-1, sg * 20 * flap, -11, sg * (18 * flap + 6));
    c.quadraticCurveTo(-6, sg * 6, -4, 0); c.closePath(); c.fill(); c.stroke();
  }
  c.fillStyle = F('#2f7fb8'); tri(c, -6, 0, -16, -5, -16, 5); c.fill();
  c.fillStyle = F(e.col); ell(c, 0, 0, 9, 4.5); c.fill();
  c.fillStyle = F('#eafcff'); circ(c, 8, 0, 3.8); c.fill();
  c.fillStyle = F('#ffc845'); tri(c, 11, -1.5, 15.5, 0, 11, 1.5); c.fill();
  c.restore();
};

DR.healing_sprout = (c, e, t) => {
  const pulse = 1 + Math.sin(t * 3) * 0.06;
  c.save(); c.scale(pulse, pulse);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + t * 0.3;
    c.fillStyle = F(i % 2 ? '#2fbf6e' : '#25a35c');
    ell(c, Math.cos(a) * 9, Math.sin(a) * 7 + 2, 8, 4, a); c.fill();
  }
  c.fillStyle = F(e.col); circ(c, 0, -2, 7.5); c.fill();
  c.fillStyle = F('#eafff3'); circ(c, -2.5, -4.5, 2.2); c.fill();
  c.fillStyle = '#0f3a22'; circ(c, -2.5, -1, 1.1); c.fill(); circ(c, 2.5, -1, 1.1); c.fill();
  c.fillStyle = F('#ff9ad5'); circ(c, 0, -10, 2.8); c.fill();
  c.restore();
};

DR.thorn_vine = (c, e, t) => {
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + Math.sin(t * 1.3 + i) * 0.25;
    const L = 18 + (i % 3) * 6;
    const ex = Math.cos(a) * L, ey = Math.sin(a) * L * 0.75;
    c.strokeStyle = F('#1f8a4a'); c.lineWidth = 3.2;
    c.beginPath(); c.moveTo(0, 0);
    c.quadraticCurveTo(Math.cos(a + 0.7) * L * 0.6, Math.sin(a + 0.7) * L * 0.45, ex, ey); c.stroke();
    c.fillStyle = F('#b7ffcb'); tri(c, ex - 2, ey - 2, ex + Math.cos(a) * 6, ey + Math.sin(a) * 6, ex + 2, ey + 2); c.fill();
  }
  c.fillStyle = F(e.col); circ(c, 0, 0, 7); c.fill();
  c.fillStyle = F('#0d4a26'); circ(c, 0, 0, 3.5); c.fill();
};

DR.stone_golem = (c, e, t) => {
  const br = Math.sin(t * 2) * 1;
  const sl = e.lunge > 0 ? e.lunge * 50 : 0;
  c.fillStyle = F('#7a6644'); rr(c, -15, 6, 10, 14, 3); c.fill(); rr(c, 5, 6, 10, 14, 3); c.fill();
  c.fillStyle = F('#a68c5c'); rr(c, -18, -14 + br, 36, 26, 9); c.fill();
  c.strokeStyle = F('#5c4a2c'); c.lineWidth = 2; c.stroke();
  c.beginPath(); c.moveTo(-10, -12 + br); c.lineTo(-6, 0 + br); c.lineTo(-12, 10 + br); c.moveTo(8, -12 + br); c.lineTo(12, -2 + br); c.stroke();
  c.fillStyle = F('#93794c');
  circ(c, -22, -2 + br - sl * 0.3, 8); c.fill(); circ(c, 22, -2 + br - sl * 0.3, 8); c.fill();
  c.fillStyle = F('#c9ae7c'); rr(c, -9, -30 + br, 18, 15, 5); c.fill();
  c.fillStyle = '#ffe28a'; c.fillRect(-6, -25 + br, 4, 3); c.fillRect(2, -25 + br, 4, 3);
  c.fillStyle = '#ffcf5a'; circ(c, 0, -2 + br, 4.5); c.fill();
  c.strokeStyle = '#fff1b8'; c.lineWidth = 1; circ(c, 0, -2 + br, 7); c.stroke();
};

DR.tide_koi = (c, e, t) => {
  c.save(); c.rotate(e.ang || 0);
  const w = Math.sin(t * 8 + (e.seed || 0)) * 0.4;
  c.save(); c.translate(-9, 0); c.rotate(w);
  c.fillStyle = F('#9fe0ff');
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-8, -9, -13, -8); c.quadraticCurveTo(-7, 0, -13, 8); c.quadraticCurveTo(-8, 9, 0, 0); c.fill();
  c.restore();
  c.fillStyle = F('#7fd0ff'); ell(c, 0, -6, 4, 2.5, -0.6); c.fill(); ell(c, 0, 6, 4, 2.5, 0.6); c.fill();
  c.fillStyle = F('#eef9ff'); ell(c, 0, 0, 11, 6); c.fill();
  c.fillStyle = F('#3a9bff'); ell(c, 2, -1.5, 3.5, 2.5); c.fill(); ell(c, -4.5, 1.5, 2.5, 2); c.fill();
  c.fillStyle = '#08203a'; circ(c, 7, -2, 1.2); c.fill();
  c.restore();
};

DR.arcane_wisp = (c, e, t) => {
  const b = Math.sin(t * 3 + (e.seed || 0)) * 2;
  c.fillStyle = F('#7a3cff');
  c.beginPath(); c.moveTo(-8, b);
  c.quadraticCurveTo(-6, -14 + b + Math.sin(t * 9) * 2, 0, -21 + b);
  c.quadraticCurveTo(6, -14 + b - Math.sin(t * 9) * 2, 8, b); c.closePath(); c.fill();
  c.fillStyle = F(e.col); circ(c, 0, b, 9); c.fill();
  c.fillStyle = F('#f3e6ff'); circ(c, -2.5, b - 3, 3); c.fill();
  c.fillStyle = '#2a0b4a'; ell(c, -3, b + 1, 1.3, 2); c.fill(); ell(c, 3, b + 1, 1.3, 2); c.fill();
  c.fillStyle = F('#f0d9ff');
  for (let i = 0; i < 3; i++) { const a = t * 2 + (i * TAU) / 3; circ(c, Math.cos(a) * 15, b + Math.sin(a) * 6, 2); c.fill(); }
};

DR.frost_spirit = (c, e, t) => {
  const b = Math.sin(t * 3 + (e.seed || 0)) * 2;
  c.save(); c.translate(0, b); c.rotate(Math.sin(t * 1.5) * 0.3);
  c.fillStyle = F('#5fd8ef'); c.strokeStyle = F('#eaffff'); c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(0, -15); c.lineTo(8, 0); c.lineTo(0, 15); c.lineTo(-8, 0); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = F('#d4fbff');
  c.beginPath(); c.moveTo(0, -8); c.lineTo(4, 0); c.lineTo(0, 8); c.lineTo(-4, 0); c.closePath(); c.fill();
  c.restore();
  c.fillStyle = F('#bff6ff');
  for (let i = 0; i < 4; i++) {
    const a = t * 2.5 + (i * TAU) / 4, x = Math.cos(a) * 16, y = b + Math.sin(a) * 8;
    c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x + 2, y); c.lineTo(x, y + 4); c.lineTo(x - 2, y); c.closePath(); c.fill();
  }
};

function dragonSegments(e) {
  if (e.trail && e.trail.length > 2 && !e.iconMode) return e.trail.map(p => ({ x: p.x - e.x, y: p.y - e.y }));
  const a = e.ang || 0, out = [];
  for (let i = 0; i < 10; i++) {
    const d = i * 6.5, w = Math.sin(i * 0.7 + (e.t || 0) * 3) * 4;
    out.push({ x: -Math.cos(a) * d - Math.sin(a) * w, y: -Math.sin(a) * d + Math.cos(a) * w });
  }
  return out;
}
DR.ember_wyrm = (c, e, t) => {
  const seg = dragonSegments(e);
  const n = seg.length;
  for (let i = n - 1; i >= 1; i--) {
    const p = seg[i], k = 1 - i / n, r = 4 + k * 10;
    c.fillStyle = F(i % 2 ? '#b82c18' : '#e2452a'); circ(c, p.x, p.y, r); c.fill();
    if (i % 2 === 0) { c.fillStyle = F('#ffb347'); circ(c, p.x, p.y - r * 0.6, r * 0.35); c.fill(); }
  }
  // wings
  const wp = seg[Math.min(2, n - 1)], ang = e.ang || 0, flap = Math.sin(t * 6 + (e.seed || 0));
  c.save(); c.translate(wp.x, wp.y); c.rotate(ang);
  c.fillStyle = F('rgba(255,110,60,0.85)'); c.strokeStyle = F('#ffd28a'); c.lineWidth = 1.2;
  for (const sg of [-1, 1]) {
    const span = 26 + flap * 8;
    c.beginPath(); c.moveTo(2, 0);
    c.lineTo(-6, sg * span); c.lineTo(-10, sg * span * 0.6); c.lineTo(-16, sg * span * 0.75); c.lineTo(-14, sg * 4); c.closePath();
    c.fill(); c.stroke();
  }
  c.restore();
  c.save(); c.rotate(ang);
  c.fillStyle = F(e.col); ell(c, 4, 0, 12, 8); c.fill();
  c.fillStyle = F('#c2321c'); ell(c, 13, 1, 6, 4.5); c.fill();
  c.strokeStyle = F('#ffd28a'); c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(0, -6); c.quadraticCurveTo(-6, -12, -12, -10); c.moveTo(0, 6); c.quadraticCurveTo(-6, 12, -12, 10); c.stroke();
  c.fillStyle = '#fff38a'; circ(c, 8, -3.5, 2); c.fill(); circ(c, 8, 3.5, 2); c.fill();
  c.restore();
};

// ===== FUSION SUMMONS =====
DR.plague_swarm = (c, e, t) => {
  DR.spark_beetle(c, e, t);
  c.fillStyle = F('#7dff3a');
  for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1; circ(c, Math.cos(a) * 11, Math.sin(a) * 8 - 2, 1.4); c.fill(); }
  c.strokeStyle = F('#2a0b4a'); c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(-4, -6); c.lineTo(-2, -9); c.moveTo(2, -6); c.lineTo(4, -9); c.stroke();
};
DR.warbeast = (c, e, t) => {
  c.save(); c.scale(1.45, 1.45);
  quad(c, e, t, '#9a6238', '#3b2010', '#ff8a3d');
  c.restore();
  c.save(); c.scale((e.face || 1) * 1.45, 1.45);
  c.strokeStyle = F('#c9d2e0'); c.lineWidth = 2.5;
  for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(i * 6 - 1, 3, 9, -2.3, -0.9); c.stroke(); }
  c.strokeStyle = F('#fff3d6'); c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(18, -1); c.quadraticCurveTo(23, -1, 23, -6); c.stroke();
  c.restore();
};
DR.griffin = (c, e, t) => {
  c.save(); c.rotate(e.ang || 0);
  const flap = e.state === 'dive' ? 0.2 : Math.sin(t * 9 + (e.seed || 0)) * 0.45 + 0.6;
  c.fillStyle = F('#c98a2a'); c.strokeStyle = F('#fff2b8'); c.lineWidth = 1.2;
  for (const sg of [-1, 1]) {
    c.beginPath(); c.moveTo(4, 0);
    c.quadraticCurveTo(0, sg * 28 * flap, -14, sg * (26 * flap + 8));
    c.quadraticCurveTo(-8, sg * 8, -6, 0); c.closePath(); c.fill(); c.stroke();
  }
  c.strokeStyle = F('#c98a2a'); c.lineWidth = 3;
  c.beginPath(); c.moveTo(-10, 0); c.quadraticCurveTo(-20, 6, -24, 0); c.stroke();
  c.fillStyle = F('#ffe08a'); circ(c, -24, 0, 2.5); c.fill();
  c.fillStyle = F('#e0a84a'); ell(c, -2, 0, 12, 6); c.fill();
  c.fillStyle = F(e.col); circ(c, 11, 0, 5.5); c.fill();
  c.fillStyle = F('#ffffff'); tri(c, 14, -2, 20, 0, 14, 2); c.fill();
  c.fillStyle = '#3b7bff'; circ(c, 12, -2, 1.2); c.fill(); circ(c, 12, 2, 1.2); c.fill();
  c.restore();
};
DR.grove_guardian = (c, e, t) => {
  DR.stone_golem(c, e, t);
  const br = Math.sin(t * 2);
  c.fillStyle = F('#2fbf6e');
  for (const [x, y, r] of [[-8, -32, 7], [0, -36, 8], [8, -32, 7], [-22, -10, 6], [22, -10, 6]]) { circ(c, x, y + br, r); c.fill(); }
  c.fillStyle = F('#ff9ad5'); circ(c, 0, -40 + br, 2.5); c.fill(); circ(c, -22, -14 + br, 2); c.fill();
  c.fillStyle = '#9dff7a'; circ(c, 0, -2 + br, 3); c.fill();
};
DR.leviathan = (c, e, t) => {
  c.save(); c.rotate(e.ang || 0);
  const w = Math.sin(t * 6 + (e.seed || 0)) * 0.35;
  c.save(); c.translate(-14, 0); c.rotate(w);
  c.fillStyle = F('#5fd8ef');
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-10, -12, -18, -11); c.quadraticCurveTo(-10, 0, -18, 11); c.quadraticCurveTo(-10, 12, 0, 0); c.fill();
  c.restore();
  c.fillStyle = F('#3a9bff'); ell(c, 0, -9, 6, 3, -0.5); c.fill(); ell(c, 0, 9, 6, 3, 0.5); c.fill();
  c.fillStyle = F('#d8fbff'); ell(c, 0, 0, 16, 8.5); c.fill();
  c.fillStyle = F('#7fe9ff');
  for (let i = -2; i <= 2; i++) { tri(c, i * 5 - 2, -7, i * 5, -14, i * 5 + 2, -7); c.fill(); }
  c.fillStyle = '#08203a'; circ(c, 10, -3, 1.6); c.fill();
  c.restore();
};
DR.phoenix = (c, e, t) => {
  c.save(); c.rotate(e.ang || 0);
  const flap = Math.sin(t * 8 + (e.seed || 0)) * 0.4 + 0.65;
  for (const sg of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      c.fillStyle = F(['#ff4d1a', '#ff8a3d', '#ffcf5a'][k]);
      c.beginPath(); c.moveTo(3, 0);
      c.quadraticCurveTo(-2 - k * 3, sg * (26 - k * 6) * flap, -16 + k * 3, sg * ((24 - k * 6) * flap + 6));
      c.quadraticCurveTo(-8, sg * 6, -5, 0); c.closePath(); c.fill();
    }
  }
  c.fillStyle = F('#ff8a3d');
  for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(-18, i * 6 + Math.sin(t * 10 + i) * 3, -28, i * 9); c.lineTo(-8, i * 2); c.fill(); }
  c.fillStyle = F('#ffcf5a'); ell(c, 0, 0, 9, 5); c.fill();
  c.fillStyle = F('#fff2b8'); circ(c, 9, 0, 4.5); c.fill();
  c.fillStyle = F('#ff4d1a'); tri(c, 12, -1.5, 17, 0, 12, 1.5); c.fill();
  c.restore();
};

// ===== ENEMIES =====
DR.slime = (c, e, t) => {
  const sq = Math.sin(t * 7 + (e.seed || 0)) * 0.12, r = e.baseR || 14;
  c.fillStyle = F(e.col); c.globalAlpha = 0.88;
  c.beginPath();
  c.ellipse(0, r * 0.2, r * (1 + sq) * 1.05, r * (0.95 - sq), 0, Math.PI, 0);
  c.ellipse(0, r * 0.2, r * (1 + sq) * 1.05, r * 0.4, 0, 0, Math.PI);
  c.fill(); c.globalAlpha = 1;
  c.fillStyle = 'rgba(255,255,255,0.55)'; ell(c, -r * 0.38, -r * 0.3, r * 0.26, r * 0.15, -0.4); c.fill();
  c.fillStyle = '#082418'; circ(c, -r * 0.3, 0, r * 0.12); c.fill(); circ(c, r * 0.3, 0, r * 0.12); c.fill();
};

DR.goblin = (c, e, t) => {
  const ph = t * 12 + (e.seed || 0);
  const mv = moving(e);
  const b = mv ? -Math.abs(Math.sin(ph)) * 1.5 : 0;
  c.save(); c.scale(e.face || 1, 1);
  if (e.lunge > 0) c.translate(e.lunge * 20, 0);
  const s = mv ? Math.sin(ph) * 3 : 0;
  c.strokeStyle = F('#2c3a12'); c.lineWidth = 3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-3, 9); c.lineTo(-3 + s, 15); c.moveTo(3, 9); c.lineTo(3 - s, 15); c.stroke();
  if (e.d && e.d.treasureBag) { c.fillStyle = F('#c9a24a'); circ(c, -9, -2 + b, 8); c.fill(); c.fillStyle = F('#ffd34a'); c.font = '800 9px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('◆', -9, 1 + b); }
  c.fillStyle = F(e.crown ? '#6b2a2a' : '#5a3a22'); ell(c, 0, 4 + b, 8, 8); c.fill();
  c.fillStyle = F(e.col); circ(c, 1, -7 + b, 7.5); c.fill();
  tri(c, -5, -9 + b, -14, -13 + b, -5, -4 + b); c.fill();
  tri(c, 6, -9 + b, 15, -13 + b, 6, -4 + b); c.fill();
  c.fillStyle = '#ff3b3b'; circ(c, 4, -8 + b, 1.5); c.fill();
  if (e.d && e.d.bow) {
    c.strokeStyle = F('#c8a26a'); c.lineWidth = 2;
    c.beginPath(); c.arc(9, 0, 9, -1.2, 1.2); c.stroke();
    c.strokeStyle = '#eee'; c.lineWidth = 0.7;
    c.beginPath(); c.moveTo(9 + Math.cos(-1.2) * 9, Math.sin(-1.2) * 9); c.lineTo(9 + Math.cos(1.2) * 9, Math.sin(1.2) * 9); c.stroke();
  } else {
    c.strokeStyle = F('#7a5230'); c.lineWidth = 3;
    c.beginPath(); c.moveTo(7, 3); c.lineTo(15, -8); c.stroke();
    c.fillStyle = F(e.crown ? '#c9d2e0' : '#8a6040');
    if (e.crown) { tri(c, 12, -14, 22, -10, 14, -3); c.fill(); }
    else { circ(c, 15, -9, 3.5); c.fill(); }
  }
  if (e.crown) {
    c.fillStyle = F('#ffd34a');
    c.beginPath(); c.moveTo(-5, -13 + b); c.lineTo(-5, -19 + b); c.lineTo(-2, -16 + b); c.lineTo(1, -21 + b);
    c.lineTo(4, -16 + b); c.lineTo(7, -19 + b); c.lineTo(7, -13 + b); c.closePath(); c.fill();
  }
  c.restore();
};

DR.beast = (c, e, t) => quad(c, e, t, e.col, shade(e.col, 0.55), '#ff3355');

DR.bat = (c, e, t) => {
  const f = Math.sin(t * 22 + (e.seed || 0));
  c.fillStyle = F('#4a2378');
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(0, 0);
    c.quadraticCurveTo(s * 10, -10 * f - 4, s * 20, -4 * f);
    c.lineTo(s * 15, 2); c.lineTo(s * 11, -1); c.lineTo(s * 6, 3); c.closePath(); c.fill();
  }
  c.fillStyle = F(e.col); ell(c, 0, 0, 6, 7); c.fill();
  tri(c, -4, -5, -3, -11, -1, -6); c.fill(); tri(c, 4, -5, 3, -11, 1, -6); c.fill();
  c.fillStyle = '#ff3355'; circ(c, -2, -2, 1.3); c.fill(); circ(c, 2, -2, 1.3); c.fill();
};

DR.crab = (c, e, t) => {
  const mv = moving(e), w = mv ? Math.sin(t * 18 + (e.seed || 0)) * 3 : 0;
  c.strokeStyle = F(shade(e.col, 0.5)); c.lineWidth = 2.5;
  for (let i = 0; i < 3; i++) {
    const y = -4 + i * 5, o = i % 2 ? w : -w;
    c.beginPath(); c.moveTo(-12, y); c.lineTo(-22, y + 5 + o); c.moveTo(12, y); c.lineTo(22, y + 5 - o); c.stroke();
  }
  c.fillStyle = F(e.col);
  circ(c, -19, -12, 6); c.fill(); circ(c, 19, -12, 6); c.fill();
  c.fillStyle = F(shade(e.col, 0.7)); ell(c, 0, 0, 17, 12); c.fill();
  c.fillStyle = F('#7a6a60');
  tri(c, -9, -6, -4, -14, 0, -6); c.fill(); tri(c, 2, -5, 8, -12, 11, -3); c.fill();
  c.fillStyle = '#111'; circ(c, -5, -9, 2); c.fill(); circ(c, 5, -9, 2); c.fill();
};

DR.shard = (c, e, t) => {
  c.save(); c.rotate(t * 1.5 + (e.seed || 0));
  for (let i = 0; i < 5; i++) {
    c.save(); c.rotate((i / 5) * TAU);
    c.fillStyle = F(i % 2 ? '#3fb6d6' : e.col);
    c.beginPath(); c.moveTo(3, -3); c.lineTo(14, 0); c.lineTo(3, 3); c.closePath(); c.fill();
    c.restore();
  }
  c.restore();
  c.fillStyle = F('#e8ffff'); circ(c, 0, 0, 5); c.fill();
  c.fillStyle = '#05313d'; circ(c, 0, 0, 2); c.fill();
};

DR.toad = (c, e, t) => {
  const sq = Math.sin(t * 5 + (e.seed || 0)) * 0.08;
  c.fillStyle = F(e.col); ell(c, 0, 2, 16 * (1 + sq), 11 * (1 - sq)); c.fill();
  c.fillStyle = F('#c6e88a'); ell(c, 0, 6, 10, 5); c.fill();
  c.fillStyle = F(shade(e.col, 0.6)); circ(c, -8, 0, 2.5); c.fill(); circ(c, 7, 3, 2); c.fill(); circ(c, 2, -4, 2); c.fill();
  c.fillStyle = F(e.col); circ(c, -6, -8, 4.5); c.fill(); circ(c, 6, -8, 4.5); c.fill();
  c.fillStyle = '#ffef5a'; circ(c, -6, -8, 2.6); c.fill(); circ(c, 6, -8, 2.6); c.fill();
  c.fillStyle = '#111'; c.fillRect(-6.6, -10, 1.2, 4); c.fillRect(5.4, -10, 1.2, 4);
};

DR.wraith = (c, e, t) => {
  c.globalAlpha = 0.82;
  c.fillStyle = F('#22405e'); c.strokeStyle = F(e.col); c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-11, -6); c.quadraticCurveTo(0, -24, 11, -6); c.lineTo(12, 10);
  for (let i = 0; i <= 6; i++) c.lineTo(12 - i * 4, 10 + (i % 2 ? 6 : 0) + Math.sin(t * 8 + i) * 2);
  c.closePath(); c.fill(); c.stroke();
  c.globalAlpha = 1;
  c.fillStyle = '#060a14'; ell(c, 0, -7, 6, 7); c.fill();
  c.fillStyle = '#b8ecff'; circ(c, -2.5, -8, 1.6); c.fill(); circ(c, 2.5, -8, 1.6); c.fill();
};

DR.imp = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  const f = Math.sin(t * 18 + (e.seed || 0));
  c.fillStyle = F('#6a1010');
  tri(c, -2, -2, -16, -10 - f * 4, -8, 4); c.fill();
  c.strokeStyle = F(e.col); c.lineWidth = 2;
  c.beginPath(); c.moveTo(-6, 6); c.quadraticCurveTo(-14, 12, -12, 4); c.stroke();
  c.fillStyle = F(e.col); circ(c, 0, 2, 7.5); c.fill(); circ(c, 1, -7, 6.5); c.fill();
  c.fillStyle = F('#ffd28a'); tri(c, -4, -11, -6, -18, -1, -12); c.fill(); tri(c, 4, -11, 7, -18, 6, -10); c.fill();
  c.fillStyle = '#ffe94a'; circ(c, 3, -7, 1.5); c.fill();
  c.restore();
};

DR.skeleton = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  if (e.lunge > 0) c.translate(e.lunge * 20, 0);
  const mv = moving(e), s = mv ? Math.sin(t * 10 + (e.seed || 0)) * 3 : 0;
  c.strokeStyle = F('#cfc8b2'); c.lineWidth = 2.5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-3, 9); c.lineTo(-3 + s, 17); c.moveTo(3, 9); c.lineTo(3 - s, 17); c.stroke();
  c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(0, -3); c.lineTo(0, 10); c.stroke();
  for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(0, 0 + i * 3.5, 7 - i, 2, 0, Math.PI * 0.1, Math.PI * 0.9, true); c.stroke(); }
  c.strokeStyle = F('#9aa6ba'); c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(8, 4); c.lineTo(20, -12); c.stroke();
  c.strokeStyle = F('#c9a24a'); c.lineWidth = 2; c.beginPath(); c.moveTo(6, 0); c.lineTo(11, 5); c.stroke();
  c.fillStyle = F('#efe9d6'); circ(c, 1, -10, 7); c.fill();
  c.fillStyle = '#1a1010'; circ(c, -1, -10, 2.2); c.fill(); circ(c, 4, -10, 2.2); c.fill();
  c.fillStyle = '#ff3b3b'; circ(c, -1, -10, 0.9); c.fill(); circ(c, 4, -10, 0.9); c.fill();
  c.restore();
};

DR.bomber = (c, e, t) => {
  const fuse = e.state === 'fuse';
  c.fillStyle = F(fuse && Math.sin(t * 40) > 0 ? '#ff3b3b' : '#2a2a3a');
  circ(c, 0, 0, 11); c.fill();
  c.strokeStyle = F(e.col); c.lineWidth = 2; c.stroke();
  c.fillStyle = F(e.col); c.fillRect(-11, -2, 22, 4);
  c.strokeStyle = F('#c9a24a'); c.lineWidth = 2;
  c.beginPath(); c.moveTo(3, -10); c.quadraticCurveTo(6, -16, 10, -17); c.stroke();
  c.fillStyle = '#fff'; tri(c, -6, -6, -2, -4, -6, -3); c.fill(); tri(c, 6, -6, 2, -4, 6, -3); c.fill();
};

DR.yeti = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  const wind = e.state === 'wind';
  c.fillStyle = F(e.col);
  c.beginPath();
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * TAU, r = (i % 2 ? 20 : 23);
    const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.9;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.fill();
  c.fillStyle = F('#dfe9f5');
  circ(c, -18, wind ? -18 : 4, 8); c.fill(); circ(c, 18, wind ? -18 : 4, 8); c.fill();
  c.fillStyle = F('#9fb6cc'); ell(c, 5, -4, 9, 8); c.fill();
  c.fillStyle = '#3b7bff'; circ(c, 2, -6, 1.8); c.fill(); circ(c, 9, -6, 1.8); c.fill();
  c.fillStyle = '#fff'; tri(c, 3, 0, 5, 4, 7, 0); c.fill();
  c.strokeStyle = F('#c9d6e6'); c.lineWidth = 3;
  c.beginPath(); c.moveTo(-2, -14); c.quadraticCurveTo(-8, -24, -2, -26); c.moveTo(10, -14); c.quadraticCurveTo(16, -24, 10, -26); c.stroke();
  c.restore();
};

DR.demon = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  const f = Math.sin(t * 8 + (e.seed || 0));
  c.fillStyle = F('#3a0a18');
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(0, -4); c.lineTo(s * 22, -16 - f * 4); c.lineTo(s * 18, -4); c.lineTo(s * 22, 4 - f * 2); c.closePath(); c.fill();
  }
  if (e.crown) {
    c.fillStyle = F('#4a4f66'); ell(c, -9, -2, 6, 5); c.fill(); ell(c, 10, -2, 6, 5); c.fill();
  }
  c.fillStyle = F('#a3122e'); ell(c, 0, 3, 10, 11); c.fill();
  c.fillStyle = F(e.col); circ(c, 1, -10, 7); c.fill();
  c.strokeStyle = F('#1a050a'); c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(-3, -15); c.quadraticCurveTo(-9, -20, -7, -26); c.moveTo(5, -15); c.quadraticCurveTo(11, -20, 9, -26); c.stroke();
  c.fillStyle = '#ffd84a'; circ(c, -1, -10, 1.6); c.fill(); circ(c, 4, -10, 1.6); c.fill();
  if (e.crown) {
    c.fillStyle = F('#ffd34a');
    c.beginPath(); c.moveTo(-5, -16); c.lineTo(-4, -22); c.lineTo(-1, -18); c.lineTo(1, -24); c.lineTo(4, -18); c.lineTo(7, -22); c.lineTo(7, -16); c.closePath(); c.fill();
  }
  c.restore();
};

DR.cultist = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  const b = Math.sin(t * 4 + (e.seed || 0));
  c.fillStyle = F('#3a1866'); c.strokeStyle = F(e.col); c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(-6, -4); c.lineTo(6, -4); c.lineTo(11, 15); c.lineTo(-11, 15); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = F('#2a1050'); circ(c, 0, -9 + b * 0.5, 7.5); c.fill();
  c.fillStyle = '#05010a'; ell(c, 2, -8 + b * 0.5, 4, 4.5); c.fill();
  c.fillStyle = '#e2a8ff'; circ(c, 1, -8 + b * 0.5, 1.2); c.fill(); circ(c, 4, -8 + b * 0.5, 1.2); c.fill();
  c.strokeStyle = F('#8a6a4a'); c.lineWidth = 2;
  c.beginPath(); c.moveTo(10, 14); c.lineTo(10, -16); c.stroke();
  c.fillStyle = F('#d06bff'); circ(c, 10, -19, 3.5); c.fill();
  c.restore();
};

// ===== BOSSES =====
DR.warchief = (c, e, t) => { e.crown = true; DR.goblin(c, e, t); };
DR.general = (c, e, t) => { e.crown = true; DR.demon(c, e, t); };

DR.treant = (c, e, t) => {
  const sw = Math.sin(t * 1.5) * 0.05;
  c.strokeStyle = F('#4a2f1a'); c.lineWidth = 6; c.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const x = -24 + i * 12;
    c.beginPath(); c.moveTo(x * 0.6, 26); c.quadraticCurveTo(x, 34, x * 1.4, 36 + Math.sin(t + i) * 2); c.stroke();
  }
  c.fillStyle = F('#5a3b22'); rr(c, -22, -22, 44, 52, 14); c.fill();
  c.strokeStyle = F('#3a2414'); c.lineWidth = 2;
  c.beginPath(); c.moveTo(-12, -16); c.lineTo(-10, 22); c.moveTo(12, -14); c.lineTo(14, 20); c.moveTo(0, 20); c.lineTo(2, 28); c.stroke();
  c.fillStyle = '#d6ff6a'; ell(c, -9, 0, 4, 6); c.fill(); ell(c, 9, 0, 4, 6); c.fill();
  c.fillStyle = '#1a0f08'; ell(c, 0, 14, 9, e.pat ? 6 : 3.5); c.fill();
  c.save(); c.rotate(sw);
  const blobs = [[-30, -34, 22, '#1f6b34'], [30, -34, 22, '#1f6b34'], [0, -48, 26, '#2f9a4a'], [-15, -58, 18, '#36a852'], [16, -60, 18, '#2f9a4a']];
  for (const [x, y, r, col] of blobs) { c.fillStyle = F(col); circ(c, x, y, r); c.fill(); }
  c.fillStyle = '#d6ff6a';
  for (let i = 0; i < 7; i++) { const a = i * 2.3 + t * 0.5; circ(c, Math.cos(a) * 28, -44 + Math.sin(a * 1.3) * 14, 1.8); c.fill(); }
  c.restore();
};

DR.crystal = (c, e, t) => {
  c.save(); c.rotate(t * 0.3);
  for (let i = 0; i < 7; i++) {
    c.save(); c.rotate((i / 7) * TAU);
    const L = 40 + (i % 2) * 8;
    c.fillStyle = F(i % 2 ? 'rgba(63,182,214,0.9)' : 'rgba(127,233,255,0.9)');
    c.strokeStyle = F('#d8fbff'); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(10, -6); c.lineTo(L - 8, -8); c.lineTo(L, 0); c.lineTo(L - 8, 8); c.lineTo(10, 6); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
  c.restore();
  c.fillStyle = F('#e8ffff'); circ(c, 0, 0, 15); c.fill();
  c.fillStyle = '#05313d'; ell(c, -5, -1, 2, 5); c.fill(); ell(c, 5, -1, 2, 5); c.fill();
};

DR.hydra = (c, e, t) => {
  c.fillStyle = F('#2f8a55'); ell(c, 0, 12, 40, 26); c.fill();
  c.fillStyle = F('#7ed69a'); ell(c, 0, 20, 26, 12); c.fill();
  const bases = [[-20, 0], [0, -8], [20, 0]];
  bases.forEach(([bx, by], i) => {
    const hx = bx * 1.8 + Math.sin(t * 2 + i * 2) * 8, hy = -46 - Math.cos(t * 2.3 + i) * 7 + (i === 1 ? -10 : 0);
    c.strokeStyle = F('#3fae6a'); c.lineWidth = 11; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx * 1.2, (by + hy) / 2 + 10, hx, hy); c.stroke();
    c.fillStyle = F(e.col); ell(c, hx, hy, 12, 8); c.fill();
    c.fillStyle = '#ffef5a'; circ(c, hx - 4, hy - 2, 2); c.fill(); circ(c, hx + 4, hy - 2, 2); c.fill();
    c.fillStyle = '#0a2012'; ell(c, hx, hy + 4, 5, e.pat ? 3 : 1.2); c.fill();
  });
};

DR.bonelord = (c, e, t) => {
  c.fillStyle = F('#1d1430'); c.strokeStyle = F('#7a5cc4'); c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-20, -4); c.lineTo(20, -4); c.lineTo(28, 34);
  for (let i = 0; i <= 7; i++) c.lineTo(28 - i * 8, 34 + (i % 2 ? 7 : 0) + Math.sin(t * 5 + i) * 2);
  c.closePath(); c.fill(); c.stroke();
  c.fillStyle = F('#efe9d6'); circ(c, 0, -18, 18); c.fill();
  c.fillStyle = F('#d9d1ba'); rr(c, -11, -6, 22, 10, 3); c.fill();
  c.fillStyle = '#120a1e'; ell(c, -7, -20, 5, 6); c.fill(); ell(c, 7, -20, 5, 6); c.fill();
  c.fillStyle = '#c49bff'; circ(c, -7, -20, 2.2); c.fill(); circ(c, 7, -20, 2.2); c.fill();
  c.fillStyle = F('#c9a24a');
  c.beginPath(); c.moveTo(-14, -30); c.lineTo(-12, -42); c.lineTo(-6, -34); c.lineTo(0, -46); c.lineTo(6, -34); c.lineTo(12, -42); c.lineTo(14, -30); c.closePath(); c.fill();
  c.strokeStyle = F('#efe9d6'); c.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const a = t * 1.2 + (i * TAU) / 4, x = Math.cos(a) * 52, y = Math.sin(a) * 30;
    c.save(); c.translate(x, y); c.rotate(a * 2);
    c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.stroke();
    circ(c, -8, 0, 2.5); c.fill(); circ(c, 8, 0, 2.5); c.fill();
    c.restore();
  }
};

DR.wyvern = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  const f = Math.sin(t * 4);
  c.fillStyle = F('rgba(120,190,230,0.85)'); c.strokeStyle = F('#e8fbff'); c.lineWidth = 1.5;
  for (const s of [-1, 1]) {
    const span = 52 + f * 10 * s;
    c.beginPath(); c.moveTo(-4, -6);
    c.lineTo(-10, -span); c.lineTo(-22, -span * 0.55); c.lineTo(-34, -span * 0.7); c.lineTo(-30, -8); c.closePath();
    c.save(); if (s > 0) { c.scale(1, -0.45); c.translate(0, 18); } c.fill(); c.stroke(); c.restore();
  }
  c.strokeStyle = F('#6fb8d6'); c.lineWidth = 8; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-20, 4); c.quadraticCurveTo(-42, 14 + f * 4, -54, 2); c.stroke();
  c.fillStyle = F('#c8f6ff'); tri(c, -54, 2, -64, -6, -62, 10); c.fill();
  c.fillStyle = F(e.col); ell(c, 0, 0, 26, 14); c.fill();
  c.fillStyle = F('#e8fbff'); ell(c, 0, 6, 18, 6); c.fill();
  c.strokeStyle = F(e.col); c.lineWidth = 9;
  c.beginPath(); c.moveTo(18, -4); c.quadraticCurveTo(28, -16, 34, -14); c.stroke();
  c.fillStyle = F('#8fd6f0'); ell(c, 38, -14, 12, 8, 0.1); c.fill();
  c.fillStyle = '#fff38a'; circ(c, 41, -17, 2); c.fill();
  c.strokeStyle = F('#e8fbff'); c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(32, -20); c.quadraticCurveTo(26, -30, 20, -30); c.stroke();
  c.fillStyle = F('#c8f6ff');
  for (let i = 0; i < 4; i++) { tri(c, -14 + i * 9, -12, -10 + i * 9, -22, -6 + i * 9, -12); c.fill(); }
  c.restore();
};

DR.abysslord = (c, e, t) => {
  c.fillStyle = F('#0a0614');
  c.beginPath(); c.moveTo(-18, -20); c.lineTo(18, -20); c.lineTo(46, 40);
  for (let i = 0; i <= 8; i++) c.lineTo(46 - i * 11.5, 40 + Math.sin(t * 3 + i) * 5 + (i % 2 ? 6 : 0));
  c.closePath(); c.fill();
  c.fillStyle = F('#1a0f33'); c.strokeStyle = F('#b06bff'); c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-14, -14); c.lineTo(14, -14); c.lineTo(22, 32); c.lineTo(-22, 32); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = F('#2a1a40'); c.lineWidth = 5;
  c.beginPath(); c.moveTo(-10, -32); c.quadraticCurveTo(-30, -40, -26, -58); c.moveTo(10, -32); c.quadraticCurveTo(30, -40, 26, -58); c.stroke();
  c.fillStyle = F('#120a24'); circ(c, 0, -28, 14); c.fill();
  c.fillStyle = '#ff4dd2'; ell(c, -5, -28, 3, 2); c.fill(); ell(c, 5, -28, 3, 2); c.fill();
  c.fillStyle = F('#b06bff');
  c.beginPath(); c.moveTo(-12, -38); c.lineTo(-10, -52); c.lineTo(-5, -42); c.lineTo(0, -58); c.lineTo(5, -42); c.lineTo(10, -52); c.lineTo(12, -38); c.closePath(); c.fill();
  c.fillStyle = F('#d48bff');
  for (let i = 0; i < 5; i++) { const a = t * 0.9 + (i * TAU) / 5; circ(c, Math.cos(a) * 62, Math.sin(a) * 36, 5); c.fill(); }
};

// ---------- Card icons (used in hotbar + grimoire) ----------
function renderCardIcon(cv, id, locked) {
  const c = cv.getContext('2d'), w = cv.width, h = cv.height;
  const card = CARDS[id], rk = RANK_BY_ID[card.rank];
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, w, h);
  const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.7);
  g.addColorStop(0, rgba(rk.color, locked ? 0.08 : 0.35)); g.addColorStop(1, 'rgba(8,6,20,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.save();
  c.translate(w / 2, h / 2 + (card.ai === 'heal' || card.ai === 'taunt' ? 4 : 0));
  const BASES = { ember_wyrm: 30, stone_golem: 30, grove_guardian: 34, thorn_vine: 26, warbeast: 30, griffin: 26, phoenix: 28, leviathan: 24, seraph: 30, archon: 40 };
  if (id === 'archon') c.translate(0, 14);
  const base = BASES[id] || Math.max(card.r * 1.25, 12);
  const sc = (w * 0.36) / base;
  c.scale(sc, sc);
  const up = ['gale_hawk', 'griffin', 'phoenix'].includes(id);
  const fake = { col: card.color, r: card.r, face: 1, vx: 0, vy: 0, ang: up ? -Math.PI / 2 : 0, t: 0.4, seed: 1, state: '', lunge: 0, iconMode: true };
  if (id === 'ember_wyrm') { fake.ang = -0.5; c.translate(10, 4); }
  if (id === 'tide_koi' || id === 'leviathan') fake.ang = -0.4;
  if (locked) c.globalAlpha = 0.25;
  FLASH = false;
  c.globalCompositeOperation = 'lighter';
  glowAt(c, 0, 0, base * 1.1, card.color, locked ? 0.15 : 0.45);
  c.globalCompositeOperation = 'source-over';
  DR[id](c, fake, 0.4);
  c.restore();
  if (locked) {
    c.fillStyle = 'rgba(200,190,255,0.75)';
    c.font = `800 ${Math.round(w * 0.32)}px Inter, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('?', w / 2, h / 2);
  }
}
function renderPortrait(cv) {
  const c = cv.getContext('2d'), w = cv.width;
  c.clearRect(0, 0, w, w);
  const g = c.createRadialGradient(w / 2, w / 2, 2, w / 2, w / 2, w * 0.6);
  g.addColorStop(0, 'rgba(110,130,255,0.45)'); g.addColorStop(1, 'rgba(8,6,20,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, w);
  c.save(); c.translate(w / 2 + 4, w / 2 + 8); c.scale(w / 50, w / 50);
  FLASH = false;
  DR.allen(c, { vx: 0, vy: 0, face: 1 }, 0);
  c.restore();
}

// ---------- ground + decorations ----------
const _groundCache = {};
function groundPattern(idx) {
  if (_groundCache[idx]) return _groundCache[idx];
  const th = STAGES[idx].theme, S = 512;
  const g = document.createElement('canvas'); g.width = g.height = S;
  const c = g.getContext('2d');
  c.fillStyle = th.ground; c.fillRect(0, 0, S, S);
  const rng = mulberry32(1000 + idx * 77);
  const wrapDraw = (fn) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) fn(ox, oy); };
  for (let i = 0; i < 46; i++) {
    const x = rng() * S, y = rng() * S, r = 40 + rng() * 110;
    const col = rng() < 0.6 ? th.ground2 : shade(th.ground, 1.35);
    wrapDraw((ox, oy) => {
      const grd = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      grd.addColorStop(0, rgba(col, 0.55)); grd.addColorStop(1, rgba(col, 0));
      c.fillStyle = grd; c.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    });
  }
  for (let i = 0; i < 420; i++) {
    const x = rng() * S, y = rng() * S;
    c.fillStyle = rgba(th.speck, 0.05 + rng() * 0.12);
    c.fillRect(x, y, 1 + rng() * 2, 1 + rng() * 2);
  }
  _groundCache[idx] = g;
  return g;
}
let _patCtx = null, _pat = null, _patIdx = -1;
function getPattern(c, idx) {
  if (_patIdx !== idx || _patCtx !== c) { _pat = c.createPattern(groundPattern(idx), 'repeat'); _patIdx = idx; _patCtx = c; }
  return _pat;
}

function genDeco(idx) {
  const th = STAGES[idx].theme, rng = mulberry32(5000 + idx * 131), out = [];
  const types = th.deco;
  let total = 0; for (const k in types) total += types[k];
  for (let i = 0; i < 520; i++) {
    let r = rng() * total, type = 'rock';
    for (const k in types) { r -= types[k]; if (r <= 0) { type = k; break; } }
    const x = (rng() * 2 - 1) * BOUND, y = (rng() * 2 - 1) * BOUND;
    if (x * x + y * y < 140 * 140) continue;
    out.push({ x, y, type, s: 0.7 + rng() * 0.7, rot: rng() * TAU, seed: rng() * 100 });
  }
  out.sort((a, b) => a.y - b.y);
  return out;
}

const DECO = {
  tuft(c, d, t, th) {
    c.strokeStyle = rgba(th.accent, 0.35); c.lineWidth = 1.6;
    for (let i = -2; i <= 2; i++) {
      const sway = Math.sin(t * 1.6 + d.seed + i) * 2;
      c.beginPath(); c.moveTo(i * 3, 0); c.quadraticCurveTo(i * 3 + sway, -6, i * 4 + sway * 1.5, -10 - Math.abs(i) * -1.5); c.stroke();
    }
  },
  flower(c, d, t, th) {
    c.globalCompositeOperation = 'lighter';
    glowAt(c, 0, 0, 12, d.seed > 50 ? '#ff9ad5' : '#ffe08a', 0.35 + Math.sin(t * 2 + d.seed) * 0.15);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = d.seed > 50 ? '#ffb8e2' : '#fff0a8';
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; circ(c, Math.cos(a) * 3, Math.sin(a) * 3, 2); c.fill(); }
  },
  rock(c, d) {
    c.fillStyle = 'rgba(0,0,0,0.25)'; ell(c, 2, 8, 16, 5); c.fill();
    c.fillStyle = '#3d4254';
    c.beginPath(); c.moveTo(-14, 6); c.lineTo(-10, -6); c.lineTo(0, -10); c.lineTo(12, -4); c.lineTo(14, 6); c.closePath(); c.fill();
    c.fillStyle = '#565d75'; tri(c, -10, -6, 0, -10, -2, 0); c.fill();
  },
  snowrock(c, d) {
    DECO.rock(c, d);
    c.fillStyle = '#e8f6ff';
    c.beginPath(); c.moveTo(-10, -6); c.lineTo(0, -10); c.lineTo(12, -4); c.lineTo(6, -2); c.lineTo(-4, -4); c.closePath(); c.fill();
  },
  tree(c, d, t) {
    c.fillStyle = 'rgba(0,0,0,0.3)'; ell(c, 6, 18, 40, 12); c.fill();
    c.fillStyle = '#2a1a10'; c.fillRect(-5, 0, 10, 20);
    const sw = Math.sin(t * 0.8 + d.seed) * 2;
    c.fillStyle = '#103a20'; circ(c, sw, -16, 34); c.fill();
    c.fillStyle = '#17502b'; circ(c, sw - 8, -22, 24); c.fill();
    c.fillStyle = '#1f6a38'; circ(c, sw - 12, -28, 13); c.fill();
  },
  mushroom(c, d, t) {
    c.fillStyle = '#d9d0c0'; c.fillRect(-2, -4, 4, 8);
    const col = d.seed > 50 ? '#c78bff' : '#5fffd0';
    c.fillStyle = shade(col, 0.6); c.beginPath(); c.ellipse(0, -4, 8, 6, 0, Math.PI, 0); c.fill();
    c.globalCompositeOperation = 'lighter';
    glowAt(c, 0, -6, 18, col, 0.3 + Math.sin(t * 2 + d.seed) * 0.12);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = col; circ(c, -3, -6, 1.3); c.fill(); circ(c, 2, -8, 1.3); c.fill();
  },
  crystal(c, d, t, th) {
    const col = th.accent;
    c.globalCompositeOperation = 'lighter';
    glowAt(c, 0, -10, 34, col, 0.28 + Math.sin(t * 1.5 + d.seed) * 0.1);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = rgba(col, 0.7); c.strokeStyle = rgba('#ffffff', 0.6); c.lineWidth = 1;
    for (const [ox, h, w] of [[-7, 22, 5], [0, 32, 6], [8, 18, 5]]) {
      c.beginPath(); c.moveTo(ox - w, 0); c.lineTo(ox - w * 0.7, -h + 6); c.lineTo(ox, -h); c.lineTo(ox + w * 0.7, -h + 6); c.lineTo(ox + w, 0); c.closePath(); c.fill(); c.stroke();
    }
  },
  ice(c, d, t) {
    c.fillStyle = 'rgba(190,240,255,0.55)'; c.strokeStyle = 'rgba(255,255,255,0.7)';
    for (const [ox, h] of [[-6, 18], [3, 26], [10, 14]]) { tri(c, ox - 5, 0, ox, -h, ox + 5, 0); c.fill(); c.stroke(); }
  },
  reed(c, d, t) {
    c.strokeStyle = '#3e6b3a'; c.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      const sw = Math.sin(t * 1.2 + d.seed + i) * 3;
      c.beginPath(); c.moveTo(i * 3, 0); c.quadraticCurveTo(i * 3, -12, i * 3 + sw, -22 - (i % 2) * 4); c.stroke();
    }
    c.fillStyle = '#6a4a2a'; ell(c, 3 + Math.sin(t * 1.2 + d.seed) * 3, -22, 2, 5); c.fill();
  },
  pool(c, d, t) {
    c.fillStyle = 'rgba(10,40,40,0.75)'; ell(c, 0, 0, 46, 22); c.fill();
    c.strokeStyle = `rgba(150,255,200,${0.15 + Math.sin(t * 2 + d.seed) * 0.08})`; c.lineWidth = 1.5;
    ell(c, 0, 0, 30 + Math.sin(t + d.seed) * 6, 13); c.stroke();
  },
  bone(c, d) {
    c.strokeStyle = '#cfc8b2'; c.lineWidth = 3; c.fillStyle = '#cfc8b2';
    c.beginPath(); c.moveTo(-9, 0); c.lineTo(9, 0); c.stroke();
    circ(c, -9, -2, 2.4); c.fill(); circ(c, -9, 2, 2.4); c.fill(); circ(c, 9, -2, 2.4); c.fill(); circ(c, 9, 2, 2.4); c.fill();
  },
  crack(c, d, t, th) {
    const col = th.accent;
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(col, 0.35 + Math.sin(t * 2 + d.seed) * 0.15); c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(-26, -4); c.lineTo(-12, 3); c.lineTo(-2, -5); c.lineTo(10, 4); c.lineTo(24, -2);
    c.moveTo(-2, -5); c.lineTo(2, -16); c.stroke();
    glowAt(c, 0, 0, 30, col, 0.15);
    c.globalCompositeOperation = 'source-over';
  },
  rune(c, d, t, th) {
    c.scale(1, 0.55);
    drawMagicCircle(c, 0, 0, 34, t * 0.2 + d.seed, th.accent, 0.25 + Math.sin(t * 1.4 + d.seed) * 0.12, true);
  },
};

// ---------- ambient screen particles ----------
const AMB = [];
function initAmbient() {
  AMB.length = 0;
  for (let i = 0; i < 70; i++) AMB.push({ x: Math.random(), y: Math.random(), z: rand(0.3, 1), ph: rand(TAU), s: rand(0.6, 1.4) });
}
function drawAmbient(c, type, t, dt, camX, camY) {
  c.globalCompositeOperation = 'lighter';
  const W_ = VW, H_ = VH;
  for (const a of AMB) {
    let vx = 0, vy = 0, col = '#d6ff6a', size = 3, alpha = 0.6;
    switch (type) {
      case 'firefly': vx = Math.sin(t * 0.7 + a.ph) * 0.012; vy = Math.cos(t * 0.5 + a.ph) * 0.01; col = '#d6ff6a'; alpha = 0.35 + Math.sin(t * 3 + a.ph) * 0.35; break;
      case 'dust': vx = 0.004; vy = -0.003; col = '#9fd6ff'; size = 2; alpha = 0.3; break;
      case 'spore': vx = Math.sin(t + a.ph) * 0.006; vy = -0.012; col = '#9fd66a'; size = 1.8; alpha = 0.22; break;
      case 'ember': vx = Math.sin(t + a.ph) * 0.01; vy = -0.035; col = '#ff8a3d'; size = 2.5; alpha = 0.55; break;
      case 'ember2': vx = Math.sin(t + a.ph) * 0.01; vy = -0.03; col = '#ff4d7a'; size = 2.5; alpha = 0.5; break;
      case 'snow': vx = 0.02 + Math.sin(t + a.ph) * 0.01; vy = 0.05; col = '#ffffff'; size = 2.5; alpha = 0.55; break;
      case 'void': vx = Math.cos(t * 0.3 + a.ph) * 0.008; vy = -0.008; col = '#b06bff'; size = 3; alpha = 0.4; break;
      case 'ash': vx = 0.006 + Math.sin(t + a.ph) * 0.006; vy = 0.02; col = '#b0a090'; size = 2.2; alpha = 0.35; break;
      case 'star': vx = 0; vy = 0; col = a.ph > 3 ? '#fff2a8' : '#bfefff'; size = 2; alpha = 0.25 + Math.max(0, Math.sin(t * 2 + a.ph * 5)) * 0.6; break;
      case 'feather': vx = Math.sin(t * 0.8 + a.ph) * 0.015; vy = 0.018; col = '#ffe9a8'; size = 2.6; alpha = 0.45; break;
      default: vx = 0; vy = -0.01; col = '#c78bff'; size = 2.5; alpha = 0.45;
    }
    a.x += vx * dt * 3 * a.z; a.y += vy * dt * 3 * a.z;
    let sx = ((a.x * W_ - camX * 0.25 * a.z) % W_ + W_) % W_;
    let sy = ((a.y * H_ - camY * 0.25 * a.z) % H_ + H_) % H_;
    glowAt(c, sx, sy, size * 3 * a.s * a.z, col, Math.max(0, alpha) * a.z);
  }
  c.globalCompositeOperation = 'source-over';
}

let _vignette = null;
function buildVignette() {
  _vignette = document.createElement('canvas');
  _vignette.width = Math.max(1, Math.floor(VW / 2)); _vignette.height = Math.max(1, Math.floor(VH / 2));
  const c = _vignette.getContext('2d'), w = _vignette.width, h = _vignette.height;
  const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.55);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.72)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
}

// ---------- telegraphs ----------
function drawTelegraph(c, g) {
  const k = clamp(g.t / g.dur, 0, 1);
  const pulse = 0.5 + Math.sin(W.t * 20) * 0.15;
  c.save();
  c.fillStyle = `rgba(255,40,70,${0.12 + 0.1 * pulse})`;
  c.strokeStyle = `rgba(255,90,110,${0.7})`; c.lineWidth = 2;
  if (g.type === 'circle') {
    circ(c, g.x, g.y, g.r); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,60,90,0.28)'; circ(c, g.x, g.y, g.r * k); c.fill();
  } else if (g.type === 'line') {
    c.translate(g.x, g.y); c.rotate(g.ang);
    c.fillRect(0, -g.w / 2, g.len, g.w); c.strokeRect(0, -g.w / 2, g.len, g.w);
    c.fillStyle = 'rgba(255,60,90,0.28)'; c.fillRect(0, -g.w / 2, g.len * k, g.w);
  } else if (g.type === 'cone') {
    c.translate(g.x, g.y);
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, g.len, g.ang - g.half, g.ang + g.half); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,60,90,0.28)';
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, g.len * k, g.ang - g.half, g.ang + g.half); c.closePath(); c.fill();
  }
  c.restore();
}

// ---------- main world render ----------
function drawEntity(c, e, kind, t) {
  c.save();
  c.translate(e.x, e.y);
  let sc = 1;
  if (kind === 'enemy') sc = e.r / (e.isBoss ? e.bd.drawR : e.baseR);
  const sp = e.spawnT ?? 1;
  if (sp < 1) sc *= 0.3 + 0.7 * (1 - Math.pow(1 - sp, 3));
  // squash on hit, gentle breathing while idle
  const hit = e.flash > 0, breathe = kind === 'player' ? 1 : 1 + Math.sin(t * 3 + (e.seed || 0)) * 0.025;
  c.scale(sc * (hit ? 1.12 : 1), sc * (hit ? 0.9 : breathe));
  const key = kind === 'player' ? 'allen' : kind === 'summon' ? e.id : (e.isBoss ? e.bd.draw : e.d.draw);
  if (OUTLINES_ON && !e.down) {
    c.save(); c.scale(1.13, 1.13); OUTLINE = true;
    const ga = c.globalAlpha; c.globalAlpha = ga * 0.85;
    DR[key](c, e, t);
    c.globalAlpha = ga; OUTLINE = false; c.restore();
  }
  FLASH = hit;
  DR[key](c, e, t);
  FLASH = false;
  c.restore();
}

function renderWorld(dt) {
  const p = W.player, th = W.st.theme, t = W.t;
  const z = ZOOM * (W.zk || 1);
  OUTLINES_ON = GFX_ON.outlines();
  let cx = W.camX, cy = W.camY;
  const sh = W.shake * SETTINGS.shake;
  if (sh > 0.3) { cx += rand(-sh, sh); cy += rand(-sh, sh); }
  const vx0 = cx - VW / 2 / z, vy0 = cy - VH / 2 / z, vx1 = cx + VW / 2 / z, vy1 = cy + VH / 2 / z;
  const inView = (x, y, m) => x > vx0 - m && x < vx1 + m && y > vy0 - m && y < vy1 + m;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = th.bg; ctx.fillRect(0, 0, VW, VH);
  ctx.setTransform(DPR * z, 0, 0, DPR * z, DPR * (VW / 2 - cx * z), DPR * (VH / 2 - cy * z));

  // ground
  ctx.fillStyle = getPattern(ctx, W.themeIdx);
  const gx0 = Math.max(vx0, -BOUND), gy0 = Math.max(vy0, -BOUND), gx1 = Math.min(vx1, BOUND), gy1 = Math.min(vy1, BOUND);
  if (gx1 > gx0 && gy1 > gy0) ctx.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  // arena border
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(th.accent, 0.35 + Math.sin(t * 2) * 0.1); ctx.lineWidth = 6;
  ctx.strokeRect(-BOUND, -BOUND, BOUND * 2, BOUND * 2);
  ctx.strokeStyle = rgba(th.accent, 0.12); ctx.lineWidth = 26;
  ctx.strokeRect(-BOUND, -BOUND, BOUND * 2, BOUND * 2);
  ctx.globalCompositeOperation = 'source-over';

  // decorations
  for (const d of W.deco) {
    if (!inView(d.x, d.y, 70)) continue;
    ctx.save(); ctx.translate(d.x, d.y); ctx.scale(d.s, d.s);
    DECO[d.type](ctx, d, t, th);
    ctx.restore();
  }

  // summon auras
  for (const s of W.summons) {
    const a = s.aura; if (!a || !inView(s.x, s.y, a)) continue;
    if (s.healAura) {
      ctx.fillStyle = rgba('#4dffa6', 0.05); circ(ctx, s.x, s.y, s.healAura); ctx.fill();
      ctx.strokeStyle = rgba('#4dffa6', 0.3); ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 20;
      circ(ctx, s.x, s.y, s.healAura); ctx.stroke(); ctx.setLineDash([]);
    }
    if (s.c.ai === 'heal') {
      ctx.fillStyle = rgba('#4dffa6', 0.06); circ(ctx, s.x, s.y, a); ctx.fill();
      ctx.strokeStyle = rgba('#4dffa6', 0.35 + Math.sin(t * 3) * 0.15); ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 20; circ(ctx, s.x, s.y, a); ctx.stroke(); ctx.setLineDash([]);
    } else if (s.c.ai === 'thorns') {
      ctx.fillStyle = 'rgba(20,90,45,0.28)'; circ(ctx, s.x, s.y, a); ctx.fill();
      ctx.strokeStyle = rgba('#37e07a', 0.5); ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 36; i++) { const an = (i / 36) * TAU, rr_ = a + (i % 2 ? 6 : -4); const x = s.x + Math.cos(an) * rr_, y = s.y + Math.sin(an) * rr_; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    } else if (s.c.ai === 'taunt') {
      ctx.strokeStyle = rgba('#ffcf5a', 0.13); ctx.lineWidth = 2; ctx.setLineDash([4, 10]);
      circ(ctx, s.x, s.y, a); ctx.stroke(); ctx.setLineDash([]);
    } else if (s.c.ai === 'buffer') {
      ctx.strokeStyle = rgba('#5ab8ff', 0.18 + Math.sin(t * 2.5) * 0.06); ctx.lineWidth = 2;
      circ(ctx, s.x, s.y, a * (0.95 + Math.sin(t * 2) * 0.03)); ctx.stroke();
    }
  }

  // skill zones
  for (const z of W.zones) {
    if (!inView(z.x, z.y, z.r)) continue;
    const k = z.t / z.dur, fade = k < 0.1 ? k / 0.1 : k > 0.85 ? (1 - k) / 0.15 : 1;
    const col = z.type === 'fire' ? '#ff6a1a' : z.type === 'poison' ? '#9b3cff' : '#9ff6ff';
    const g = ctx.createRadialGradient(z.x, z.y, z.r * 0.2, z.x, z.y, z.r);
    g.addColorStop(0, rgba(col, 0.32 * fade)); g.addColorStop(1, rgba(col, 0.06 * fade));
    ctx.fillStyle = g; circ(ctx, z.x, z.y, z.r); ctx.fill();
    ctx.strokeStyle = rgba(col, 0.6 * fade); ctx.lineWidth = 2.5;
    ctx.setLineDash([14, 10]); ctx.lineDashOffset = t * 30; circ(ctx, z.x, z.y, z.r); ctx.stroke(); ctx.setLineDash([]);
  }

  drawEvents(ctx, t);

  // telegraphs + magic circles
  for (const g of W.tele) drawTelegraph(ctx, g);
  for (const m of W.circles) {
    const k = m.t / m.dur, a = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
    ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1, 0.6);
    drawMagicCircle(ctx, 0, 0, m.r * (0.6 + 0.4 * Math.min(1, k * 4)), m.rot + t * 2, m.color, a);
    ctx.restore();
  }

  // summon reticle at cursor
  if (!p.dead) {
    const m = summonPoint();
    ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1, 0.6);
    drawMagicCircle(ctx, 0, 0, 22, t, '#c9b6ff', 0.35, false);
    ctx.restore();
  }

  // pickups
  ctx.globalCompositeOperation = 'lighter';
  for (const k of W.pickups) {
    if (!inView(k.x, k.y, 20)) continue;
    const bob = Math.sin(t * 5 + k.x) * 2;
    if (k.type === 'exp') glowAt(ctx, k.x, k.y + bob, 9 + Math.min(10, Math.sqrt(k.val) * 2), '#5ff7ff', 0.8);
    else if (k.type === 'stone') glowAt(ctx, k.x, k.y + bob, 20, '#c78bff', 0.9);
    else glowAt(ctx, k.x, k.y + bob, 18, '#ff4d6d', 0.8);
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const k of W.pickups) {
    if (!inView(k.x, k.y, 20)) continue;
    const bob = Math.sin(t * 5 + k.x) * 2;
    ctx.save(); ctx.translate(k.x, k.y + bob);
    if (k.type === 'exp') {
      const s = 3 + Math.min(4, Math.sqrt(k.val));
      ctx.rotate(t * 2); ctx.fillStyle = '#c8feff'; ctx.fillRect(-s / 2, -s / 2, s, s);
    } else if (k.type === 'stone') {
      ctx.fillStyle = '#e2c6ff'; ctx.strokeStyle = '#7a3cff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, -2); ctx.lineTo(0, 7); ctx.lineTo(-5, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = '#ff6b85';
      ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(-9, -2, -4, -9, 0, -4); ctx.bezierCurveTo(4, -9, 9, -2, 0, 5); ctx.fill();
    }
    ctx.restore();
  }

  // entity list
  const list = [];
  for (const e of W.enemies) if (!e.dead && inView(e.x, e.y, e.r + 60)) list.push([e, 'enemy']);
  for (const s of W.summons) if (inView(s.x, s.y, 80)) list.push([s, 'summon']);
  if (!p.dead) list.push([p, 'player']);

  // glow pass
  ctx.globalCompositeOperation = 'lighter';
  for (const [e, k] of list) {
    if (k === 'player') {
      glowAt(ctx, e.x, e.y, 46, p.enhT > 0 ? '#ffd34a' : '#6f86ff', 0.35);
      glowAt(ctx, e.x - (e.face || 1) * 18, e.y - 14, 20, '#ffd66b', 0.5);
    } else if (k === 'summon') {
      glowAt(ctx, e.x, e.y, e.r * 2.6 + 6, e.col, (e.buffT > 0 || p.enhT > 0 ? 0.55 : 0.32) * (e.spawnT ?? 1));
      if (e.state === 'breath') glowAt(ctx, e.x, e.y, 60, '#ff8a3d', 0.5);
    } else {
      if (e.isBoss) glowAt(ctx, e.x, e.y, e.r * 2.6, e.col, 0.35 + (e.pat ? 0.2 : 0));
      else if (e.elite) glowAt(ctx, e.x, e.y, e.r * 3, '#ffd34a', 0.35);
      else glowAt(ctx, e.x, e.y, e.r * 2.2, e.col, 0.16);
      if (e.state === 'wind' || e.state === 'fuse') glowAt(ctx, e.x, e.y, e.r * 3, '#ff3355', 0.5);
    }
  }
  ctx.globalCompositeOperation = 'source-over';

  // shadows
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  for (const [e, k] of list) {
    const fl = k === 'summon' && e.c.flying;
    const off = fl ? e.r + 16 : e.r * 0.85 + (k === 'player' ? 8 : 0);
    ell(ctx, e.x, e.y + off, e.r * (fl ? 0.7 : 1), e.r * 0.32); ctx.fill();
  }

  // shapes (sorted by y; flyers on top)
  list.sort((a, b) => {
    const fa = a[1] === 'summon' && a[0].c.flying ? 10000 : 0, fb = b[1] === 'summon' && b[0].c.flying ? 10000 : 0;
    return (a[0].y + fa) - (b[0].y + fb);
  });
  for (const [e, k] of list) {
    if (k === 'player' && p.inv > 0 && p.dashT <= 0 && Math.floor(t * 30) % 2) continue;
    if (k === 'enemy' && (e.champion || e.treasure)) {
      ctx.strokeStyle = rgba(e.treasure ? '#ffd34a' : '#ff3355', 0.8); ctx.lineWidth = 3;
      circ(ctx, e.x, e.y, e.r + 9 + Math.sin(t * 8) * 2); ctx.stroke();
    }
    if (k === 'enemy' && e.elite) {
      ctx.strokeStyle = rgba('#ffd34a', 0.6); ctx.lineWidth = 2;
      circ(ctx, e.x, e.y, e.r + 4 + Math.sin(t * 6) * 1.5); ctx.stroke();
    }
    if (k === 'enemy' && e.isBoss && e.bd.awakened) {
      ctx.save(); ctx.translate(e.x, e.y + e.r * 0.6); ctx.scale(1, 0.45);
      drawMagicCircle(ctx, 0, 0, e.r * 1.7, t * 0.8, '#ff3355', 0.55, false);
      ctx.restore();
    }
    if (k === 'summon' && e.down) {
      ctx.globalAlpha = 0.35; drawEntity(ctx, e, k, t); ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffb3c0'; ctx.font = '800 11px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`KO ${Math.ceil(e.downT)}s`, e.x, e.y - e.r - 12);
      continue;
    }
    if (k === 'enemy' && e.fade) ctx.globalAlpha = 1 - e.fade * 0.85;
    drawEntity(ctx, e, k, t);
    ctx.globalAlpha = 1;
    if (k === 'summon' && e.awk) {
      ctx.strokeStyle = rgba('#ffd66b', 0.75); ctx.lineWidth = 1.6;
      ell(ctx, e.x, e.y - e.r - 10, e.r * 0.55 + 3, 2.4); ctx.stroke();
    }
    if (k === 'summon' && e.c.comp) {
      ctx.fillStyle = e.col; ctx.font = '700 10px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(e.c.name, e.x, e.y - e.r - 20);
    }
    if (k === 'enemy' && e.shield > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba('#9fe8ff', 0.35 + 0.4 * (e.shield / e.shieldMax)); ctx.lineWidth = 2.5;
      circ(ctx, e.x, e.y, e.r + 7); ctx.stroke();
      ctx.fillStyle = rgba('#9fe8ff', 0.08); circ(ctx, e.x, e.y, e.r + 7); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    if (k === 'summon' && e.shield > 0) {
      ctx.strokeStyle = rgba('#7fd0ff', 0.6); ctx.lineWidth = 2; circ(ctx, e.x, e.y, e.r + 6); ctx.stroke();
    }
    if (k === 'summon' && e.fortT > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba('#ffcf5a', 0.5 + Math.sin(t * 8) * 0.2); ctx.lineWidth = 3;
      circ(ctx, e.x, e.y - 6, e.r + 18); ctx.stroke();
      glowAt(ctx, e.x, e.y, 150, '#ffcf5a', 0.12);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (k === 'enemy' && e.stunT > 0) {
      ctx.fillStyle = 'rgba(160,230,255,0.28)'; circ(ctx, e.x, e.y, e.r + 3); ctx.fill();
      ctx.fillStyle = '#e8fbff';
      for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; circ(ctx, e.x + Math.cos(a) * e.r * 0.9, e.y - e.r - 6 + Math.sin(a) * 3, 2); ctx.fill(); }
    }
    if (k === 'enemy' && e.markT > 0) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(t * 2);
      ctx.strokeStyle = rgba('#ff3355', 0.85); ctx.lineWidth = 2;
      const R = e.r + 10;
      circ(ctx, 0, 0, R); ctx.stroke();
      for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(R - 6, 0); ctx.lineTo(R + 6, 0); ctx.stroke(); }
      ctx.restore();
    }
  }
  if (!p.dead && p.shield > 0) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba('#7fd0ff', 0.55 + Math.sin(t * 6) * 0.15); ctx.lineWidth = 2.5;
    circ(ctx, p.x, p.y, 24); ctx.stroke();
    glowAt(ctx, p.x, p.y, 30, '#5ab8ff', 0.25);
    ctx.globalCompositeOperation = 'source-over';
  }

  // health bars
  for (const [e, k] of list) {
    if (k === 'player') continue;
    if (k === 'enemy' && (e.isBoss || e.hp >= e.maxHp)) continue;
    if (k === 'summon' && e.hp >= e.maxHp && !e.maxLife) continue;
    const w = Math.max(18, e.r * 2), y = e.y - e.r - (k === 'summon' && e.id === 'stone_golem' ? 34 : 14);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 5);
    ctx.fillStyle = k === 'enemy' ? (e.elite ? '#ffd34a' : '#ff4d6d') : '#5dff9a';
    ctx.fillRect(e.x - w / 2, y, w * clamp(e.hp / e.maxHp, 0, 1), 3);
    if (k === 'summon' && e.maxLife) { ctx.fillStyle = '#9fd6ff'; ctx.fillRect(e.x - w / 2, y + 3.5, w * clamp(e.life / e.maxLife, 0, 1), 1.5); }
  }

  // projectiles
  ctx.globalCompositeOperation = 'lighter';
  for (const q of W.projs) {
    if (!inView(q.x, q.y, 30)) continue;
    glowAt(ctx, q.x, q.y, q.r * (q.team === 'enemy' ? 3.2 : 3.6), q.color, q.team === 'enemy' ? 0.85 : 0.75);
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const q of W.projs) {
    if (!inView(q.x, q.y, 30)) continue;
    if (q.kind === 'stone') { ctx.fillStyle = '#d8d4e6'; circ(ctx, q.x, q.y, q.r); ctx.fill(); }
    else if (q.kind === 'ice' || q.kind === 'arrow' || q.kind === 'lance' || q.kind === 'arrow2') {
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(Math.atan2(q.vy, q.vx));
      if (q.kind === 'lance') ctx.scale(1.8, 0.8);
      ctx.fillStyle = q.kind === 'ice' ? '#eaffff' : q.kind === 'lance' ? '#fff6d6' : q.kind === 'arrow2' ? '#e8ffd8' : '#fff1c4';
      ctx.beginPath(); ctx.moveTo(q.r * 2.2, 0); ctx.lineTo(0, -q.r * 0.6); ctx.lineTo(-q.r * 1.8, 0); ctx.lineTo(0, q.r * 0.6); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = '#ffffff'; circ(ctx, q.x, q.y, q.r * 0.55); ctx.fill();
      if (q.team === 'enemy') { ctx.strokeStyle = q.color; ctx.lineWidth = 1.5; circ(ctx, q.x, q.y, q.r); ctx.stroke(); }
    }
  }

  // beams (holy beams, heal links, boss lasers) + lightning
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const beam = (x1, y1, x2, y2, w, color, a) => {
    ctx.strokeStyle = rgba(color, 0.35 * a); ctx.lineWidth = w * 1.8; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = rgba(color, 0.8 * a); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = rgba('#ffffff', 0.9 * a); ctx.lineWidth = w * 0.35; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  };
  for (const b of W.beams) beam(b.x1, b.y1, b.x2, b.y2, b.w, b.color, 1 - b.t / b.dur);
  for (const e of W.enemies) if (e.isBoss && e.beam && !e.dead) beam(e.x, e.y, e.beam.x2, e.beam.y2, e.beam.w * (0.85 + Math.sin(t * 40) * 0.15), e.bd.pcolor, 1);
  for (const b of W.bolts) {
    const a = 1 - b.t / b.dur;
    for (const [w, al] of [[6, 0.3], [2.2, 1]]) {
      ctx.strokeStyle = rgba(w > 3 ? b.color : '#ffffff', al * a); ctx.lineWidth = w;
      ctx.beginPath(); b.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineCap = 'butt';

  drawDissolves(ctx, t, dt);
  if (GFX_ON.lights()) {
    renderLighting(ctx, cx, cy, z, t);
    ctx.setTransform(DPR * z, 0, 0, DPR * z, DPR * (VW / 2 - cx * z), DPR * (VH / 2 - cy * z));
  }
  drawParticles(ctx);
  drawTexts(ctx);

  // ----- screen space overlays -----
  if (GFX_ON.bloom()) renderBloom(ctx);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawAmbient(ctx, th.ambient, t, dt, cx, cy);
  if (GFX_ON.weather()) drawWeather(ctx, t, dt, cx, cy);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (_vignette) ctx.drawImage(_vignette, 0, 0, VW, VH);
  if (W.odT > 0) { ctx.fillStyle = `rgba(255,214,107,${0.06 + Math.sin(t * 10) * 0.03})`; ctx.fillRect(0, 0, VW, VH); }
  if (p.enhT > 0) { ctx.fillStyle = `rgba(255,211,74,${0.04 + Math.sin(t * 8) * 0.02})`; ctx.fillRect(0, 0, VW, VH); }
  if (W.flashT > 0) { ctx.fillStyle = `rgba(255,250,235,${Math.min(0.45, W.flashT * 1.6)})`; ctx.fillRect(0, 0, VW, VH); }
  if (W.hurtFlash > 0) {
    const g = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * 0.25, VW / 2, VH / 2, Math.hypot(VW, VH) * 0.55);
    g.addColorStop(0, 'rgba(255,0,40,0)'); g.addColorStop(1, `rgba(255,0,40,${W.hurtFlash * 0.9})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  }
  if (p.hp / p.maxHp < 0.3 && !p.dead) {
    ctx.strokeStyle = `rgba(255,30,60,${0.25 + Math.sin(t * 6) * 0.15})`; ctx.lineWidth = 18;
    ctx.strokeRect(0, 0, VW, VH);
  }
  // off-screen boss arrow
  const b = W.boss;
  if (b && !b.dead && !inView(b.x, b.y, -40)) {
    const a = Math.atan2(b.y - cy, b.x - cx);
    const R = Math.min(VW, VH) / 2 - 50;
    const ax = VW / 2 + Math.cos(a) * R, ay = VH / 2 + Math.sin(a) * R;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
    ctx.fillStyle = `rgba(255,60,90,${0.7 + Math.sin(t * 8) * 0.3})`;
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-8, -12); ctx.lineTo(-3, 0); ctx.lineTo(-8, 12); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// ---------- menu background ----------
const MENU_MOTES = [];
function renderMenuBG(t, dt) {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#0a0718'); g.addColorStop(1, '#030209');
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  const r = Math.min(VW, VH) * 0.42;
  ctx.save(); ctx.translate(VW / 2, VH * 0.52); ctx.scale(1, 0.55);
  drawMagicCircle(ctx, 0, 0, r, t * 0.08, '#7a4cff', 0.55);
  drawMagicCircle(ctx, 0, 0, r * 0.62, -t * 0.12, '#ffcf5a', 0.35);
  ctx.restore();
  if (MENU_MOTES.length < 90) MENU_MOTES.push({ x: rand(VW), y: VH + 10, vy: rand(15, 50), s: rand(1, 3), c: Math.random() < 0.7 ? '#a77bff' : '#ffd66b', ph: rand(TAU) });
  ctx.globalCompositeOperation = 'lighter';
  for (let i = MENU_MOTES.length - 1; i >= 0; i--) {
    const m = MENU_MOTES[i];
    m.y -= m.vy * dt; m.x += Math.sin(t + m.ph) * 10 * dt;
    if (m.y < -10) { MENU_MOTES.splice(i, 1); continue; }
    glowAt(ctx, m.x, m.y, m.s * 5, m.c, 0.6);
  }
  ctx.globalCompositeOperation = 'source-over';
  if (_vignette) ctx.drawImage(_vignette, 0, 0, VW, VH);
}

// ---------- bestiary portraits ----------
function renderEnemyIcon(cv, key, unknown) {
  const c = cv.getContext('2d'), w = cv.width, h = cv.height;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, w, h);
  const boss = BOSSES[key], d = ENEMIES[key];
  const col = boss ? boss.color : d.color;
  const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w * 0.7);
  g.addColorStop(0, rgba(col, unknown ? 0.06 : 0.3)); g.addColorStop(1, 'rgba(8,6,20,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.save(); c.translate(w / 2, h / 2 + 4);
  const size = boss ? (boss.draw === 'warchief' || boss.draw === 'general' ? 20 : 58) : Math.max(d.r * 1.3, 14);
  c.scale((w * 0.36) / size, (w * 0.36) / size);
  if (unknown) { c.globalAlpha = 0.18; FLASH = true; }
  const fake = { col, r: boss ? boss.r : d.r, baseR: d ? d.r : 13, face: 1, vx: 0, vy: 0, seed: 1, state: '', lunge: 0, iconMode: true, d: d || { ai: 'boss' }, bd: boss };
  DR[boss ? boss.draw : d.draw](c, fake, 0.4);
  FLASH = false;
  c.restore();
  if (unknown) {
    c.fillStyle = 'rgba(200,190,255,0.75)'; c.font = `800 ${Math.round(w * 0.3)}px Inter, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', w / 2, h / 2);
  }
}

// ---------- minimap ----------
function drawMinimap(cv) {
  const c = cv.getContext('2d'), S = cv.width, k = S / (BOUND * 2);
  const X = x => (x + BOUND) * k, Y = y => (y + BOUND) * k;
  c.clearRect(0, 0, S, S);
  c.fillStyle = 'rgba(8,5,20,0.72)'; c.fillRect(0, 0, S, S);
  c.strokeStyle = rgba(W.st.theme.accent, 0.5); c.lineWidth = 2; c.strokeRect(1, 1, S - 2, S - 2);
  // camera view
  const vw = VW / ZOOM, vh = VH / ZOOM;
  c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 1;
  c.strokeRect(X(W.camX - vw / 2), Y(W.camY - vh / 2), vw * k, vh * k);
  for (const z of W.zones) { c.fillStyle = z.type === 'fire' ? 'rgba(255,106,26,0.35)' : z.type === 'poison' ? 'rgba(155,60,255,0.35)' : 'rgba(159,246,255,0.35)'; c.beginPath(); c.arc(X(z.x), Y(z.y), Math.max(2, z.r * k), 0, TAU); c.fill(); }
  for (const p of W.pickups) if (p.type === 'stone') { c.fillStyle = '#e2c6ff'; c.fillRect(X(p.x) - 1, Y(p.y) - 1, 2, 2); }
  for (const e of W.enemies) {
    if (e.dead || e.isBoss) continue;
    c.fillStyle = e.elite ? '#ffd34a' : '#ff4d6d';
    const s = e.elite ? 3 : 2;
    c.fillRect(X(e.x) - s / 2, Y(e.y) - s / 2, s, s);
  }
  for (const s of W.summons) { c.fillStyle = s.col; c.beginPath(); c.arc(X(s.x), Y(s.y), s.c.stationary ? 2.6 : 1.8, 0, TAU); c.fill(); }
  const ev = W.ev;
  if (ev) {
    const q = ev.e || ev, pulse = 3 + Math.sin(W.t * 8) * 1.2;
    if (ev.type === 'shrine') { c.fillStyle = SHRINES[ev.kind].color; c.save(); c.translate(X(q.x), Y(q.y)); c.rotate(Math.PI / 4); c.fillRect(-3, -3, 6, 6); c.restore(); }
    else if (ev.type !== 'storm' && !q.dead) { c.strokeStyle = ev.type === 'goblin' ? '#ffd34a' : '#ff3355'; c.lineWidth = 2; c.beginPath(); c.arc(X(q.x), Y(q.y), pulse + 1, 0, TAU); c.stroke(); }
  }
  const b = W.boss;
  if (b && !b.dead) {
    c.fillStyle = '#ff3355'; c.beginPath(); c.arc(X(b.x), Y(b.y), 4 + Math.sin(W.t * 8), 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke();
  }
  const p = W.player;
  c.save(); c.translate(X(p.x), Y(p.y)); c.rotate(Math.atan2(p.aimY, p.aimX));
  c.fillStyle = '#ffffff';
  c.beginPath(); c.moveTo(5, 0); c.lineTo(-3, -3.5); c.lineTo(-1.5, 0); c.lineTo(-3, 3.5); c.closePath(); c.fill();
  c.restore();
}
