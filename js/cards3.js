'use strict';
// ---------- v5: 50 new creature cards + 30 new fusions, drawn with parametric templates ----------

// ================= drawing templates =================
// Each new card names a template and its parameters; e.colAlt tints fusions with their second parent's color.
const TPL = {};
const acc = (e, p) => e.colAlt || p.acc || '#ffffff';

TPL.insect = (c, e, t, p) => {
  c.save(); c.scale((e.face || 1) * (p.s || 1), p.s || 1);
  if (e.lunge > 0) c.translate(e.lunge * 25, 0);
  const mv = moving(e), w = mv ? Math.sin(t * 28 + (e.seed || 0)) * 2.5 : 0, col = e.col;
  if (p.kind === 'moth' || p.kind === 'firefly' || p.kind === 'wasp') {
    const f = Math.sin(t * (p.kind === 'moth' ? 14 : 30) + (e.seed || 0));
    c.fillStyle = F(rgba(p.wing || acc(e, p), p.kind === 'moth' ? 0.85 : 0.55));
    for (const s of [-1, 1]) { ell(c, -2, s * (5 + f * 2), p.kind === 'moth' ? 9 : 7, p.kind === 'moth' ? 6 : 3, s * (0.5 + f * 0.3)); c.fill(); }
  } else {
    c.strokeStyle = F(shade(col, 0.45)); c.lineWidth = 1.5;
    const n = p.kind === 'scorpion' ? 4 : 3;
    for (let i = 0; i < n; i++) { const x = -4 + i * 4, o = i % 2 ? w : -w; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + o, -9); c.moveTo(x, 0); c.lineTo(x - o, 9); c.stroke(); }
  }
  c.fillStyle = F(col);
  if (p.kind === 'ant') { circ(c, -6, 0, 4); c.fill(); circ(c, 0, 0, 3); c.fill(); circ(c, 6, 0, 3.6); c.fill(); }
  else if (p.kind === 'scorpion') {
    ell(c, 0, 0, 9, 6); c.fill();
    c.strokeStyle = F(col); c.lineWidth = 3;
    c.beginPath(); c.moveTo(-8, 0); c.quadraticCurveTo(-18, -4, -14, -14 + Math.sin(t * 4) * 2); c.stroke();
    c.fillStyle = F(acc(e, p)); tri(c, -15, -16, -11, -13, -14, -10); c.fill();
    c.fillStyle = F(col); circ(c, 11, -5, 3); c.fill(); circ(c, 11, 5, 3); c.fill();
  } else if (p.kind === 'firefly') {
    ell(c, 0, 0, 5, 3.5); c.fill();
    c.fillStyle = F(acc(e, p)); circ(c, -5, 0, 3.5 + Math.sin(t * 6) * 0.8); c.fill();
  } else if (p.kind === 'wasp') {
    ell(c, -3, 0, 8, 5); c.fill();
    c.fillStyle = F('#2a1a06'); for (const x of [-7, -3, 1]) c.fillRect(x, -5, 2, 10);
    c.fillStyle = F(col); circ(c, 7, 0, 4); c.fill();
    if (p.crown) { c.fillStyle = F('#ffd34a'); tri(c, 5, -4, 7, -9, 9, -4); c.fill(); }
  } else {
    ell(c, 0, 0, p.kind === 'moth' ? 6 : 10, p.kind === 'moth' ? 4 : 7); c.fill();
    if (p.kind === 'stag') { c.strokeStyle = F(acc(e, p)); c.lineWidth = 2.2; c.beginPath(); c.moveTo(9, -3); c.quadraticCurveTo(17, -9, 18, -2); c.moveTo(9, 3); c.quadraticCurveTo(17, 9, 18, 2); c.stroke(); }
    else { c.strokeStyle = F(shade(col, 1.4)); c.lineWidth = 1; c.beginPath(); c.moveTo(-6, 0); c.lineTo(6, 0); c.stroke(); }
  }
  c.fillStyle = '#ffffff'; circ(c, p.kind === 'ant' ? 8 : 8.5, -1.5, 1); c.fill(); circ(c, p.kind === 'ant' ? 8 : 8.5, 1.5, 1); c.fill();
  c.restore();
};

TPL.beast = (c, e, t, p) => {
  const s = p.s || 1;
  c.save(); c.scale(s, s);
  quad(c, e, t, e.col, p.dark || shade(e.col, 0.55), p.eye || '#fff6c0');
  c.restore();
  c.save(); c.scale((e.face || 1) * s, s);
  if (e.lunge > 0) c.translate(e.lunge * 30, 0);
  const a = acc(e, p);
  if (p.mane) { c.fillStyle = F(a); for (let i = 0; i < 7; i++) { const an = -1.6 + i * 0.45; circ(c, 11 + Math.cos(an) * 7, -5 + Math.sin(an) * 7, 3.2); c.fill(); } c.fillStyle = F(e.col); ell(c, 12, -5, 5.5, 4.5); c.fill(); }
  if (p.horns) { c.strokeStyle = F(a); c.lineWidth = 2.6; c.beginPath(); c.arc(11, -9, 5, Math.PI * 0.9, Math.PI * 2.1); c.stroke(); }
  if (p.spots) { c.fillStyle = F(shade(e.col, 0.6)); for (const [x, y] of [[-6, -2], [0, 2], [4, -3], [-2, -4]]) { circ(c, x, y, 1.6); c.fill(); } }
  if (p.bulk) { c.fillStyle = F(shade(e.col, 0.8)); ell(c, -2, -4, 12, 6); c.fill(); }
  if (p.stripes) { c.strokeStyle = F(a); c.lineWidth = 1.6; for (const x of [-6, -1, 4]) { c.beginPath(); c.moveTo(x, -6); c.lineTo(x + 2, 2); c.stroke(); } }
  if (p.frost) { c.fillStyle = F('#eaffff'); tri(c, -6, -7, -3, -13, 0, -7); c.fill(); tri(c, 0, -7, 3, -12, 6, -6); c.fill(); }
  c.restore();
};

TPL.bird = (c, e, t, p) => {
  const s = p.s || 1;
  c.save(); c.rotate(e.ang || 0); c.scale(s, s);
  const flap = e.state === 'dive' ? 0.25 : Math.sin(t * (p.slow ? 6 : 12) + (e.seed || 0)) * 0.45 + 0.6;
  const wing = p.wing || shade(e.col, 0.6), span = p.span || 20;
  c.fillStyle = F(wing); c.strokeStyle = F(acc(e, p)); c.lineWidth = 1;
  for (const sg of [-1, 1]) {
    c.beginPath(); c.moveTo(3, 0);
    c.quadraticCurveTo(-1, sg * span * flap, -11, sg * (span * 0.9 * flap + 6));
    c.quadraticCurveTo(-6, sg * 6, -4, 0); c.closePath(); c.fill(); c.stroke();
  }
  c.fillStyle = F(wing); tri(c, -6, 0, -16, -5, -16, 5); c.fill();
  c.fillStyle = F(e.col); ell(c, 0, 0, p.round ? 8 : 9, p.round ? 7 : 4.5); c.fill();
  if (p.neck) { c.strokeStyle = F(e.col); c.lineWidth = 3; c.beginPath(); c.moveTo(6, 0); c.lineTo(13, 0); c.stroke(); }
  const hx = p.neck ? 15 : 8;
  c.fillStyle = F(p.head || shade(e.col, 1.3)); circ(c, hx, 0, p.round ? 5 : 3.8); c.fill();
  c.fillStyle = F(p.beak || '#ffc845'); tri(c, hx + 3, -1.5, hx + 7.5, 0, hx + 3, 1.5); c.fill();
  if (p.round) { c.fillStyle = '#ffef5a'; circ(c, hx + 1, -2, 1.4); c.fill(); circ(c, hx + 1, 2, 1.4); c.fill(); }
  if (p.fire) { c.globalCompositeOperation = 'lighter'; glowAt(c, -14, 0, 12, '#ff7a2e', 0.5); c.globalCompositeOperation = 'source-over'; }
  c.restore();
};

TPL.plant = (c, e, t, p) => {
  const pulse = 1 + Math.sin(t * 2.5 + (e.seed || 0)) * 0.05, s = p.s || 1;
  c.save(); c.scale(pulse * s, pulse * s);
  const a = acc(e, p);
  if (p.kind === 'lotus') {
    for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU + t * 0.2; c.fillStyle = F(i % 2 ? e.col : shade(e.col, 1.2)); ell(c, Math.cos(an) * 7, Math.sin(an) * 5, 8, 3.5, an); c.fill(); }
    c.fillStyle = F(a); circ(c, 0, 0, 4); c.fill();
  } else if (p.kind === 'trap') {
    const open = 0.3 + Math.abs(Math.sin(t * 2)) * 0.5 + (e.lunge > 0 ? 0.6 : 0);
    c.fillStyle = F('#2f7a3a'); rr(c, -3, 0, 6, 16, 2); c.fill();
    for (const sg of [-1, 1]) {
      c.save(); c.rotate(sg * open);
      c.fillStyle = F(e.col); c.beginPath(); c.ellipse(0, -4, 14, 8, 0, sg > 0 ? 0 : Math.PI, sg > 0 ? Math.PI : TAU); c.fill();
      c.fillStyle = F(a); for (let i = -2; i <= 2; i++) { tri(c, i * 5 - 1.5, -4, i * 5, -4 - sg * 5, i * 5 + 1.5, -4); c.fill(); }
      c.restore();
    }
  } else if (p.kind === 'shroom') {
    c.fillStyle = F('#e8e0d0'); rr(c, -4, -2, 8, 14, 3); c.fill();
    c.fillStyle = F(e.col); c.beginPath(); c.ellipse(0, -3, 15, 11, 0, Math.PI, 0); c.fill();
    c.fillStyle = F(a); for (const [x, y] of [[-7, -8], [0, -11], [7, -7]]) { circ(c, x, y, 2.2); c.fill(); }
    c.fillStyle = '#2a1030'; circ(c, -2, 4, 1); c.fill(); circ(c, 2, 4, 1); c.fill();
  } else if (p.kind === 'tree') {
    const mv = moving(e), sw = mv ? Math.sin(t * 8) * 3 : 0;
    c.strokeStyle = F('#4a2f1a'); c.lineWidth = 3;
    c.beginPath(); c.moveTo(-4, 8); c.lineTo(-6 + sw, 16); c.moveTo(4, 8); c.lineTo(6 - sw, 16); c.stroke();
    c.fillStyle = F('#5a3b22'); rr(c, -6, -6, 12, 16, 4); c.fill();
    c.fillStyle = F(e.col); circ(c, 0, -14, 12); c.fill(); circ(c, -9, -8, 7); c.fill(); circ(c, 9, -8, 7); c.fill();
    c.fillStyle = F(a); circ(c, -3, -1, 1.4); c.fill(); circ(c, 3, -1, 1.4); c.fill();
  } else {
    // mandrake: root body with a leafy crown and a screaming face
    c.fillStyle = F('#c9a06a'); ell(c, 0, 4, 7, 9); c.fill();
    c.strokeStyle = F('#a6804a'); c.lineWidth = 2; c.beginPath(); c.moveTo(-4, 11); c.lineTo(-7, 17); c.moveTo(4, 11); c.lineTo(7, 17); c.stroke();
    c.fillStyle = F(e.col); for (let i = -2; i <= 2; i++) { ell(c, i * 3, -8, 2.5, 7, i * 0.3); c.fill(); }
    c.fillStyle = '#2a1a06'; circ(c, -2.5, 1, 1.2); c.fill(); circ(c, 2.5, 1, 1.2); c.fill(); ell(c, 0, 6, 2, 2.5 + Math.abs(Math.sin(t * 6))); c.fill();
  }
  c.restore();
};

TPL.golem = (c, e, t, p) => {
  const s = p.s || 1, br = Math.sin(t * 2 + (e.seed || 0)), sl = e.lunge > 0 ? e.lunge * 50 : 0, a = acc(e, p);
  c.save(); c.scale(s, s);
  if (p.kind === 'turtle') {
    c.fillStyle = F(shade(e.col, 0.7)); for (const [x, y] of [[-14, 8], [14, 8], [-14, -6], [14, -6]]) { circ(c, x, y, 5); c.fill(); }
    c.fillStyle = F(e.col); ell(c, 0, 0, 20, 15); c.fill();
    c.strokeStyle = F(a); c.lineWidth = 1.5; c.beginPath();
    for (let i = 0; i < 6; i++) { const an = (i / 6) * TAU; const x = Math.cos(an) * 8, y = Math.sin(an) * 6; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.stroke();
    c.fillStyle = F(shade(e.col, 0.8)); circ(c, 21, -2, 6); c.fill();
    c.fillStyle = '#ffe28a'; circ(c, 23, -3, 1.3); c.fill();
  } else if (p.kind === 'crystal') {
    c.fillStyle = F(shade(e.col, 0.5)); rr(c, -10, 2 + br, 20, 14, 4); c.fill();
    for (const [x, h, w] of [[-8, 26, 6], [0, 38, 8], [8, 24, 6]]) {
      c.fillStyle = F(rgba(e.col, 0.85)); c.strokeStyle = F('#ffffff'); c.lineWidth = 1;
      c.beginPath(); c.moveTo(x - w, 4 + br); c.lineTo(x, -h + br); c.lineTo(x + w, 4 + br); c.closePath(); c.fill(); c.stroke();
    }
    c.fillStyle = F(a); circ(c, 0, -6 + br, 3.5); c.fill();
  } else if (p.kind === 'gargoyle') {
    const f = Math.sin(t * 8 + (e.seed || 0));
    c.save(); c.rotate(e.ang || 0);
    c.fillStyle = F(shade(e.col, 0.7));
    for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(-6, sg * (20 + f * 5)); c.lineTo(-12, sg * 12); c.lineTo(-10, sg * 3); c.closePath(); c.fill(); }
    c.fillStyle = F(e.col); ell(c, 0, 0, 11, 7); c.fill(); circ(c, 10, 0, 5.5); c.fill();
    c.fillStyle = F(shade(e.col, 0.6)); tri(c, 8, -4, 10, -10, 12, -4); c.fill(); tri(c, 8, 4, 10, 10, 12, 4); c.fill();
    c.fillStyle = '#ff4d6d'; circ(c, 13, -2, 1.2); c.fill(); circ(c, 13, 2, 1.2); c.fill();
    c.restore();
  } else {
    c.fillStyle = F(shade(e.col, 0.75)); rr(c, -15, 6, 10, 14, 3); c.fill(); rr(c, 5, 6, 10, 14, 3); c.fill();
    c.fillStyle = F(e.col); rr(c, -18, -14 + br, 36, 26, 9); c.fill();
    c.strokeStyle = F(shade(e.col, 0.5)); c.lineWidth = 2; c.stroke();
    c.fillStyle = F(shade(e.col, 0.85)); circ(c, -22, -2 + br - sl * 0.3, 8); c.fill(); circ(c, 22, -2 + br - sl * 0.3, 8); c.fill();
    c.fillStyle = F(shade(e.col, 1.15)); rr(c, -9, -30 + br, 18, 15, 5); c.fill();
    c.fillStyle = a; c.fillRect(-6, -25 + br, 4, 3); c.fillRect(2, -25 + br, 4, 3);
    c.strokeStyle = a; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-8, -6 + br); c.lineTo(0, 2 + br); c.lineTo(8, -6 + br); c.stroke();
  }
  c.restore();
};

TPL.fish = (c, e, t, p) => {
  const s = p.s || 1, w = Math.sin(t * 8 + (e.seed || 0)) * 0.4, a = acc(e, p);
  c.save(); c.rotate(e.ang || 0); c.scale(s, s);
  if (p.kind === 'jelly') {
    c.rotate(-(e.ang || 0));
    c.strokeStyle = F(rgba(a, 0.8)); c.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 3, 2); c.quadraticCurveTo(i * 3 + Math.sin(t * 4 + i) * 4, 10, i * 3, 18); c.stroke(); }
    c.fillStyle = F(rgba(e.col, 0.85)); c.beginPath(); c.ellipse(0, 0, 11, 9, 0, Math.PI, 0); c.lineTo(11, 2); c.lineTo(-11, 2); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)'; ell(c, -4, -4, 3, 2); c.fill();
  } else if (p.kind === 'puffer') {
    const pf = 1 + Math.abs(Math.sin(t * 2)) * 0.2;
    c.fillStyle = F(a); for (let i = 0; i < 12; i++) { const an = (i / 12) * TAU; tri(c, Math.cos(an) * 9 * pf, Math.sin(an) * 9 * pf - 1, Math.cos(an) * 14 * pf, Math.sin(an) * 14 * pf, Math.cos(an) * 9 * pf, Math.sin(an) * 9 * pf + 1); c.fill(); }
    c.fillStyle = F(e.col); circ(c, 0, 0, 10 * pf); c.fill();
    c.fillStyle = '#08203a'; circ(c, 5, -3, 1.5); c.fill();
  } else if (p.kind === 'eel') {
    for (let i = 8; i >= 0; i--) { const x = -i * 4, y = Math.sin(t * 5 + i * 0.8) * 4; c.fillStyle = F(i % 2 ? e.col : shade(e.col, 0.7)); circ(c, x, y, 5 - i * 0.3); c.fill(); }
    c.fillStyle = F(a); circ(c, 4, 0, 5); c.fill();
    if (Math.sin(t * 9) > 0.7) { c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); c.moveTo(-10, -8); c.lineTo(-6, -2); c.lineTo(-12, 0); c.lineTo(-8, 6); c.stroke(); }
  } else if (p.kind === 'manta') {
    const f = Math.sin(t * 3 + (e.seed || 0));
    c.fillStyle = F(e.col); c.beginPath(); c.moveTo(10, 0); c.quadraticCurveTo(0, -24 - f * 4, -10, -20 - f * 6); c.quadraticCurveTo(-4, 0, -10, 20 + f * 6); c.quadraticCurveTo(0, 24 + f * 4, 10, 0); c.fill();
    c.strokeStyle = F(a); c.lineWidth = 1.5; c.beginPath(); c.moveTo(-8, 0); c.lineTo(-22, Math.sin(t * 4) * 3); c.stroke();
    c.fillStyle = '#08203a'; circ(c, 6, -3, 1.2); c.fill(); circ(c, 6, 3, 1.2); c.fill();
  } else {
    // shark
    c.save(); c.translate(-10, 0); c.rotate(w);
    c.fillStyle = F(shade(e.col, 0.8)); c.beginPath(); c.moveTo(0, 0); c.lineTo(-10, -9); c.lineTo(-7, 0); c.lineTo(-10, 9); c.closePath(); c.fill();
    c.restore();
    c.fillStyle = F(e.col); ell(c, 0, 0, 14, 6.5); c.fill();
    c.fillStyle = F(a); ell(c, 0, 2.5, 10, 3); c.fill();
    c.fillStyle = F(shade(e.col, 0.8)); tri(c, -2, -5, 2, -12, 5, -5); c.fill();
    c.fillStyle = '#ffffff'; circ(c, 9, -2.5, 1.2); c.fill();
  }
  c.restore();
};

TPL.spirit = (c, e, t, p) => {
  const b = Math.sin(t * 3 + (e.seed || 0)) * 2, s = p.s || 1, a = acc(e, p);
  c.save(); c.scale(s, s);
  if (p.kind === 'ghost' || p.kind === 'knight') {
    c.globalAlpha = 0.85;
    c.fillStyle = F(p.kind === 'knight' ? shade(e.col, 0.6) : e.col);
    c.beginPath(); c.moveTo(-10, -4 + b); c.quadraticCurveTo(0, -22 + b, 10, -4 + b); c.lineTo(11, 12);
    for (let i = 0; i <= 5; i++) c.lineTo(11 - i * 4.4, 12 + (i % 2 ? 5 : 0) + Math.sin(t * 8 + i) * 2);
    c.closePath(); c.fill();
    c.globalAlpha = 1;
    if (p.kind === 'knight') {
      c.fillStyle = F('#c9d2e0'); rr(c, -7, -16 + b, 14, 12, 4); c.fill();
      c.fillStyle = a; c.fillRect(-5, -11 + b, 10, 2);
      c.strokeStyle = F('#e8f0ff'); c.lineWidth = 2.5; c.beginPath(); c.moveTo(10, 4 + b); c.lineTo(20, -14 + b); c.stroke();
    } else { c.fillStyle = '#05060f'; ell(c, -3, -7 + b, 2, 3); c.fill(); ell(c, 3, -7 + b, 2, 3); c.fill(); ell(c, 0, -1 + b, 2, 3 + Math.abs(Math.sin(t * 5)) * 2); c.fill(); }
  } else if (p.kind === 'lantern') {
    c.strokeStyle = F('#8a6a4a'); c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -18 + b); c.lineTo(0, -12 + b); c.stroke();
    c.fillStyle = F('#4a3a2a'); rr(c, -7, -12 + b, 14, 20, 3); c.fill();
    c.fillStyle = F(e.col); rr(c, -5, -9 + b, 10, 14, 2); c.fill();
    c.fillStyle = F(a); circ(c, 0, -2 + b, 3 + Math.sin(t * 6) * 0.8); c.fill();
  } else if (p.kind === 'eye') {
    c.fillStyle = F(shade(e.col, 0.5)); ell(c, 0, b, 14, 10); c.fill();
    c.fillStyle = F('#f0e8ff'); ell(c, 0, b, 10, 7); c.fill();
    c.fillStyle = F(e.col); circ(c, Math.sin(t) * 3, b, 4.5); c.fill();
    c.fillStyle = '#05010a'; circ(c, Math.sin(t) * 3, b, 2); c.fill();
    c.strokeStyle = F(e.col); c.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) { const an = Math.PI * 0.6 + i * 0.45; c.beginPath(); c.moveTo(Math.cos(an) * 12, b + Math.sin(an) * 9); c.lineTo(Math.cos(an) * 18, b + Math.sin(an) * 14 + Math.sin(t * 4 + i) * 2); c.stroke(); }
  } else if (p.kind === 'cloud') {
    c.fillStyle = F(shade(e.col, 0.6));
    for (const [x, y, r] of [[-8, b, 7], [0, b - 4, 9], [8, b, 7]]) { circ(c, x, y, r); c.fill(); }
    if (Math.sin(t * 8 + (e.seed || 0)) > 0.4) { c.strokeStyle = F(a); c.lineWidth = 1.6; c.beginPath(); c.moveTo(-2, b + 5); c.lineTo(2, b + 11); c.lineTo(-2, b + 12); c.lineTo(2, b + 19); c.stroke(); }
  } else {
    c.fillStyle = F(shade(e.col, 0.6));
    c.beginPath(); c.moveTo(-7, b); c.quadraticCurveTo(-5, -12 + b + Math.sin(t * 9) * 2, 0, -18 + b); c.quadraticCurveTo(5, -12 + b, 7, b); c.closePath(); c.fill();
    c.fillStyle = F(e.col); circ(c, 0, b, 8); c.fill();
    c.fillStyle = F(a); circ(c, -2, b - 2, 2.6); c.fill();
  }
  c.restore();
};

TPL.drake = (c, e, t, p) => {
  const s = p.s || 1, seg = dragonSegments(e), n = seg.length, a = acc(e, p);
  c.save(); c.scale(s, s);
  for (let i = n - 1; i >= 1; i--) {
    const q = seg[i], k = 1 - i / n, r = 3.5 + k * 9;
    c.fillStyle = F(i % 2 ? shade(e.col, 0.7) : e.col); circ(c, q.x / s, q.y / s, r); c.fill();
    if (i % 2 === 0) { c.fillStyle = F(a); circ(c, q.x / s, q.y / s - r * 0.6, r * 0.32); c.fill(); }
  }
  if (!p.noWings) {
    const wp = seg[Math.min(2, n - 1)], flap = Math.sin(t * 6 + (e.seed || 0));
    c.save(); c.translate(wp.x / s, wp.y / s); c.rotate(e.ang || 0);
    c.fillStyle = F(rgba(shade(e.col, 1.2), 0.8)); c.strokeStyle = F(a); c.lineWidth = 1;
    for (const sg of [-1, 1]) { const sp = 22 + flap * 7; c.beginPath(); c.moveTo(2, 0); c.lineTo(-6, sg * sp); c.lineTo(-10, sg * sp * 0.6); c.lineTo(-15, sg * sp * 0.75); c.lineTo(-13, sg * 4); c.closePath(); c.fill(); c.stroke(); }
    c.restore();
  }
  c.save(); c.rotate(e.ang || 0);
  c.fillStyle = F(e.col); ell(c, 4, 0, 11, 7.5); c.fill();
  c.fillStyle = F(shade(e.col, 0.75)); ell(c, 12, 1, 5.5, 4); c.fill();
  c.strokeStyle = F(a); c.lineWidth = 2; c.beginPath(); c.moveTo(0, -5); c.quadraticCurveTo(-6, -11, -11, -9); c.moveTo(0, 5); c.quadraticCurveTo(-6, 11, -11, 9); c.stroke();
  c.fillStyle = p.eye || '#fff38a'; circ(c, 8, -3, 1.8); c.fill(); circ(c, 8, 3, 1.8); c.fill();
  c.restore();
  c.restore();
};

TPL.angel = (c, e, t, p) => {
  const s = p.s || 1, f = Math.sin(t * 4 + (e.seed || 0)), b = Math.sin(t * 2.5) * 2, a = acc(e, p);
  c.save(); c.scale(s, s);
  if (p.kind === 'disc') {
    c.save(); c.rotate(t * 0.8);
    c.fillStyle = F(a); for (let i = 0; i < 12; i++) { c.save(); c.rotate((i / 12) * TAU); tri(c, 12, -3, 22, 0, 12, 3); c.fill(); c.restore(); }
    c.restore();
    c.fillStyle = F(e.col); circ(c, 0, 0, 12); c.fill();
    c.fillStyle = '#ffffff'; circ(c, 0, 0, 6); c.fill();
  } else if (p.kind === 'titan') {
    c.fillStyle = F(shade(e.col, 0.7)); rr(c, -16, 6, 12, 16, 4); c.fill(); rr(c, 4, 6, 12, 16, 4); c.fill();
    c.fillStyle = F(e.col); rr(c, -20, -18 + b, 40, 28, 10); c.fill();
    c.fillStyle = F(shade(e.col, 1.15)); circ(c, 0, -28 + b, 10); c.fill();
    c.fillStyle = F(a); c.fillRect(-6, -30 + b, 12, 3);
    c.strokeStyle = F('#ffffff'); c.lineWidth = 2; ell(c, 0, -42 + b, 10, 3); c.stroke();
  } else if (p.kind === 'moon') {
    c.fillStyle = F(e.col); circ(c, 0, b, 13); c.fill();
    c.fillStyle = '#0a0a20'; circ(c, 6, b - 3, 11); c.fill();
    c.fillStyle = F(a); for (let i = 0; i < 4; i++) { const an = t + i * TAU / 4; circ(c, Math.cos(an) * 20, b + Math.sin(an) * 8, 2); c.fill(); }
  } else {
    const wings = p.wings || 1;
    for (let k = 0; k < wings; k++) wingPair(c, 0, -2 + b + k * 7, (p.span || 24) - k * 6, k % 2 ? -f : f, rgba(shade(e.col, 1.1), 0.8), a, 0.9 - k * 0.5);
    c.fillStyle = F(e.col); c.beginPath(); c.moveTo(-6, -4 + b); c.lineTo(6, -4 + b); c.lineTo(9, 14 + b); c.lineTo(-9, 14 + b); c.closePath(); c.fill();
    c.fillStyle = F('#f3e0c4'); circ(c, 0, -10 + b, 5.5); c.fill();
    c.strokeStyle = F('#ffd66b'); c.lineWidth = 1.8; ell(c, 0, -18 + b, 6, 2); c.stroke();
    if (p.spear) { c.strokeStyle = F(a); c.lineWidth = 2.5; c.beginPath(); c.moveTo(10, 12 + b); c.lineTo(18, -18 + b); c.stroke(); }
  }
  c.restore();
};

// ================= the 50 new cards =================
// [id, rank, name, role, desc, template, templateParams, stats, skill]
const NEW_CARDS = [
  // ---- Insect ----
  ['ember_moth', 'insect', 'Ember Moth', 'Fire Diver', 'A pair of burning moths that dive through enemies.', 'insect', { kind: 'moth', wing: '#ff9a3a' }, { cost: 12, cd: 1.6, count: 2, weight: 0.5, ai: 'flier', flying: true, hp: 18, dmg: 7, speed: 380, r: 9, color: '#ffcf5a' }, ['detonate', 'Moth Flare', 6, 6, 'All Ember Moths burst into flame. Consumes them.']],
  ['iron_ant', 'insect', 'Iron Ant', 'Legion', 'Four armored ants that never break formation.', 'insect', { kind: 'ant' }, { cost: 10, cd: 1.2, count: 4, weight: 0.25, ai: 'melee', hp: 16, dmg: 3.5, atkCd: 0.4, speed: 205, r: 7, color: '#c9d2e0' }, ['howl', 'War Pheromone', 10, 14, 'All summons deal +40% damage for 6s.']],
  ['firefly_swarm', 'insect', 'Firefly Swarm', 'Sparkers', 'Three glowing fireflies that shoot sparks from range.', 'insect', { kind: 'firefly', acc: '#fff36a' }, { cost: 11, cd: 1.4, count: 3, weight: 1 / 3, ai: 'ranged', flying: true, hp: 10, dmg: 4, atkCd: 0.6, range: 230, projSpeed: 420, speed: 230, r: 6, color: '#d6ff6a' }, ['mark', 'Beacon', 8, 10, 'Marks the enemy nearest your cursor for +50% damage.']],
  ['scorpion', 'insect', 'Ashen Scorpion', 'Venom Tank', 'A tough scorpion whose sting leaves deep poison.', 'insect', { kind: 'scorpion', acc: '#9dff3a' }, { cost: 15, cd: 2, ai: 'melee', hp: 60, dmg: 8, poison: 6, atkCd: 0.8, speed: 150, r: 13, color: '#c9783a' }, ['cloud', 'Venom Spray', 10, 10, 'Releases a lingering poison cloud.']],
  ['hornet_queen', 'insect', 'Hornet Queen', 'Stinger', 'Fires piercing stingers from above.', 'insect', { kind: 'wasp', crown: true, wing: '#fff6c0' }, { cost: 16, cd: 2, ai: 'ranged', flying: true, hp: 40, dmg: 9, atkCd: 0.7, range: 260, projSpeed: 480, pierce: 1, speed: 210, r: 11, color: '#ffd34a' }, ['cloud', 'Swarm Cloud', 10, 10, 'A cloud of stinging hornets poisons the area.']],
  ['stag_beetle', 'insect', 'Stag Beetle', 'Rammer', 'Charges with huge mandibles, scattering enemies.', 'insect', { kind: 'stag', acc: '#c9a06a' }, { cost: 16, cd: 2.5, ai: 'charger', hp: 70, dmg: 10, knock: 260, atkCd: 0.8, speed: 165, r: 14, color: '#5a7a2a' }, ['rampage', 'Horn Rush', 8, 8, 'Charges at your cursor for triple damage, stunning what it hits.']],
  // ---- Beast ----
  ['frost_wolf', 'beast', 'Frost Wolf', 'Chiller', 'Its icy bite slows enemies.', 'beast', { frost: true, eye: '#bff6ff' }, { cost: 19, cd: 2.2, ai: 'melee', hp: 70, dmg: 9, atkCd: 0.5, speed: 250, r: 14, slowHit: 0.4, color: '#bfefff' }, ['blizzard', 'Frost Howl', 14, 14, 'A freezing storm around the wolf.']],
  ['shadow_panther', 'beast', 'Shadow Panther', 'Assassin', 'Strikes from the dark for heavy damage.', 'beast', { dark: '#120a24', eye: '#ff4dd2' }, { cost: 20, cd: 2.4, ai: 'melee', hp: 55, dmg: 16, atkCd: 0.7, speed: 290, r: 13, color: '#4a3a6a' }, ['mark', 'Hunter\'s Gaze', 10, 10, 'Marks the enemy nearest your cursor for +50% damage.']],
  ['war_bear', 'beast', 'War Bear', 'Brawler', 'A massive bear that soaks up hits and mauls back.', 'beast', { bulk: true, s: 1.35 }, { cost: 26, cd: 3.5, ai: 'melee', hp: 220, dmg: 14, atkCd: 1.0, speed: 140, r: 19, color: '#8a5a3a' }, ['howl', 'Roar', 12, 14, 'All summons deal +40% damage for 6s; nearby enemies are stunned.']],
  ['thunder_ram', 'beast', 'Thunder Ram', 'Battering Ram', 'Its charges crackle with lightning.', 'beast', { horns: true, acc: '#fff6a8', s: 1.15 }, { cost: 24, cd: 3.2, ai: 'charger', hp: 140, dmg: 16, knock: 360, stunHit: 0.3, speed: 170, r: 16, color: '#9fd6ff' }, ['rampage', 'Thunder Charge', 10, 8, 'Charges at your cursor for triple damage, stunning what it hits.']],
  ['dire_hyena', 'beast', 'Dire Hyena', 'Pack', 'A cackling pair that harasses enemies relentlessly.', 'beast', { spots: true, s: 0.9 }, { cost: 18, cd: 2, count: 2, weight: 0.5, ai: 'melee', hp: 45, dmg: 8, atkCd: 0.45, speed: 265, r: 12, color: '#c9a06a' }, ['howl', 'Cackle', 10, 14, 'All summons deal +40% damage for 6s.']],
  ['sun_lion', 'beast', 'Sun Lion', 'Pride Leader', 'A radiant lion that leads the hunt.', 'beast', { mane: true, acc: '#ff9a3a', s: 1.2 }, { cost: 26, cd: 3, ai: 'melee', hp: 120, dmg: 15, atkCd: 0.6, speed: 235, r: 16, color: '#ffcf5a' }, ['howl', 'Pride Roar', 12, 14, 'All summons deal +40% damage for 6s.']],
  // ---- Bird ----
  ['raven', 'bird', 'Raven Pair', 'Harrier', 'Two ravens that dive relentlessly.', 'bird', { wing: '#2a2040', head: '#3a3050', beak: '#8a8aa0', s: 0.85 }, { cost: 18, cd: 2.2, count: 2, weight: 0.5, ai: 'flier', flying: true, hp: 30, dmg: 10, speed: 480, r: 10, color: '#5a4a7a' }, ['mark', 'Omen', 10, 12, 'Marks the enemy nearest your cursor; every flier dives at it.']],
  ['thunderhawk', 'bird', 'Thunderhawk', 'Stormdiver', 'Dives with thunder, stunning its prey.', 'bird', { wing: '#3a6aa8', acc: '#fff6a8', span: 24 }, { cost: 24, cd: 2.8, ai: 'flier', flying: true, hp: 60, dmg: 22, stunDive: 0.3, speed: 500, r: 13, color: '#7fd3ff' }, ['mark', 'Storm Mark', 12, 10, 'Marks the enemy nearest your cursor; every flier dives at it.']],
  ['owl_sage', 'bird', 'Owl Sage', 'Seer', 'A wise owl that fires piercing feathers.', 'bird', { round: true, wing: '#8a6a4a', head: '#c9a06a', slow: true }, { cost: 22, cd: 2.6, ai: 'ranged', flying: true, hp: 60, dmg: 14, atkCd: 0.9, range: 340, projSpeed: 520, pierce: 1, speed: 200, r: 12, color: '#c9a06a' }, ['blizzard', 'Night Gale', 14, 14, 'A freezing gale around the owl.']],
  ['fire_falcon', 'bird', 'Fire Falcon', 'Blaze Diver', 'Leaves a trail of fire as it dives.', 'bird', { wing: '#c43a1a', fire: true, acc: '#ffcf5a' }, { cost: 24, cd: 2.6, ai: 'flier', flying: true, hp: 55, dmg: 20, speed: 520, r: 12, color: '#ff7a2e' }, ['inferno', 'Firestorm', 22, 22, 'Rains fire on your cursor for 4s.']],
  ['storm_crane', 'bird', 'Storm Crane', 'Guardian', 'Circles you, boosting summons and granting shields.', 'bird', { neck: true, wing: '#bfd6e8', head: '#ffffff', slow: true, span: 24 }, { cost: 26, cd: 7, ai: 'buffer', flying: true, hp: 80, aura: 200, buff: 0.25, shield: 20, speed: 230, r: 12, color: '#e8fbff' }, ['wave', 'Gust Wave', 16, 16, 'A wind wave blasts enemies away and doubles everyone\'s shields.']],
  ['vulture', 'bird', 'Plague Vulture', 'Scavenger', 'Its dives spread rot.', 'bird', { wing: '#4a3a2a', head: '#c97a6a', span: 24 }, { cost: 22, cd: 2.6, ai: 'flier', flying: true, hp: 70, dmg: 14, poison: 5, speed: 420, r: 13, color: '#8a6a4a' }, ['cloud', 'Carrion Cloud', 12, 12, 'A cloud of rot poisons the area.']],
  // ---- Grass ----
  ['mandrake', 'grass', 'Mandrake', 'Screamer', 'Its scream roots and shreds nearby enemies. Lasts 18s.', 'plant', { kind: 'mandrake' }, { cost: 20, cd: 6, ai: 'thorns', stationary: true, hp: 90, dmg: 8, aura: 140, slow: 0.5, life: 18, r: 14, color: '#7ad16a' }, ['entangle', 'Root Scream', 10, 12, 'Roots every enemy nearby for 2.5s.']],
  ['lotus', 'grass', 'Moon Lotus', 'Healer', 'A floating lotus that heals everyone nearby. Lasts 22s.', 'plant', { kind: 'lotus', acc: '#fff6c0' }, { cost: 22, cd: 7, ai: 'heal', stationary: true, hp: 70, heal: 9, aura: 180, life: 22, r: 15, color: '#ff9ad5' }, ['bloom', 'Full Bloom', 8, 15, 'Bursts to heal you and nearby summons for 35% of max HP. Consumes it.']],
  ['venus_trap', 'grass', 'Venus Snapjaw', 'Devourer', 'Taunts enemies close, then snaps them up. Lasts 30s.', 'plant', { kind: 'trap', acc: '#ffffff' }, { cost: 26, cd: 8, ai: 'taunt', stationary: true, hp: 260, dmg: 20, atkCd: 1.0, aura: 180, slam: 80, life: 30, r: 18, color: '#5dd16a' }, ['fortress', 'Thick Hide', 14, 18, 'Invulnerable for 6s and taunts a wider area.']],
  ['spore_shroom', 'grass', 'Spore Shroom', 'Plaguebloom', 'Releases poisonous spores that slow enemies. Lasts 20s.', 'plant', { kind: 'shroom', acc: '#ffe9a8' }, { cost: 20, cd: 6, ai: 'thorns', stationary: true, hp: 80, dmg: 5, aura: 150, slow: 0.3, poison: 4, life: 20, r: 15, color: '#c78bff' }, ['cloud', 'Spore Burst', 10, 10, 'Releases a lingering poison cloud.']],
  ['treant_sapling', 'grass', 'Treant Sapling', 'Walking Wall', 'A young treant that walks into battle and roots foes.', 'plant', { kind: 'tree', acc: '#d6ff6a' }, { cost: 24, cd: 4, ai: 'melee', hp: 200, dmg: 12, atkCd: 1.0, speed: 120, aura: 150, r: 17, color: '#3f8a3a' }, ['entangle', 'Root Snare', 10, 12, 'Roots every enemy near the sapling for 2.5s.']],
  // ---- Stone ----
  ['granite_turtle', 'stone', 'Granite Tortoise', 'Bastion', 'An unmovable shell that taunts and slams.', 'golem', { kind: 'turtle', acc: '#c9f56a' }, { cost: 30, cd: 9, ai: 'taunt', stationary: true, weight: 1.5, hp: 600, dmg: 12, atkCd: 1.3, aura: 220, slam: 70, r: 22, color: '#8a9a7a' }, ['fortress', 'Shell Up', 14, 18, 'Invulnerable for 6s, blocks projectiles and taunts a wider area.']],
  ['crystal_sentinel', 'stone', 'Crystal Sentinel', 'Turret', 'A crystal tower that fires piercing shards.', 'golem', { kind: 'crystal', acc: '#ffffff' }, { cost: 30, cd: 6, ai: 'ranged', stationary: true, hp: 300, dmg: 24, atkCd: 1.1, range: 360, projSpeed: 560, pierce: 2, r: 18, color: '#7fe9ff' }, ['blizzard', 'Shard Storm', 16, 16, 'A freezing shard storm around the sentinel.']],
  ['obsidian_golem', 'stone', 'Obsidian Golem', 'Crusher', 'A walking golem that crushes the front line.', 'golem', { acc: '#ff4dd2', s: 0.85 }, { cost: 30, cd: 5, ai: 'melee', hp: 380, dmg: 22, atkCd: 1.1, speed: 110, r: 21, color: '#3a2a4a' }, ['rampage', 'Avalanche', 12, 8, 'Charges at your cursor for triple damage, stunning what it hits.']],
  ['gargoyle', 'stone', 'Gargoyle', 'Stone Diver', 'A living statue that dives from the sky.', 'golem', { kind: 'gargoyle' }, { cost: 26, cd: 3, ai: 'flier', flying: true, hp: 160, dmg: 26, stunDive: 0.3, speed: 380, r: 16, color: '#7a7a8a' }, ['mark', 'Petrify Mark', 12, 10, 'Marks the enemy nearest your cursor; every flier dives at it.']],
  ['rock_titan', 'stone', 'Rock Titan', 'Colossus', 'A towering titan that taunts the whole field.', 'golem', { acc: '#ffcf5a', s: 1.25 }, { cost: 44, cd: 12, ai: 'taunt', stationary: true, weight: 2, hp: 900, dmg: 26, atkCd: 1.4, aura: 280, slam: 100, r: 28, color: '#a68c5c' }, ['fortress', 'Unbreakable', 16, 18, 'Invulnerable for 6s, blocks projectiles and taunts a wider area.']],
  // ---- Fish ----
  ['pufferfish', 'fish', 'Pufferfish', 'Bubble Guard', 'Circles you, boosting summons and granting shields.', 'fish', { kind: 'puffer', acc: '#ffffff' }, { cost: 24, cd: 7, ai: 'buffer', flying: true, hp: 70, aura: 200, buff: 0.2, shield: 30, dmg: 14, speed: 220, r: 12, color: '#ffe08a' }, ['detonate', 'Spike Burst', 8, 8, 'The pufferfish explodes in a ring of spikes. Consumes it.']],
  ['shark', 'fish', 'Reef Shark', 'Predator', 'A fast hunter that tears through enemies.', 'fish', { kind: 'shark', acc: '#e8f0ff' }, { cost: 26, cd: 3, ai: 'melee', flying: true, hp: 120, dmg: 18, atkCd: 0.6, speed: 300, r: 15, color: '#5a7a9a' }, ['rampage', 'Feeding Frenzy', 10, 8, 'Lunges at your cursor for triple damage, stunning what it hits.']],
  ['jellyfish', 'fish', 'Moon Jelly', 'Stunner', 'Fires stinging bolts that heavily slow.', 'fish', { kind: 'jelly', acc: '#ffd6ff' }, { cost: 24, cd: 3, ai: 'ranged', flying: true, hp: 80, dmg: 12, atkCd: 1.0, range: 260, projSpeed: 380, slow: 0.6, pierce: 1, speed: 160, r: 12, color: '#d48bff' }, ['zero', 'Paralyze', 20, 20, 'Freezes every enemy near you for 2.5s.']],
  ['electric_eel', 'fish', 'Storm Eel', 'Conductor', 'Coils in place and chains lightning between enemies.', 'fish', { kind: 'eel', acc: '#fff6a8' }, { cost: 30, cd: 8, ai: 'archon', stationary: true, weight: 1.5, hp: 160, dmg: 26, atkCd: 1.0, range: 300, chain: 2, r: 13, color: '#9fe8ff' }, ['tempest', 'Overcharge', 24, 20, 'Lightning strikes every enemy in range three times.']],
  ['manta_ray', 'fish', 'Sky Manta', 'Tide Warden', 'A great manta that boosts and shields everything near it.', 'fish', { kind: 'manta', acc: '#bfefff' }, { cost: 32, cd: 9, ai: 'buffer', flying: true, hp: 160, aura: 260, buff: 0.3, shield: 40, speed: 220, r: 16, color: '#5ab8ff' }, ['wave', 'Tidal Surge', 18, 16, 'A wave blasts enemies away and doubles everyone\'s shields.']],
  // ---- Spirit ----
  ['will_o_wisp', 'spirit', 'Will-o\'-Wisps', 'Lures', 'Two wisps that hurl small exploding orbs.', 'spirit', { acc: '#ffffff', s: 0.85 }, { cost: 26, cd: 3, count: 2, weight: 0.5, ai: 'ranged', flying: true, hp: 40, dmg: 12, atkCd: 0.9, range: 300, splash: 45, projSpeed: 400, speed: 200, r: 10, color: '#9fffd6' }, ['bomb', 'Lure Bomb', 10, 10, 'One wisp hurls itself at your cursor and explodes. Consumes it.']],
  ['banshee', 'spirit', 'Banshee', 'Wailer', 'Her wail pierces through lines of enemies.', 'spirit', { kind: 'ghost' }, { cost: 28, cd: 3.2, ai: 'ranged', flying: true, hp: 80, dmg: 16, atkCd: 1.1, range: 280, projSpeed: 460, pierce: 3, speed: 190, r: 13, color: '#c9d6ff' }, ['zero', 'Death Wail', 20, 20, 'Freezes every enemy near you in terror for 2.5s.']],
  ['phantom_knight', 'spirit', 'Phantom Knight', 'Duelist', 'A ghostly knight that cuts through the front line.', 'spirit', { kind: 'knight', acc: '#8af0ff' }, { cost: 30, cd: 3.5, ai: 'melee', flying: true, hp: 180, dmg: 24, atkCd: 0.8, speed: 220, r: 15, color: '#8a8aff' }, ['rampage', 'Spectral Charge', 12, 8, 'Charges at your cursor for triple damage, stunning what it hits.']],
  ['soul_lantern', 'spirit', 'Soul Lantern', 'Lightbearer', 'A lantern of souls that heals everyone near it. Lasts 25s.', 'spirit', { kind: 'lantern', acc: '#fff6c0' }, { cost: 28, cd: 8, ai: 'heal', stationary: true, hp: 120, heal: 14, aura: 200, life: 25, r: 13, color: '#ffe9a8' }, ['sanctuary', 'Soul Light', 18, 20, 'Heals every nearby ally for 40% of max HP.']],
  ['storm_spirit', 'spirit', 'Storm Spirit', 'Tempest', 'A small storm cloud that chains lightning.', 'spirit', { kind: 'cloud', acc: '#ffffff' }, { cost: 30, cd: 6, ai: 'archon', stationary: true, weight: 1.5, hp: 140, dmg: 40, atkCd: 0.9, range: 340, chain: 2, r: 14, color: '#bff6ff' }, ['tempest', 'Thunderhead', 26, 20, 'Lightning strikes every enemy in range three times.']],
  ['void_eye', 'spirit', 'Void Eye', 'Annihilator', 'A floating eye that fires slow, devastating blasts.', 'spirit', { kind: 'eye' }, { cost: 34, cd: 4, ai: 'ranged', flying: true, hp: 100, dmg: 30, atkCd: 1.4, range: 380, splash: 90, projSpeed: 380, speed: 170, r: 14, color: '#7a3cff' }, ['nova', 'Collapse', 24, 20, 'The eye collapses in a colossal blast. Consumes it.']],
  // ---- Dragon ----
  ['frost_drake', 'dragon', 'Frost Drake', 'Glacier Breath', 'Its frozen breath slows everything it touches.', 'drake', { acc: '#ffffff', eye: '#bff6ff' }, { cost: 66, cd: 18, ai: 'dragon', flying: true, weight: 3, hp: 420, dmg: 8, bite: 30, atkCd: 0.9, range: 250, speed: 240, r: 22, breath: 'frost', color: '#9fe8ff' }, ['blizzard', 'Whiteout', 20, 20, 'A freezing storm around the drake.']],
  ['venom_drake', 'dragon', 'Venom Drake', 'Plague Breath', 'Breathes toxic gas that poisons everything.', 'drake', { acc: '#d6ff4a', eye: '#ff4dd2' }, { cost: 64, cd: 18, ai: 'dragon', flying: true, weight: 3, hp: 400, dmg: 7, bite: 28, atkCd: 0.9, range: 250, speed: 240, r: 22, breath: 'venom', color: '#5dd16a' }, ['cloud', 'Miasma', 20, 16, 'Releases a huge lingering poison cloud.']],
  ['storm_drake', 'dragon', 'Storm Drake', 'Thunder Breath', 'Breathes crackling lightning.', 'drake', { acc: '#fff6a8' }, { cost: 68, cd: 18, ai: 'dragon', flying: true, weight: 3, hp: 440, dmg: 9, bite: 32, atkCd: 0.9, range: 260, speed: 250, r: 22, color: '#7fd3ff' }, ['tempest', 'Sky Fury', 30, 22, 'Lightning strikes every enemy in range three times.']],
  ['wyvern_hatchling', 'dragon', 'Wyvern Hatchling', 'Young Flame', 'A small but fierce young dragon. Cheaper to summon.', 'drake', { acc: '#ffe08a', s: 0.75 }, { cost: 45, cd: 12, ai: 'dragon', flying: true, weight: 2, hp: 260, dmg: 6, bite: 22, atkCd: 0.9, range: 200, speed: 250, r: 18, color: '#ffb347' }, ['inferno', 'Tantrum', 22, 22, 'Rains fire on your cursor for 4s.']],
  ['elder_wyrm', 'dragon', 'Elder Wyrm', 'Ancient', 'An ancient dragon of overwhelming power.', 'drake', { acc: '#ffd34a', s: 1.3 }, { cost: 90, cd: 24, ai: 'dragon', flying: true, weight: 4, hp: 800, dmg: 14, bite: 50, atkCd: 0.9, range: 300, speed: 230, r: 28, color: '#c43a3a' }, ['inferno', 'Cataclysm', 32, 25, 'Rains fire on your cursor for 4s.']],
  // ---- Celestial ----
  ['cherub', 'celestial', 'Cherub', 'Blessing', 'Follows you, healing the most wounded ally and shielding the party.', 'angel', { span: 16, s: 0.85 }, { cost: 50, cd: 10, ai: 'priest', flying: true, weight: 1.5, hp: 260, heal: 20, shield: 40, speed: 240, r: 12, color: '#fff6d6' }, ['sanctuary', 'Grace', 24, 20, 'Heals every nearby ally for 40% of max HP.']],
  ['valkyrie', 'celestial', 'Valkyrie', 'Chooser of the Slain', 'Dives with a holy spear, stunning everything in her path.', 'angel', { spear: true, span: 26, acc: '#c9d6ff' }, { cost: 58, cd: 6, ai: 'flier', flying: true, weight: 2, hp: 300, dmg: 60, stunDive: 0.4, speed: 560, r: 16, color: '#e8e2ff' }, ['mark', 'Judgement Mark', 18, 10, 'Marks the enemy nearest your cursor; every flier dives at it.']],
  ['star_titan', 'celestial', 'Star Titan', 'Heavenly Wall', 'A golden giant that taunts and crushes everything near it.', 'angel', { kind: 'titan', acc: '#3a2a08' }, { cost: 70, cd: 16, ai: 'taunt', stationary: true, weight: 3, hp: 1600, dmg: 60, atkCd: 1.2, aura: 300, slam: 120, r: 30, color: '#fff2a8' }, ['fortress', 'Aegis', 22, 18, 'Invulnerable for 6s, blocks projectiles and taunts a wider area.']],
  ['moon_oracle', 'celestial', 'Moon Oracle', 'Seer of Tides', 'Circles you, boosting summons +50% and granting strong shields.', 'angel', { kind: 'moon', acc: '#bfefff' }, { cost: 60, cd: 12, ai: 'buffer', flying: true, weight: 2, hp: 300, aura: 300, buff: 0.5, shield: 80, speed: 230, r: 14, color: '#c9d6ff' }, ['zero', 'Moonfall', 26, 20, 'Freezes every enemy near you for 2.5s.']],
  ['solar_disc', 'celestial', 'Solar Disc', 'Sunfire', 'A miniature sun that rains chain lightning on every foe.', 'angel', { kind: 'disc', acc: '#ff9a3a' }, { cost: 72, cd: 16, ai: 'archon', stationary: true, weight: 2.5, hp: 700, dmg: 90, atkCd: 0.8, range: 420, chain: 4, r: 18, color: '#ffd66b' }, ['tempest', 'Solar Flare', 36, 22, 'Lightning strikes every enemy in range three times.']],
  ['arch_angel', 'celestial', 'Archangel', 'Herald of Light', 'Six-winged herald that fires holy lances and heals allies.', 'angel', { wings: 3, span: 30, acc: '#ffd66b' }, { cost: 80, cd: 14, ai: 'ranged', flying: true, weight: 3, hp: 500, dmg: 80, atkCd: 0.9, range: 400, projSpeed: 680, pierce: 6, heal: 20, healAura: 200, lance: true, speed: 220, r: 18, color: '#ffffff' }, ['judgment', 'Divine Judgment', 34, 18, 'A colossal holy beam toward your cursor.']],
];

const NEW_CARD_IDS = [];
for (const [id, rank, name, role, desc, tpl, tp, stats, skill] of NEW_CARDS) {
  CARDS[id] = Object.assign({ rank, name, role, desc, tpl: [tpl, tp], tags: [rank] }, stats);
  CARD_SKILLS[id] = { fx: skill[0], name: skill[1], mp: skill[2], cd: skill[3], desc: skill[4] };
  DR[id] = (c, e, t) => TPL[tpl](c, e, t, tp);
  CARD_IDS.push(id); NEW_CARD_IDS.push(id);
}

// ================= 30 new fusions =================
// [id, name, role, primaryParent, secondaryParent, desc]
const NEW_FUSIONS = [
  ['blaze_swarm', 'Blaze Swarm', 'Inferno Swarm', 'ember_moth', 'firefly_swarm', 'Burning moths and sparking fireflies dive as one.'],
  ['iron_legion', 'Iron Legion', 'Phalanx', 'iron_ant', 'stag_beetle', 'An unbreakable column of armored ants.'],
  ['deathstalker', 'Deathstalker', 'Shadow Venom', 'scorpion', 'shadow_panther', 'A shadow scorpion whose poison never fades.'],
  ['hive_empress', 'Hive Empress', 'Queen of Stings', 'hornet_queen', 'spark_beetle', 'Commands a storm of piercing stingers.'],
  ['glacier_fang', 'Glacier Fang', 'Ice Alpha', 'frost_wolf', 'fang_wolf', 'An alpha wolf whose bite freezes solid.'],
  ['night_terror', 'Night Terror', 'Nightmare', 'shadow_panther', 'raven', 'A winged shadow that strikes from nowhere.'],
  ['ursa_titan', 'Ursa Titan', 'Mountain Bear', 'war_bear', 'iron_boar', 'A colossal armored bear.'],
  ['tempest_ram', 'Tempest Ram', 'Storm Charger', 'thunder_ram', 'thunderhawk', 'Its charges call down lightning.'],
  ['pride_king', 'Pride King', 'King of Beasts', 'sun_lion', 'dire_hyena', 'The radiant king of every pack.'],
  ['raven_lord', 'Raven Lord', 'Carrion King', 'raven', 'vulture', 'A flock of rot-winged ravens.'],
  ['sky_sovereign', 'Sky Sovereign', 'Ruler of Winds', 'thunderhawk', 'gale_hawk', 'The fastest diver in the skies.'],
  ['sage_of_winds', 'Sage of Winds', 'Wind Oracle', 'owl_sage', 'storm_crane', 'An ancient owl that pierces whole armies.'],
  ['inferno_falcon', 'Inferno Falcon', 'Sunfire Diver', 'fire_falcon', 'ember_wyrm', 'Dives wreathed in dragonfire.'],
  ['world_root', 'World Root', 'Tree of Life', 'treant_sapling', 'healing_sprout', 'A walking tree of life that roots and mends.'],
  ['lotus_queen', 'Lotus Queen', 'Blooming Tide', 'lotus', 'tide_koi', 'A lotus that heals with the strength of the tide.'],
  ['devouring_maw', 'Devouring Maw', 'Glutton', 'venus_trap', 'thorn_vine', 'A giant snapjaw wrapped in thorns.'],
  ['mycolord', 'Mycolord', 'Spore King', 'spore_shroom', 'mandrake', 'Its spores scream and poison.'],
  ['aegis_tortoise', 'Aegis Tortoise', 'Living Fortress', 'granite_turtle', 'manta_ray', 'An ocean tortoise with an unbreakable shell.'],
  ['prism_colossus', 'Prism Colossus', 'Crystal Fortress', 'crystal_sentinel', 'stone_golem', 'A crystal tower that never stops firing.'],
  ['gargoyle_lord', 'Gargoyle Lord', 'Stone Wing', 'gargoyle', 'obsidian_golem', 'An obsidian gargoyle that dives like a meteor.'],
  ['megalodon', 'Abyssal Megalodon', 'Deep Terror', 'shark', 'electric_eel', 'An electrified shark from the deepest trench.'],
  ['moonjelly_queen', 'Moonjelly Queen', 'Paralyzer', 'jellyfish', 'pufferfish', 'Her stings paralyze whole battlefields.'],
  ['phantom_lord', 'Phantom Lord', 'Wraith King', 'phantom_knight', 'banshee', 'A spectral king whose blade wails.'],
  ['lantern_saint', 'Lantern Saint', 'Guiding Light', 'soul_lantern', 'will_o_wisp', 'A saintly light that heals and guides.'],
  ['eye_of_the_void', 'Eye of the Void', 'Oblivion', 'void_eye', 'storm_spirit', 'An eye that fires collapsing stars.'],
  ['cryo_wyrm', 'Cryo Wyrm', 'Absolute Frost', 'frost_drake', 'frost_spirit', 'A dragon of eternal winter.'],
  ['plague_drake', 'Plague Drake', 'Pestilence', 'venom_drake', 'plague_swarm', 'A dragon whose breath is a living plague.'],
  ['thunder_dragon', 'Thunder Dragon', 'Storm Sovereign', 'storm_drake', 'archon', 'A dragon born from the eye of the storm.'],
  ['dragon_emperor', 'Dragon Emperor', 'Sovereign of Dragons', 'elder_wyrm', 'wyvern_hatchling', 'The emperor of all dragons.'],
  ['seraphic_king', 'Seraphic King', 'Throne of Heaven', 'arch_angel', 'valkyrie', 'The king of the heavenly host.'],
];
const BEHAVIOR_KEYS = ['ai', 'flying', 'stationary', 'count', 'poison', 'splash', 'pierce', 'range', 'projSpeed', 'aura', 'slam', 'heal', 'healAura', 'buff', 'shield', 'chain', 'lance', 'stunDive', 'stunHit', 'knock', 'life', 'slow', 'slowHit', 'breath', 'speed', 'r'];
NEW_FUSIONS.forEach(([id, name, role, a, b, desc], k) => {
  const A = CARDS[a], B = CARDS[b];
  const f = { rank: 'fusion', fusion: [a, b], name, role, desc, fuseCost: 300 + k * 30, color: A.color, colAlt: B.color };
  for (const key of BEHAVIOR_KEYS) if (A[key] !== undefined) f[key] = A[key];
  f.hp = Math.round((A.hp + B.hp) * 0.9);
  f.dmg = Math.round(Math.max(A.dmg || 0, B.dmg || 0) * 1.6 * 10) / 10;
  if (A.bite) f.bite = Math.round(Math.max(A.bite, B.bite || 0) * 1.5);
  if (A.heal) f.heal = Math.round(A.heal * 1.5);
  if (A.shield) f.shield = Math.round(A.shield * 1.5);
  if (A.buff) f.buff = Math.min(0.6, A.buff + 0.15);
  if (f.r) f.r = Math.round(f.r * 1.15);
  f.atkCd = A.atkCd ? A.atkCd * 0.85 : undefined;
  f.cost = Math.round((A.cost + B.cost) * 0.65);
  f.cd = Math.max(A.cd, B.cd);
  f.weight = Math.max(A.weight ?? 1, B.weight ?? 1);
  if (f.count > 1) f.weight = Math.max(A.weight ?? 1, 1 / f.count);
  f.tags = [...new Set([A.rank === 'fusion' ? A.tags : [A.rank], B.rank === 'fusion' ? B.tags : [B.rank]].flat())];
  CARDS[id] = f;
  const ask = CARD_SKILLS[a];
  CARD_SKILLS[id] = { fx: ask.fx, name: ask.name + ' Ascendant', mp: Math.round(ask.mp * 1.2), cd: ask.cd, desc: ask.desc };
  const draw = DR[a];
  DR[id] = (c, e, t) => {
    const keep = e.colAlt; e.colAlt = B.color;
    c.save(); c.scale(1.18, 1.18); draw(c, e, t); c.restore();
    e.colAlt = keep;
    c.fillStyle = F('#ffd34a');
    const y = -(f.r || 14) - 8;
    c.beginPath(); c.moveTo(-6, y + 4); c.lineTo(-5, y - 2); c.lineTo(-2, y + 1); c.lineTo(0, y - 4); c.lineTo(2, y + 1); c.lineTo(5, y - 2); c.lineTo(6, y + 4); c.closePath(); c.fill();
  };
  CARD_IDS.push(id);
});
const FUSION_COUNT = CARD_IDS.filter(id => CARDS[id].fusion).length;

ACHIEVEMENTS.push(
  { id: 'cards50',   name: 'Collector',        reward: 200, desc: 'Unlock 50 different cards.',     check: () => CARD_IDS.filter(cardUnlocked).length >= 50 },
  { id: 'cards90',   name: 'Grand Grimoire',   reward: 600, desc: 'Unlock 90 different cards.',     check: () => CARD_IDS.filter(cardUnlocked).length >= 90 },
  { id: 'fusion20',  name: 'Master Alchemist', reward: 400, desc: 'Discover 20 fusions.',            check: () => Object.keys(SAVE.fused).length >= 20 },
  { id: 'fusionAll', name: 'Perfect Pact',     reward: 1000, desc: `Discover all ${FUSION_COUNT} fusions.`, check: () => Object.keys(SAVE.fused).length >= FUSION_COUNT },
);
