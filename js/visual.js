'use strict';
// ---------- v8: epic creature rendering. Every summon is drawn with extra detail by rank:
//   tier 1+: rotating summoning sigil under it · tier 2+: shading + coloured rim light, aura, afterimage trail
//   tier 3+: orbiting motes, double sigil · tier 4: crown sparks. Melee strikes leave a slash arc.
//   Auto graphics quality scales it: Low = off, Medium = no shading pass, High = everything. ----------

const RANK_TIER = { insect: 0, beast: 0, bird: 1, grass: 1, stone: 1, fish: 2, spirit: 2, dragon: 3, celestial: 3, primordial: 4, fusion: 3 };
function creatureTier(s) {
  let t = RANK_TIER[s.c.rank] ?? 1;
  if (s.c.legend) t = Math.max(t, 3);
  if (s.awk) t += 1;
  return Math.min(4, t);
}
const rankCol = s => (RANK_BY_ID[s.c.rank] && RANK_BY_ID[s.c.rank].color) || s.col || '#c78bff';
const VIS = { oc: null, ox: null, on: true };

function drawSigil(c, e, t, tier, col) {
  c.save();
  c.translate(e.x, e.y + e.r * (e.c.flying ? 1.6 : 0.85));
  c.scale(1, 0.38);
  c.globalCompositeOperation = 'lighter';
  const R = e.r * 1.45 + 6;
  c.rotate(t * 0.7);
  c.strokeStyle = rgba(col, 0.42); c.lineWidth = 2; c.setLineDash([R * 0.5, R * 0.18]);
  circ(c, 0, 0, R); c.stroke(); c.setLineDash([]);
  if (tier >= 3) {
    c.rotate(-t * 1.6);
    c.strokeStyle = rgba(col, 0.3); c.lineWidth = 1.4; circ(c, 0, 0, R * 0.72); c.stroke();
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; c.fillStyle = rgba(col, 0.6); c.fillRect(Math.cos(a) * R * 0.86 - 1.5, Math.sin(a) * R * 0.86 - 1.5, 3, 3); }
  }
  c.restore();
}
function drawShaded(c, e, kind, t, col, tier, inner) {
  const k = Math.min(3, Math.abs(c.getTransform().a) || 1);
  const S = Math.min(512, Math.ceil(e.r * 7 * k));
  if (!VIS.oc) { VIS.oc = document.createElement('canvas'); VIS.ox = VIS.oc.getContext('2d'); }
  const oc = VIS.oc, ox = VIS.ox;
  if (oc.width < S || oc.height < S) { oc.width = oc.height = Math.max(S, oc.width); }
  ox.setTransform(1, 0, 0, 1, 0, 0); ox.globalCompositeOperation = 'source-over'; ox.filter = 'none'; ox.globalAlpha = 1;
  ox.clearRect(0, 0, S, S);
  ox.setTransform(k, 0, 0, k, S / 2, S / 2);
  const x = e.x, y = e.y, tr = e.trail;
  e.x = 0; e.y = 0;
  if (tr) e.trail = tr.map(p => ({ x: p.x - x, y: p.y - y }));
  try { inner(ox, e, kind, t); } finally { e.x = x; e.y = y; if (tr) e.trail = tr; }
  // light from the top-left, shadow to the bottom-right, coloured rim light at the edge
  ox.setTransform(1, 0, 0, 1, 0, 0);
  ox.globalCompositeOperation = 'source-atop';
  const g = ox.createLinearGradient(S * 0.2, S * 0.15, S * 0.8, S * 0.85);
  g.addColorStop(0, 'rgba(255,255,255,0.30)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,10,0.42)');
  ox.fillStyle = g; ox.fillRect(0, 0, S, S);
  const rim = ox.createRadialGradient(S / 2, S / 2, S * 0.08, S / 2, S / 2, S * 0.34);
  rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(0.7, 'rgba(0,0,0,0)'); rim.addColorStop(1, rgba(col, 0.45));
  ox.fillStyle = rim; ox.fillRect(0, 0, S, S);
  ox.globalCompositeOperation = 'source-over';
  c.save();
  c.shadowColor = col; c.shadowBlur = 6 + 3 * tier;
  c.drawImage(oc, 0, 0, S, S, e.x - S / (2 * k), e.y - S / (2 * k), S / k, S / k);
  c.restore();
}
function drawMotes(c, e, t, tier, col) {
  const n = 2 + tier;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < n; k++) {
    const a = t * (1.6 + k * 0.1) + (k / n) * TAU + (e.seed || 0), R = e.r * 1.35 + 6;
    const x = e.x + Math.cos(a) * R, y = e.y - e.r * 0.3 + Math.sin(a) * R * 0.45;
    const g = c.createRadialGradient(x, y, 0, x, y, 5);
    g.addColorStop(0, rgba('#ffffff', 0.9)); g.addColorStop(0.4, rgba(col, 0.7)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.fillRect(x - 5, y - 5, 10, 10);
  }
  c.restore();
}
function drawTrail(c, e, col) {
  const tr = e.vtrail || (e.vtrail = []);
  const last = tr[0];
  if (!last || Math.hypot(last.x - e.x, last.y - e.y) > 6) { tr.unshift({ x: e.x, y: e.y }); if (tr.length > 7) tr.pop(); }
  if (tr.length < 3) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 1; k < tr.length; k++) {
    const p = tr[k], a = 0.16 * (1 - k / tr.length);
    c.fillStyle = rgba(col, a); circ(c, p.x, p.y, e.r * (1 - k / (tr.length + 2))); c.fill();
  }
  c.restore();
}
function drawSlash(c, e, col) {
  if (!(e.lunge > 0.02) || !/melee|charger/.test(e.c.ai)) return;
  const f = e.face || 1, a = e.lunge / 0.12;
  c.save(); c.translate(e.x + f * e.r * 0.7, e.y - e.r * 0.2); c.scale(f, 1);
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = rgba(col, 0.75 * a); c.lineWidth = 3 + 2 * a; c.lineCap = 'round';
  c.beginPath(); c.arc(0, 0, e.r * 1.15, -1.1 + (1 - a) * 0.8, 0.9 - (1 - a) * 0.4); c.stroke();
  c.strokeStyle = rgba('#ffffff', 0.6 * a); c.lineWidth = 1.2; c.stroke();
  c.restore();
}
const _vis_drawEntity = drawEntity;
drawEntity = function (c, e, kind, t) {
  if (kind !== 'summon' || !VIS.on || !e.c || e.down || c !== ctx) { _vis_drawEntity(c, e, kind, t); return; }
  const q = gfxLevel();
  if (q === 'low') { _vis_drawEntity(c, e, kind, t); return; }
  const tier = creatureTier(e), col = rankCol(e);
  if (tier >= 1) drawSigil(c, e, t, tier, col);
  if (tier >= 2) { glowAt(c, e.x, e.y, e.r * (2.4 + 0.4 * tier), col, 0.1 + 0.03 * tier); if (e.c.flying || (e.c.speed || 0) > 240) drawTrail(c, e, col); }
  if (q === 'high' && tier >= 2) drawShaded(c, e, kind, t, col, tier, _vis_drawEntity);
  else _vis_drawEntity(c, e, kind, t);
  if (tier >= 3) drawMotes(c, e, t, tier, col);
  if (tier >= 4 && Math.random() < 0.08) spawnP({ x: e.x + rand(-e.r, e.r), y: e.y - e.r, vy: rand(-90, -40), life: 0.6, size: 3, color: col, kind: 'spark', drag: 1 });
  drawSlash(c, e, col);
};
// card icons: a rank-coloured rim, plus sparkles for legends and the top ranks
const _vis_renderCardIcon = renderCardIcon;
renderCardIcon = function (cv, id, locked) {
  _vis_renderCardIcon(cv, id, locked);
  if (locked || !CARDS[id]) return;
  const c = cv.getContext('2d'), w = cv.width, card = CARDS[id], col = (RANK_BY_ID[card.rank] || {}).color || card.color;
  const tier = Math.min(4, Math.max(RANK_TIER[card.rank] ?? 1, card.legend ? 3 : 0));
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.strokeStyle = rgba(col, 0.25 + 0.1 * tier); c.lineWidth = Math.max(1, w / 48);
  c.beginPath(); c.arc(w / 2, w / 2, w * 0.46, 0, TAU); c.stroke();
  if (tier >= 3) {
    c.fillStyle = rgba('#ffffff', 0.85);
    for (let k = 0; k < 4; k++) { const a = k * 1.7 + 0.4, x = w / 2 + Math.cos(a) * w * 0.4, y = w / 2 + Math.sin(a) * w * 0.4, s = w / 40; c.fillRect(x - s, y - s / 4, s * 2, s / 2); c.fillRect(x - s / 4, y - s, s / 2, s * 2); }
  }
  c.restore();
};
