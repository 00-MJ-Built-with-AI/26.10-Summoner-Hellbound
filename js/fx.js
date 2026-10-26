'use strict';
// ---------- Math helpers, glow sprites, particles, floating text, magic circles ----------

const TAU = Math.PI * 2;
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist2 = (a, b) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; };
const dist = (a, b) => Math.sqrt(dist2(a, b));
const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
const lerpAng = (a, b, t) => a + angDiff(a, b) * Math.min(1, t);
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function weightedPick(obj) {
  let total = 0; for (const k in obj) total += obj[k];
  let r = Math.random() * total;
  for (const k in obj) { r -= obj[k]; if (r <= 0) return k; }
  return Object.keys(obj)[0];
}

const _rgbaCache = new Map();
function rgba(hex, a) {
  const key = hex + a;
  let v = _rgbaCache.get(key);
  if (!v) {
    const n = parseInt(hex.slice(1), 16);
    v = `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    if (_rgbaCache.size < 4000) _rgbaCache.set(key, v);
  }
  return v;
}

// ---- glow sprites (pre-rendered radial gradients, drawn additively) ----
const _glowCache = new Map();
function glowSprite(color) {
  let g = _glowCache.get(color);
  if (g) return g;
  g = document.createElement('canvas');
  g.width = g.height = 64;
  const c = g.getContext('2d');
  const grd = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, rgba(color, 1));
  grd.addColorStop(0.25, rgba(color, 0.55));
  grd.addColorStop(0.6, rgba(color, 0.15));
  grd.addColorStop(1, rgba(color, 0));
  c.fillStyle = grd; c.fillRect(0, 0, 64, 64);
  _glowCache.set(color, g);
  return g;
}
// draws a glow; caller must already be in 'lighter' mode for best effect
function glowAt(c, x, y, r, color, a = 1) {
  if (a <= 0.01) return;
  c.globalAlpha = Math.min(1, a);
  c.drawImage(glowSprite(color), x - r, y - r, r * 2, r * 2);
  c.globalAlpha = 1;
}

// ---- particles ----
// kinds: glow (soft dot), spark (streak), ring (expanding outline), smoke (dark puff)
const P = [];
const MAX_P = 1800;
function spawnP(o) {
  if (P.length >= MAX_P) return;
  o.life = o.max = o.life || 0.6;
  o.vx = o.vx || 0; o.vy = o.vy || 0;
  o.size = o.size || 4; o.drag = o.drag ?? 2; o.grav = o.grav || 0;
  o.kind = o.kind || 'glow';
  P.push(o);
}
function burst(x, y, color, n, speed = 160, life = 0.6, size = 5, kind = 'glow', extra) {
  for (let i = 0; i < n; i++) {
    const a = rand(TAU), s = rand(speed * 0.25, speed);
    spawnP(Object.assign({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(life * 0.5, life), size: rand(size * 0.5, size), color, kind }, extra));
  }
}
function ring(x, y, color, r0, r1, life = 0.5, width = 3) {
  spawnP({ x, y, color, kind: 'ring', r0, r1, life, size: width, drag: 0 });
}
function updateParticles(dt) {
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    p.life -= dt;
    if (p.life <= 0) { P[i] = P[P.length - 1]; P.pop(); continue; }
    const d = Math.max(0, 1 - p.drag * dt);
    p.vx *= d; p.vy = p.vy * d + p.grav * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
  }
}
function drawParticles(c) {
  c.globalCompositeOperation = 'lighter';
  for (const p of P) {
    const k = p.life / p.max;
    if (p.kind === 'glow') {
      glowAt(c, p.x, p.y, p.size * (0.6 + k * 0.8) * 2.2, p.color, k);
    } else if (p.kind === 'spark') {
      c.strokeStyle = rgba(p.color, k);
      c.lineWidth = p.size * 0.5;
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); c.stroke();
    } else if (p.kind === 'ring') {
      const r = lerp(p.r1, p.r0, k);
      c.strokeStyle = rgba(p.color, k * 0.9);
      c.lineWidth = p.size * k + 0.5;
      c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.stroke();
    }
  }
  c.globalCompositeOperation = 'source-over';
  for (const p of P) {
    if (p.kind !== 'smoke') continue;
    const k = p.life / p.max;
    c.fillStyle = rgba(p.color, k * 0.35);
    c.beginPath(); c.arc(p.x, p.y, p.size * (1.6 - k * 0.6), 0, TAU); c.fill();
  }
}

// ---- floating combat text ----
const TXT = [];
function txt(x, y, text, color = '#ffffff', size = 13, life = 0.8) {
  if (TXT.length > 140) TXT.shift();
  TXT.push({ x: x + rand(-6, 6), y, text, color, size, life, max: life, vy: -55 });
}
function updateTexts(dt) {
  for (let i = TXT.length - 1; i >= 0; i--) {
    const t = TXT[i];
    t.life -= dt; t.y += t.vy * dt; t.vy *= 1 - 2.5 * dt;
    if (t.life <= 0) TXT.splice(i, 1);
  }
}
function drawTexts(c) {
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const t of TXT) {
    const k = t.life / t.max;
    const pop = k > 0.85 ? 1 + (k - 0.85) * 3 : 1;
    c.globalAlpha = Math.min(1, k * 2);
    c.font = `800 ${Math.round(t.size * pop)}px Inter, sans-serif`;
    c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,0.75)';
    c.strokeText(t.text, t.x, t.y);
    c.fillStyle = t.color; c.fillText(t.text, t.x, t.y);
  }
  c.globalAlpha = 1;
}

// ---- magic circles ----
const GLYPHS = [
  [[-1, -1, 1, -1], [0, -1, 0, 1]],
  [[-1, 1, 0, -1], [0, -1, 1, 1], [-0.6, 0.2, 0.6, 0.2]],
  [[-1, -1, -1, 1], [-1, 0, 1, -1], [-1, 0, 1, 1]],
  [[-1, 0, 1, 0], [0, -1, 0, 1], [-0.7, -0.7, 0.7, 0.7]],
  [[-1, -1, 1, 1], [1, -1, -1, 1], [0, -1, 0, 0]],
  [[-1, 1, -1, -1], [-1, -1, 1, -1], [1, -1, 1, 0]],
];
function drawMagicCircle(c, x, y, r, rot, color, alpha = 1, detail = true) {
  if (alpha <= 0.01) return;
  c.save();
  c.translate(x, y);
  c.globalCompositeOperation = 'lighter';
  glowAt(c, 0, 0, r * 1.5, color, 0.35 * alpha);
  c.globalAlpha = alpha;
  c.strokeStyle = color;
  c.lineWidth = Math.max(1, r * 0.035);
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
  c.lineWidth = Math.max(0.8, r * 0.018);
  c.beginPath(); c.arc(0, 0, r * 0.82, 0, TAU); c.stroke();
  c.rotate(rot);
  if (detail) {
    const n = 12, gs = r * 0.06;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      c.save(); c.rotate(a); c.translate(r * 0.91, 0); c.rotate(Math.PI / 2);
      for (const s of GLYPHS[i % GLYPHS.length]) {
        c.beginPath(); c.moveTo(s[0] * gs, s[1] * gs); c.lineTo(s[2] * gs, s[3] * gs); c.stroke();
      }
      c.restore();
    }
  }
  // hexagram
  c.lineWidth = Math.max(1, r * 0.025);
  for (let k = 0; k < 2; k++) {
    c.beginPath();
    for (let i = 0; i <= 3; i++) {
      const a = (i / 3) * TAU + k * Math.PI / 3 - Math.PI / 2;
      const px = Math.cos(a) * r * 0.8, py = Math.sin(a) * r * 0.8;
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.stroke();
  }
  c.rotate(-rot * 2.5);
  c.beginPath(); c.arc(0, 0, r * 0.4, 0, TAU); c.stroke();
  c.setLineDash([r * 0.06, r * 0.05]);
  c.beginPath(); c.arc(0, 0, r * 0.32, 0, TAU); c.stroke();
  c.setLineDash([]);
  c.restore();
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}
