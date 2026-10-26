'use strict';
// ---------- Drawings for Acts II & III: enemies, bosses, companions, celestial cards, scenery ----------

Object.assign(BOSS_DRAW_R, {
  cerberus: 44, bloodqueen: 40, behemoth: 52, broodmother: 50, emperor: 54,
  seraphboss: 46, roc: 50, serpent: 46, eclipse: 40, fallengod: 58,
});

function wingPair(c, x, y, span, flap, fill, stroke, k = 1) {
  c.fillStyle = F(fill); c.strokeStyle = F(stroke); c.lineWidth = 1.2;
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x + s * span * 0.6, y - span * (0.7 + flap * 0.3) * k, x + s * span, y - span * 0.2 * k + flap * 6);
    c.quadraticCurveTo(x + s * span * 0.55, y + span * 0.15, x, y + 6);
    c.closePath(); c.fill(); c.stroke();
  }
}
function humanoid(c, e, t, o) {
  const mv = moving(e), ph = t * 12 + (e.seed || 0);
  const bob = mv ? -Math.abs(Math.sin(ph)) * 1.5 : Math.sin(t * 3) * 0.6;
  const s = mv ? Math.sin(ph) * 3.5 : 0;
  c.save(); c.scale(e.face || 1, 1);
  if (e.lunge > 0) c.translate(e.lunge * 25, 0);
  c.strokeStyle = F(o.legs); c.lineWidth = 3.5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-3, 10); c.lineTo(-3 + s, 18); c.moveTo(3, 10); c.lineTo(3 - s, 18); c.stroke();
  c.fillStyle = F(o.body);
  c.beginPath(); c.moveTo(-8, -2 + bob); c.lineTo(8, -2 + bob); c.lineTo(o.robe ? 12 : 9, 14); c.lineTo(o.robe ? -12 : -9, 14); c.closePath(); c.fill();
  c.strokeStyle = F(o.trim); c.lineWidth = 1.3; c.stroke();
  c.fillStyle = F('#f3cfae'); circ(c, 1, -10 + bob, 7.5); c.fill();
  c.fillStyle = F(o.hair);
  if (o.hood) { c.beginPath(); c.arc(1, -10 + bob, 9, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(10, -6 + bob); c.lineTo(-8, -6 + bob); c.closePath(); c.fill(); }
  else if (o.long) { c.beginPath(); c.arc(0, -11 + bob, 8.5, Math.PI, 0); c.lineTo(8, 4 + bob); c.lineTo(3, -6 + bob); c.lineTo(-6, -6 + bob); c.lineTo(-9, 4 + bob); c.closePath(); c.fill(); }
  else { c.beginPath(); c.arc(1, -12 + bob, 8, Math.PI, 0); c.lineTo(9, -9 + bob); c.lineTo(-7, -8 + bob); c.closePath(); c.fill(); }
  c.fillStyle = '#20304a'; c.fillRect(4, -10 + bob, 2, 2.6);
  o.extra && o.extra(c, bob, t);
  c.restore();
}

// ===== companions =====
DR.comp_roran = (c, e, t) => humanoid(c, e, t, {
  legs: '#2a3550', body: '#3a5aa8', trim: '#c9d2e0', hair: '#7a4a22',
  extra: (c, b) => {
    c.fillStyle = F('#c9d2e0'); rr(c, -13, -2 + b, 7, 13, 3); c.fill();
    c.fillStyle = F('#3a5aa8'); circ(c, -9.5, 4 + b, 2); c.fill();
    c.strokeStyle = F('#e8f0ff'); c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(8, 4 + b); c.lineTo(20, -12 + b); c.stroke();
    c.strokeStyle = F('#ffd66b'); c.lineWidth = 2; c.beginPath(); c.moveTo(6, 1 + b); c.lineTo(11, 6 + b); c.stroke();
  },
});
DR.comp_lysa = (c, e, t) => humanoid(c, e, t, {
  legs: '#c9c2e0', body: '#f4f0ff', trim: '#ffd66b', hair: '#ffe08a', robe: true, long: true,
  extra: (c, b, t) => {
    c.strokeStyle = F('#c9a24a'); c.lineWidth = 2; c.beginPath(); c.moveTo(10, 14); c.lineTo(10, -18 + b); c.stroke();
    c.fillStyle = F('#fff2a8'); circ(c, 10, -20 + b, 3.5 + Math.sin(t * 4) * 0.6); c.fill();
    c.strokeStyle = F('#fff2a8'); c.lineWidth = 1; circ(c, 1, -21 + b, 6); c.stroke();
  },
});
DR.comp_kael = (c, e, t) => humanoid(c, e, t, {
  legs: '#2a3a1a', body: '#3f6a2a', trim: '#9dff7a', hair: '#2f5a22', hood: true,
  extra: (c, b) => {
    c.strokeStyle = F('#a8794a'); c.lineWidth = 2;
    c.beginPath(); c.arc(9, 1 + b, 11, -1.2, 1.2); c.stroke();
    c.strokeStyle = '#e8e8e8'; c.lineWidth = 0.7;
    c.beginPath(); c.moveTo(9 + Math.cos(-1.2) * 11, 1 + b + Math.sin(-1.2) * 11); c.lineTo(9 + Math.cos(1.2) * 11, 1 + b + Math.sin(1.2) * 11); c.stroke();
  },
});

// ===== celestial cards =====
DR.seraph = (c, e, t) => {
  const f = Math.sin(t * 5 + (e.seed || 0)), b = Math.sin(t * 2.5) * 2;
  wingPair(c, 0, -2 + b, 30, f, 'rgba(255,246,214,0.85)', '#ffd66b', 0.9);
  wingPair(c, 0, 6 + b, 22, -f, 'rgba(255,242,168,0.7)', '#ffd66b', -0.6);
  c.fillStyle = F('#fff6d6'); c.beginPath(); c.moveTo(-6, -4 + b); c.lineTo(6, -4 + b); c.lineTo(9, 16 + b); c.lineTo(-9, 16 + b); c.closePath(); c.fill();
  c.fillStyle = F('#f3e0c4'); circ(c, 0, -10 + b, 6); c.fill();
  c.strokeStyle = F('#ffd66b'); c.lineWidth = 2; ell(c, 0, -19 + b, 7, 2.2); c.stroke();
  c.strokeStyle = F('#fff2a8'); c.lineWidth = 2.5; c.beginPath(); c.moveTo(10, 10 + b); c.lineTo(18, -16 + b); c.stroke();
};
DR.archon = (c, e, t) => {
  const p = 1 + Math.sin(t * 3) * 0.04;
  c.fillStyle = F('#2a3a5a'); c.beginPath(); c.moveTo(-12, 18); c.lineTo(-8, -26); c.lineTo(0, -34); c.lineTo(8, -26); c.lineTo(12, 18); c.closePath(); c.fill();
  c.strokeStyle = F('#9fe8ff'); c.lineWidth = 1.5; c.stroke();
  c.strokeStyle = F('#bff6ff'); c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(0, -28); c.lineTo(-3, -12); c.lineTo(3, -4); c.lineTo(-2, 10); c.stroke();
  c.save(); c.translate(0, -44); c.scale(p, p);
  c.fillStyle = F('#5a6a8a');
  for (const [x, y, r] of [[-10, 0, 9], [0, -5, 11], [10, 0, 9], [0, 4, 8]]) { circ(c, x, y, r); c.fill(); }
  c.restore();
  if (Math.sin(t * 7) > 0.6) { c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-6, -38); c.lineTo(-10, -26); c.lineTo(-5, -28); c.lineTo(-9, -16); c.stroke(); }
};

// ===== enemies =====
DR.shieldbearer = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  const mv = moving(e), s = mv ? Math.sin(t * 10 + (e.seed || 0)) * 3 : 0;
  c.strokeStyle = F('#2a0a12'); c.lineWidth = 3.5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-4, 9); c.lineTo(-4 + s, 17); c.moveTo(4, 9); c.lineTo(4 - s, 17); c.stroke();
  c.fillStyle = F('#6a1a2a'); ell(c, -1, 2, 10, 11); c.fill();
  c.fillStyle = F(e.col); circ(c, 0, -10, 7); c.fill();
  c.strokeStyle = F('#1a050a'); c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(-3, -15); c.quadraticCurveTo(-8, -20, -6, -24); c.moveTo(4, -15); c.quadraticCurveTo(9, -20, 7, -24); c.stroke();
  c.fillStyle = '#ffd84a'; circ(c, 2, -10, 1.5); c.fill();
  c.fillStyle = F('#4a5670'); rr(c, 6, -13, 10, 27, 4); c.fill();
  c.strokeStyle = F('#c9d2e0'); c.lineWidth = 1.5; c.stroke();
  c.fillStyle = F('#ff3355'); circ(c, 11, 0, 3); c.fill();
  c.restore();
};
DR.witch = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  const b = Math.sin(t * 3 + (e.seed || 0)) * 1.5;
  c.fillStyle = F('#3a1050'); c.beginPath(); c.moveTo(-6, -3 + b); c.lineTo(6, -3 + b); c.lineTo(11, 15); c.lineTo(-11, 15); c.closePath(); c.fill();
  c.strokeStyle = F(e.col); c.lineWidth = 1.2; c.stroke();
  c.fillStyle = F('#d9f0c4'); circ(c, 1, -8 + b, 6); c.fill();
  c.fillStyle = F('#2a0a3a'); c.beginPath(); c.moveTo(-10, -11 + b); c.lineTo(12, -11 + b); c.lineTo(2, -14 + b); c.lineTo(-3, -30 + b); c.lineTo(-4, -14 + b); c.closePath(); c.fill();
  c.fillStyle = '#ff4dd2'; circ(c, 3, -8 + b, 1.3); c.fill();
  c.fillStyle = F('#ff4dd2'); circ(c, 12, 2 + b, 3 + Math.sin(t * 6)); c.fill();
  c.restore();
};
DR.magmagolem = (c, e, t) => {
  const br = Math.sin(t * 2 + (e.seed || 0));
  c.fillStyle = F('#3a1a0a');
  rr(c, -18, -14 + br, 36, 30, 10); c.fill();
  circ(c, -20, 0 + br, 8); c.fill(); circ(c, 20, 0 + br, 8); c.fill();
  rr(c, -9, -28 + br, 18, 15, 5); c.fill();
  c.strokeStyle = F('#ff7a1a'); c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(-12, -10 + br); c.lineTo(-4, 0 + br); c.lineTo(-10, 10 + br); c.moveTo(8, -12 + br); c.lineTo(4, -2 + br); c.lineTo(12, 8 + br); c.stroke();
  c.fillStyle = '#ffcf5a'; circ(c, 0, 0 + br, 5 + Math.sin(t * 5)); c.fill();
  c.fillStyle = '#ffcf5a'; c.fillRect(-5, -23 + br, 3, 3); c.fillRect(2, -23 + br, 3, 3);
};
DR.spider = (c, e, t) => {
  const k = (e.baseR || 17) / 17;
  c.save(); c.scale(k * (e.face || 1), k);
  const w = moving(e) ? Math.sin(t * 22 + (e.seed || 0)) * 3 : 0;
  c.strokeStyle = F(shade(e.col, 0.5)); c.lineWidth = 2.2;
  for (let i = 0; i < 4; i++) {
    const y = -6 + i * 4, o = i % 2 ? w : -w;
    c.beginPath(); c.moveTo(-3, y); c.quadraticCurveTo(-14, y - 10, -22, y + 6 + o); c.stroke();
    c.beginPath(); c.moveTo(3, y); c.quadraticCurveTo(14, y - 10, 22, y + 6 - o); c.stroke();
  }
  c.fillStyle = F(shade(e.col, 0.7)); ell(c, -3, 4, 12, 10); c.fill();
  c.fillStyle = F(e.col); ell(c, 7, -2, 7, 6); c.fill();
  c.fillStyle = F('#2a0a4a'); c.beginPath(); c.moveTo(-8, 2); c.lineTo(-3, -2); c.lineTo(2, 2); c.lineTo(-3, 8); c.closePath(); c.fill();
  c.fillStyle = '#ff3355'; for (const [x, y] of [[9, -4], [11, -2], [9, 0], [12, -5]]) { circ(c, x, y, 1); c.fill(); }
  c.restore();
};
DR.sentinel = (c, e, t) => {
  const f = Math.sin(t * 6 + (e.seed || 0)), b = Math.sin(t * 3) * 1.5;
  wingPair(c, 0, -2 + b, 18, f, 'rgba(255,250,230,0.8)', '#ffd66b', 0.8);
  c.fillStyle = F('#c9a24a'); c.beginPath(); c.moveTo(-6, -4 + b); c.lineTo(6, -4 + b); c.lineTo(8, 12 + b); c.lineTo(-8, 12 + b); c.closePath(); c.fill();
  c.fillStyle = F(e.col); circ(c, 0, -10 + b, 6); c.fill();
  c.fillStyle = '#5a4010'; c.fillRect(-4, -11 + b, 8, 2);
  c.strokeStyle = F('#fff2a8'); c.lineWidth = 1.5; ell(c, 0, -19 + b, 6, 2); c.stroke();
};
DR.stalker = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  c.globalAlpha = 0.9;
  c.fillStyle = F('#120a2a');
  c.beginPath(); c.moveTo(-10, -8); c.quadraticCurveTo(0, -22, 10, -8); c.lineTo(12, 12);
  for (let i = 0; i <= 5; i++) c.lineTo(12 - i * 4.8, 12 + (i % 2 ? 5 : 0) + Math.sin(t * 9 + i) * 2);
  c.closePath(); c.fill();
  c.globalAlpha = 1;
  c.fillStyle = '#b48bff'; ell(c, 2, -8, 2.2, 1.4); c.fill(); ell(c, 7, -8, 2.2, 1.4); c.fill();
  c.strokeStyle = F('#8a6bff'); c.lineWidth = 2;
  const sw = e.lunge > 0 ? 0.8 : 0;
  c.beginPath(); c.moveTo(8, 0); c.quadraticCurveTo(20, -6 - sw * 6, 18, -16); c.moveTo(-8, 2); c.quadraticCurveTo(-18, -2, -16, -12); c.stroke();
  c.restore();
};
DR.harpy = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  const f = Math.sin(t * 16 + (e.seed || 0));
  c.fillStyle = F('#3a7ab8');
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(s * 12, -14 - f * 5, s * 22, -4 - f * 4); c.lineTo(s * 14, 4); c.closePath(); c.fill(); }
  c.fillStyle = F(e.col); ell(c, 0, 2, 6, 9); c.fill();
  c.fillStyle = F('#e8d0c0'); circ(c, 1, -8, 5); c.fill();
  c.fillStyle = F('#1a3a6a'); c.beginPath(); c.arc(1, -9, 5.5, Math.PI, 0); c.lineTo(6, -2); c.lineTo(3, -6); c.closePath(); c.fill();
  c.fillStyle = '#ffef5a'; circ(c, 3, -8, 1.2); c.fill();
  c.restore();
};
DR.starmote = (c, e, t) => {
  const fuse = e.state === 'fuse', p = 1 + Math.sin(t * (fuse ? 40 : 6)) * 0.12;
  c.save(); c.rotate(t * 3); c.scale(p, p);
  c.fillStyle = F(fuse && Math.sin(t * 40) > 0 ? '#ffffff' : e.col);
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, r = i % 2 ? 5 : 12; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  c.closePath(); c.fill();
  c.restore();
  c.fillStyle = '#5a4010'; circ(c, -2, -1, 1.2); c.fill(); circ(c, 2, -1, 1.2); c.fill();
};
DR.spire = (c, e, t) => {
  const b = Math.sin(t * 2 + (e.seed || 0)) * 3;
  c.fillStyle = F('#c9a24a'); c.strokeStyle = F('#fff2a8'); c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(0, -26 + b); c.lineTo(9, -4 + b); c.lineTo(0, 18 + b); c.lineTo(-9, -4 + b); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = F('#fff6d6'); c.beginPath(); c.moveTo(0, -16 + b); c.lineTo(4, -4 + b); c.lineTo(0, 8 + b); c.lineTo(-4, -4 + b); c.closePath(); c.fill();
  c.save(); c.translate(0, -4 + b); c.rotate(t);
  c.strokeStyle = F(e.col); c.lineWidth = 2; ell(c, 0, 0, 18, 6); c.stroke();
  c.restore();
};
DR.guardian = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  if (e.lunge > 0) c.translate(e.lunge * 20, 0);
  const mv = moving(e), s = mv ? Math.sin(t * 9 + (e.seed || 0)) * 3 : 0;
  c.strokeStyle = F('#8a6a2a'); c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-5, 12); c.lineTo(-5 + s, 22); c.moveTo(5, 12); c.lineTo(5 - s, 22); c.stroke();
  c.fillStyle = F('#d9b25a'); rr(c, -12, -6, 24, 20, 6); c.fill();
  c.strokeStyle = F('#fff2a8'); c.lineWidth = 1.5; c.stroke();
  c.fillStyle = F(e.col); rr(c, -7, -22, 14, 15, 5); c.fill();
  c.fillStyle = '#3a2a08'; c.fillRect(-4, -17, 9, 2.5);
  c.fillStyle = F('#fff2a8'); tri(c, -2, -22, 0, -30, 2, -22); c.fill();
  c.strokeStyle = F('#fff6d6'); c.lineWidth = 3; c.beginPath(); c.moveTo(12, 8); c.lineTo(26, -20); c.stroke();
  c.fillStyle = F('#c9a24a'); rr(c, -22, -10, 9, 24, 4); c.fill();
  c.restore();
};

// ===== bosses =====
DR.cerberus = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  const mv = moving(e), s = mv ? Math.sin(t * 10) * 6 : 0;
  c.strokeStyle = F('#3a0f08'); c.lineWidth = 8; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-22, 12); c.lineTo(-22 + s, 32); c.moveTo(-10, 12); c.lineTo(-10 - s, 32); c.moveTo(16, 12); c.lineTo(16 - s, 32); c.moveTo(26, 12); c.lineTo(26 + s, 32); c.stroke();
  c.strokeStyle = F(e.col); c.lineWidth = 7;
  c.beginPath(); c.moveTo(-34, 0); c.quadraticCurveTo(-48, -14 + Math.sin(t * 6) * 5, -52, -26); c.stroke();
  c.fillStyle = F('#7a2010'); ell(c, 0, 4, 38, 20); c.fill();
  c.fillStyle = F('#3a0f08'); ell(c, 0, -6, 30, 8); c.fill();
  const heads = [[30, -24, -0.4], [40, -6, 0], [30, 12, 0.4]];
  for (const [hx, hy, rot] of heads) {
    c.save(); c.translate(hx, hy); c.rotate(rot + Math.sin(t * 3 + hx) * 0.08);
    c.fillStyle = F(e.col); ell(c, 0, 0, 13, 10); c.fill(); ell(c, 12, 3, 8, 6); c.fill();
    c.fillStyle = F('#3a0f08'); tri(c, -6, -8, -2, -18, 3, -8); c.fill();
    c.fillStyle = '#ffd84a'; circ(c, 4, -3, 2.2); c.fill();
    c.fillStyle = '#ff9a3a'; circ(c, 19, 5, 2 + (e.pat ? 2 : 0)); c.fill();
    c.restore();
  }
  c.restore();
};
DR.bloodqueen = (c, e, t) => {
  const f = Math.sin(t * 4);
  c.fillStyle = F('#4a0818'); c.strokeStyle = F('#ff2a55'); c.lineWidth = 1.5;
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(0, -10);
    c.lineTo(s * 30, -40 - f * 8); c.lineTo(s * 40, -16); c.lineTo(s * 52, -24 - f * 6); c.lineTo(s * 46, 4); c.lineTo(s * 34, -2); c.lineTo(s * 20, 10);
    c.closePath(); c.fill(); c.stroke();
  }
  c.fillStyle = F('#6a0a20'); c.beginPath(); c.moveTo(-10, -8); c.lineTo(10, -8); c.lineTo(22, 34); c.lineTo(-22, 34); c.closePath(); c.fill();
  c.strokeStyle = F('#ff4d6d'); c.lineWidth = 1.5; c.stroke();
  c.fillStyle = F('#f0e0e8'); circ(c, 0, -18, 10); c.fill();
  c.fillStyle = F('#1a0408'); c.beginPath(); c.arc(0, -20, 11, Math.PI, 0); c.lineTo(11, -4); c.lineTo(6, -14); c.lineTo(-6, -14); c.lineTo(-11, -4); c.closePath(); c.fill();
  c.fillStyle = '#ff2a55'; circ(c, -4, -18, 1.8); c.fill(); circ(c, 4, -18, 1.8); c.fill();
  c.fillStyle = F('#ffd34a');
  c.beginPath(); c.moveTo(-8, -28); c.lineTo(-6, -35); c.lineTo(-3, -30); c.lineTo(0, -37); c.lineTo(3, -30); c.lineTo(6, -35); c.lineTo(8, -28); c.closePath(); c.fill();
};
DR.behemoth = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  const mv = moving(e), s = mv ? Math.sin(t * 6) * 5 : 0, br = Math.sin(t * 2);
  c.fillStyle = F('#4a3a2a');
  for (const [x, o] of [[-30, s], [-12, -s], [14, -s], [32, s]]) { rr(c, x - 7, 14 + o * 0.3, 14, 22, 5); c.fill(); }
  c.fillStyle = F('#6a5a44'); rr(c, -44, -26 + br, 88, 46, 18); c.fill();
  c.strokeStyle = F('#c9a06a'); c.lineWidth = 4;
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * 16, 2 + br, 24, -2.4, -0.8); c.stroke(); }
  c.fillStyle = F('#5a4a36'); rr(c, 34, -22 + br, 30, 28, 10); c.fill();
  c.strokeStyle = F('#e8e2cf'); c.lineWidth = 5;
  c.beginPath(); c.moveTo(48, -20 + br); c.quadraticCurveTo(44, -40, 30, -44); c.moveTo(56, -16 + br); c.quadraticCurveTo(70, -34, 66, -48); c.stroke();
  c.fillStyle = '#ffcf5a'; c.fillRect(50, -12 + br, 5, 3); c.fillRect(58, -12 + br, 5, 3);
  c.restore();
};
DR.broodmother = (c, e, t) => {
  c.save(); c.scale(2.9, 2.9);
  DR.spider(c, Object.assign({}, e, { baseR: 17 }), t * 0.7);
  c.restore();
  c.fillStyle = F('#ff3355');
  for (let i = 0; i < 6; i++) { circ(c, -18 + i * 7, -2 + Math.abs(i - 2.5) * 2, 2.4); c.fill(); }
  c.strokeStyle = F('#ffd66b'); c.lineWidth = 2;
  c.beginPath(); c.moveTo(-26, 8); c.lineTo(-12, 0); c.lineTo(-20, 18); c.stroke();
};
DR.emperor = (c, e, t) => {
  c.fillStyle = F('#2a0410');
  c.beginPath(); c.moveTo(-24, -20); c.lineTo(24, -20); c.lineTo(50, 46);
  for (let i = 0; i <= 8; i++) c.lineTo(50 - i * 12.5, 46 + Math.sin(t * 3 + i) * 4 + (i % 2 ? 6 : 0));
  c.closePath(); c.fill();
  c.fillStyle = F('#8a1028'); rr(c, -22, -20, 44, 52, 10); c.fill();
  c.strokeStyle = F('#ffd34a'); c.lineWidth = 2.5; c.stroke();
  c.fillStyle = F('#ffd34a'); rr(c, -28, -22, 14, 12, 4); c.fill(); rr(c, 14, -22, 14, 12, 4); c.fill();
  c.fillStyle = F(e.col); circ(c, 0, -32, 15); c.fill();
  c.strokeStyle = F('#1a0408'); c.lineWidth = 6;
  c.beginPath(); c.moveTo(-10, -42); c.quadraticCurveTo(-30, -52, -26, -72); c.moveTo(10, -42); c.quadraticCurveTo(30, -52, 26, -72); c.stroke();
  c.fillStyle = F('#ffd34a');
  c.beginPath(); c.moveTo(-12, -46); c.lineTo(-8, -58); c.lineTo(-3, -50); c.lineTo(0, -62); c.lineTo(3, -50); c.lineTo(8, -58); c.lineTo(12, -46); c.closePath(); c.fill();
  c.fillStyle = '#ffffff'; ell(c, -5, -32, 3, 2); c.fill(); ell(c, 5, -32, 3, 2); c.fill();
  c.strokeStyle = F('#c9d2e0'); c.lineWidth = 4; c.beginPath(); c.moveTo(26, 20); c.lineTo(44, -34); c.stroke();
};
DR.seraphboss = (c, e, t) => {
  for (let i = 0; i < 6; i++) {
    c.save(); c.rotate((i / 6) * TAU + Math.sin(t) * 0.1);
    c.fillStyle = F('rgba(255,246,214,0.75)'); c.strokeStyle = F('#ffd66b'); c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(14, 0); c.quadraticCurveTo(34, -14, 56, -6); c.quadraticCurveTo(36, 4, 14, 6); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
  for (let i = 0; i < 3; i++) {
    c.save(); c.rotate(t * (0.8 + i * 0.4) * (i % 2 ? -1 : 1));
    c.strokeStyle = F(i ? '#fff2a8' : '#ffd66b'); c.lineWidth = 3;
    ell(c, 0, 0, 30 - i * 5, 11 - i * 2); c.stroke();
    c.restore();
  }
  c.fillStyle = F('#fff6d6'); circ(c, 0, 0, 14); c.fill();
  c.fillStyle = '#3a2a08'; ell(c, 0, 0, 7, 4); c.fill();
  c.fillStyle = '#ffcf5a'; circ(c, 0, 0, 3); c.fill();
};
DR.roc = (c, e, t) => {
  c.save(); c.scale(e.face || 1, 1);
  const f = Math.sin(t * 5);
  wingPair(c, -4, -4, 62, f, '#2f6a9a', '#bff6ff', 0.8);
  c.fillStyle = F(e.col); ell(c, 0, 4, 26, 15); c.fill();
  c.fillStyle = F('#e8fbff'); ell(c, 2, 10, 18, 7); c.fill();
  c.fillStyle = F('#1a4a7a'); tri(c, -24, 4, -46, -6, -44, 16); c.fill();
  c.fillStyle = F('#bff6ff'); circ(c, 28, -8, 11); c.fill();
  c.fillStyle = F('#ffd34a'); tri(c, 36, -12, 52, -4, 36, -2); c.fill();
  c.fillStyle = '#1a2a4a'; circ(c, 31, -10, 2.2); c.fill();
  if (Math.sin(t * 9) > 0.5) { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-10, -30); c.lineTo(-4, -18); c.lineTo(-12, -16); c.lineTo(-4, -2); c.stroke(); }
  c.restore();
};
DR.serpent = (c, e, t) => {
  const n = 14;
  for (let i = n; i >= 0; i--) {
    const a = i * 0.45 + t * 1.5, r = 14 + i * 2.4;
    const x = Math.cos(a) * r * 0.9, y = Math.sin(a) * r * 0.55 + 6;
    c.fillStyle = F(i % 2 ? '#5a4ab8' : e.col); circ(c, x, y, 14 - i * 0.5); c.fill();
    if (i % 3 === 0) { c.fillStyle = '#fff6d6'; circ(c, x + 2, y - 3, 1.4); c.fill(); }
  }
  c.save(); c.translate(0, -16);
  c.fillStyle = F(e.col); ell(c, 0, 0, 18, 13); c.fill();
  c.fillStyle = F('#d4c8ff'); ell(c, 10, 4, 9, 6); c.fill();
  c.strokeStyle = F('#fff2a8'); c.lineWidth = 3;
  c.beginPath(); c.moveTo(-6, -10); c.quadraticCurveTo(-14, -24, -6, -30); c.moveTo(4, -10); c.quadraticCurveTo(10, -24, 18, -26); c.stroke();
  c.fillStyle = '#fff2a8'; circ(c, 4, -3, 2.6); c.fill(); circ(c, -6, -3, 2.6); c.fill();
  c.restore();
};
DR.eclipse = (c, e, t) => {
  c.save(); c.translate(0, -24); c.rotate(t * 0.5);
  c.globalCompositeOperation = 'lighter';
  glowAt(c, 0, 0, 46, '#ff9a5a', 0.45);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#050208'; circ(c, 0, 0, 26); c.fill();
  c.restore();
  if (e.fade) c.globalAlpha = 1 - e.fade * 0.8;
  c.save(); c.scale(e.face || 1, 1);
  c.fillStyle = F('#1a1028'); rr(c, -14, -14, 28, 34, 7); c.fill();
  c.strokeStyle = F(e.col); c.lineWidth = 2; c.stroke();
  c.strokeStyle = F('#2a1a40'); c.lineWidth = 6; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-6, 20); c.lineTo(-8, 34); c.moveTo(6, 20); c.lineTo(8, 34); c.stroke();
  c.fillStyle = F('#2a1a40'); rr(c, -9, -32, 18, 18, 6); c.fill();
  c.fillStyle = '#ff9a5a'; c.fillRect(-5, -25, 12, 2.5);
  c.strokeStyle = F('#d48bff'); c.lineWidth = 4;
  c.beginPath(); c.moveTo(14, 10); c.lineTo(40, -30); c.stroke();
  c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); c.moveTo(16, 7); c.lineTo(38, -28); c.stroke();
  c.restore();
  c.globalAlpha = 1;
};
DR.fallengod = (c, e, t) => {
  const f = Math.sin(t * 2.5);
  for (const [k, sp, broken] of [[1, 70, false], [0.6, 50, true]]) {
    for (const s of [-1, 1]) {
      c.fillStyle = F(broken && s > 0 ? 'rgba(120,100,60,0.6)' : 'rgba(255,240,190,0.75)');
      c.beginPath(); c.moveTo(0, -12);
      c.quadraticCurveTo(s * sp * 0.6, -sp * (0.6 + f * 0.1) * k, s * sp, -sp * 0.3 * k + f * 6);
      c.quadraticCurveTo(s * sp * 0.6, 10, 0, 4); c.closePath(); c.fill();
    }
  }
  c.fillStyle = F('#c9a24a'); c.beginPath(); c.moveTo(-14, -14); c.lineTo(14, -14); c.lineTo(26, 46); c.lineTo(-26, 46); c.closePath(); c.fill();
  c.strokeStyle = F('#fff2a8'); c.lineWidth = 2; c.stroke();
  c.fillStyle = F('#fff6d6'); circ(c, 0, -26, 13); c.fill();
  c.fillStyle = '#ff9a3a'; ell(c, -5, -26, 2.5, 1.5); c.fill(); ell(c, 5, -26, 2.5, 1.5); c.fill();
  c.save(); c.translate(0, -44); c.rotate(Math.sin(t) * 0.1);
  c.strokeStyle = F('#ffd66b'); c.lineWidth = 4;
  c.beginPath(); c.ellipse(0, 0, 22, 7, 0, 0.3, Math.PI * 1.6); c.stroke();
  c.restore();
  c.fillStyle = F('#fff2a8');
  for (let i = 0; i < 6; i++) { const a = t * 0.8 + (i * TAU) / 6; const x = Math.cos(a) * 74, y = Math.sin(a) * 40; c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x + 4, y); c.lineTo(x, y + 7); c.lineTo(x - 4, y); c.closePath(); c.fill(); }
};

// ===== scenery =====
Object.assign(DECO, {
  lavapool(c, d, t) {
    c.fillStyle = '#2a0c04'; ell(c, 0, 0, 44, 20); c.fill();
    const g = c.createRadialGradient(0, 0, 4, 0, 0, 38);
    g.addColorStop(0, '#ffcf5a'); g.addColorStop(0.5, '#ff6a1a'); g.addColorStop(1, 'rgba(160,30,0,0.9)');
    c.fillStyle = g; ell(c, 0, 0, 38, 15); c.fill();
    c.globalCompositeOperation = 'lighter';
    glowAt(c, 0, 0, 60, '#ff6a1a', 0.25 + Math.sin(t * 2 + d.seed) * 0.08);
    c.globalCompositeOperation = 'source-over';
  },
  spire(c, d) {
    c.fillStyle = 'rgba(0,0,0,0.3)'; ell(c, 4, 4, 18, 6); c.fill();
    c.fillStyle = '#1a1024'; tri(c, -12, 4, 0, -54, 12, 4); c.fill();
    c.fillStyle = '#3a2450'; tri(c, -12, 4, 0, -54, -3, 4); c.fill();
  },
  cloud(c, d, t) {
    const dx = Math.sin(t * 0.3 + d.seed) * 6;
    c.fillStyle = 'rgba(230,240,255,0.16)';
    for (const [x, y, r] of [[-20, 0, 18], [0, -8, 24], [22, 0, 18], [6, 6, 20]]) { circ(c, x + dx, y, r); c.fill(); }
  },
  pillar(c, d) {
    c.fillStyle = 'rgba(0,0,0,0.3)'; ell(c, 4, 6, 20, 6); c.fill();
    c.fillStyle = '#d9d2c4'; c.fillRect(-9, -40 + (d.seed % 20), 18, 44 - (d.seed % 20));
    c.fillStyle = '#efe9dc'; c.fillRect(-12, 0, 24, 6);
    c.strokeStyle = 'rgba(120,110,90,0.5)'; c.lineWidth = 1;
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 5, -38 + (d.seed % 20)); c.lineTo(i * 5, 0); c.stroke(); }
  },
  starshard(c, d, t, th) {
    const b = Math.sin(t * 1.5 + d.seed) * 5;
    c.globalCompositeOperation = 'lighter';
    glowAt(c, 0, -14 + b, 26, th.accent, 0.4);
    c.globalCompositeOperation = 'source-over';
    c.save(); c.translate(0, -14 + b); c.rotate(t * 0.5 + d.seed);
    c.fillStyle = rgba(th.accent, 0.85);
    c.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, r = i % 2 ? 3 : 9; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath(); c.fill();
    c.restore();
  },
});
