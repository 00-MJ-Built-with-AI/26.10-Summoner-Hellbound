'use strict';
// ---------- Automation: run-upgrade and soul-boost priority lists, auto Enhance (Q), auto Overdrive (F),
//            and an auto toggle for each card's special skill ----------

const AUTO_DEF = () => ({ run: false, runOrder: [], soul: false, soulOrder: [], q: false, f: false, skills: {} });
const AUTO = () => { if (!SAVE.auto) SAVE.auto = AUTO_DEF(); return SAVE.auto; };
const RAR_RANK = { legendary: 0, rare: 1, common: 2 };
// keeps the saved array itself (so an open editor and the game always share one list)
function normOrder(arr, ids) {
  for (let i = arr.length - 1; i >= 0; i--) if (!ids.includes(arr[i]) || arr.indexOf(arr[i]) !== i) arr.splice(i, 1);
  for (const id of ids) if (!arr.includes(id)) arr.push(id);
  return arr;
}
const runOrder = () => normOrder(AUTO().runOrder, [...RUN_UPGRADES].sort((x, y) => RAR_RANK[x.r] - RAR_RANK[y.r]).map(u => u.id));
const soulOrder = () => normOrder(AUTO().soulOrder, BOOSTS.map(b => b.id));
const bestIndex = (list, order) => { let best = 0, br = Infinity; list.forEach((x, i) => { const r = order.indexOf(x.id); if (r >= 0 && r < br) { br = r; best = i; } }); return best; };

// run upgrades: no pop-up; the highest-priority of the 3 offered is taken automatically
const _au_openRunChoice = openRunChoice;
openRunChoice = function () {
  if (!SAVE || !AUTO().run || W.choosing || W.endT >= 0) { _au_openRunChoice(); return; }
  const list = rollRunChoices();
  W.ruPending = Math.max(0, W.ruPending - 1);
  if (!list.length) return;
  W.choosing = list; W.choosingKind = 'run';
  const i = bestIndex(list, runOrder());
  pickBoost(i);
};
// soul boosts: same idea
const _au_openBoostChoice = openBoostChoice;
openBoostChoice = function () {
  _au_openBoostChoice();
  if (SAVE && AUTO().soul && W.choosing && !W.choosingKind) pickBoost(bestIndex(W.choosing, soulOrder()));
};

// auto-cast: the aim point for skills that target your cursor
let AUTO_AIM = null;
const _au_mouseWorld = mouseWorld;
mouseWorld = function () { return AUTO_AIM || _au_mouseWorld(); };
function enemiesAround(x, y, R) { let n = 0; enemiesNear(x, y, R, e => { if (!e.dead && dist2(e, { x, y }) < R * R) n++; }); return n; }
function autoTick() {
  const p = W.player, a = AUTO();
  if (p.dead || W.won || W.choosing || W.floorPause > 0 || W.endT >= 0) return;
  const boss = W.boss && !W.boss.dead ? W.boss : null;
  const reserve = p.maxMp * (boss ? 0.1 : 0.2);
  const near = enemiesAround(p.x, p.y, 420) + (boss && dist2(boss, p) < 520 * 520 ? 8 : 0);
  // Q: Enhance when summons are out, enemies are close and it is ready
  if (a.q) {
    const sk = SKILLS.find(s => s.key === 'KeyQ'), mine = W.summons.filter(s => !s.c.comp && !s.dead).length;
    if (sk && p.cds.KeyQ <= 0 && p.enhT <= 0 && mine >= 2 && near >= 3 && p.mp >= sk.mp + reserve) useSkill('KeyQ');
  }
  // F: Overdrive when full and the fight is big (a boss, or a crowd)
  if (a.f && W.od >= OD_MAX && (boss || near >= 12)) useOverdrive();
  // special skills: one per tick, so they don't all fire on the same frame
  for (let k = 0; k < 6; k++) {
    const slot = (W.autoSlot = ((W.autoSlot || 0) + 1) % 6), id = SAVE.hotbar[slot];
    if (!id || !a.skills[id] || (W.cskCd[id] || 0) > 0) continue;
    const sk = CARD_SKILLS[id];
    if (p.mp < sk.mp + reserve) continue;
    const mine = W.summons.filter(s => s.id === id && !s.dead);
    if (!mine.length) continue;
    const s = mine[0], tgt = boss && dist2(boss, s) < 420 * 420 ? boss : nearestEnemy(s.x, s.y, 360);
    if (!tgt || (!boss && enemiesAround(tgt.x, tgt.y, 160) < 2)) continue;
    AUTO_AIM = { x: tgt.x, y: tgt.y };
    try { useCardSkill(slot); } finally { AUTO_AIM = null; }
    break;
  }
}
const _au_updateZones = updateZones;
updateZones = function (dt) {
  _au_updateZones(dt);
  if (!SAVE || !SAVE.auto || PHOTO.on) return;
  W.autoT = (W.autoT || 0) - dt;
  if (W.autoT <= 0) { W.autoT = 0.25; autoTick(); }
};

// ---------------- HUD: AUTO badges; right-click (or long-press the badge) a slot to toggle its auto skill ----------------
function toggleAutoSkill(id) {
  const a = AUTO();
  if (a.skills[id]) delete a.skills[id]; else a.skills[id] = true;
  saveGame(); SFX.click();
  toast(`${CARDS[id].name}: auto ${CARD_SKILLS[id].name} ${a.skills[id] ? 'on' : 'off'}`, 'card');
  if (W.active) buildHotbar();
}
const _au_buildHotbar = buildHotbar;
buildHotbar = function () {
  _au_buildHotbar();
  if (!SAVE) return;
  const a = AUTO();
  (hudCache.slots || []).forEach((el, i) => {
    const id = SAVE.hotbar[i];
    if (!id) return;
    const b = document.createElement('button');
    b.className = 'auto-b' + (a.skills[id] ? ' on' : '');
    b.textContent = 'A'; b.title = `Auto special skill: ${a.skills[id] ? 'on' : 'off'} (right-click the slot to toggle)`;
    b.onpointerdown = ev => ev.stopPropagation();
    b.onclick = ev => { ev.stopPropagation(); toggleAutoSkill(id); };
    el.appendChild(b);
    el.addEventListener('contextmenu', ev => { ev.preventDefault(); toggleAutoSkill(id); });
  });
  markAutoSkills();
};
function markAutoSkills() {
  const a = AUTO();
  const q = document.querySelector('#skills .skill[data-key="KeyQ"]'), f = $('odBtn');
  if (q) q.classList.toggle('auto-on', !!a.q);
  if (f) f.classList.toggle('auto-on', !!a.f);
}
const _au_buildHUD = buildHUD;
buildHUD = function () { _au_buildHUD(); markAutoSkills(); };

// ---------------- Automation panel (Pause menu, Settings and Grimoire) ----------------
function automationHTML() {
  const a = AUTO(), ids = SAVE.hotbar.filter(Boolean);
  const chk = (k, label, hint) => `<label class="set-row auto-row"><span>${label}<br><span class="muted">${hint}</span></span><input type="checkbox" data-auto="${k}" ${a[k] ? 'checked' : ''}></label>`;
  return `<div class="auto-panel">
    ${chk('run', 'Auto-pick run upgrades', 'No pop-up: takes the highest one on your priority list from the 3 offered.')}
    <button class="btn small" data-order="run">Set run upgrade priority</button>
    ${chk('soul', 'Auto-pick soul boosts', 'Same, for the boosts offered when the soul gauge fills.')}
    <button class="btn small" data-order="soul">Set soul boost priority</button>
    ${chk('q', `Auto Enhance (${key1('enhance')})`, 'Casts when 2+ summons are out, enemies are close and you have mana to spare.')}
    ${chk('f', `Auto Overdrive (${key1('overdrive')})`, 'Fires when the gauge is full during a boss fight or against a big crowd.')}
    <h4>Auto special skills</h4>
    <p class="muted">Each card remembers its own setting. You can also right-click a slot (or tap its small A) during battle.</p>
    <div class="auto-cards">${ids.length ? ids.map(id => `<label class="auto-card"><input type="checkbox" data-askill="${id}" ${a.skills[id] ? 'checked' : ''}><canvas width="40" height="40" data-icon="${id}"></canvas><span><b>${CARDS[id].name}</b><br><span class="muted">${CARD_SKILLS[id].name}</span></span></label>`).join('') : '<span class="muted">Your hotbar is empty.</span>'}</div>
  </div>`;
}
function bindAutomation(root, rerender) {
  const a = AUTO();
  root.querySelectorAll('[data-auto]').forEach(c => c.onchange = () => { a[c.dataset.auto] = c.checked; saveGame(); SFX.click(); if (W.active) markAutoSkills(); });
  root.querySelectorAll('[data-askill]').forEach(c => c.onchange = () => { if (c.checked) a.skills[c.dataset.askill] = true; else delete a.skills[c.dataset.askill]; saveGame(); SFX.click(); if (W.active) buildHotbar(); });
  root.querySelectorAll('[data-order]').forEach(b => b.onclick = () => { SFX.click(); openPriorityEditor(b.dataset.order, rerender); });
  root.querySelectorAll('[data-icon]').forEach(cv => renderCardIcon(cv, cv.dataset.icon));
}
function openAutomation() {
  showInfoCard('Automation', automationHTML(), 'Done');
  bindAutomation($('infoCard'), openAutomation);
}
// drag-and-drop (mouse) plus ▲ ▼ buttons (touch) to order the priority list
function openPriorityEditor(kind, back) {
  const order = kind === 'run' ? runOrder() : soulOrder();
  const info = id => kind === 'run' ? RU_BY_ID[id] : BOOSTS.find(b => b.id === id);
  const render = () => {
    showInfoCard(kind === 'run' ? 'Run upgrade priority' : 'Soul boost priority', `<p class="muted">Top = picked first. Drag rows, or use the arrows. When none of your top choices is offered, the highest one that is offered is taken.</p>
      <div class="prio-tools"><button class="btn small ghost" data-preset="rarity">Rarity first</button><button class="btn small ghost" data-preset="damage">Damage first</button><button class="btn small ghost" data-preset="safety">Survival first</button></div>
      <ol class="prio-list">${order.map((id, i) => { const u = info(id); return `<li draggable="true" data-i="${i}" class="${u.r ? 'ru-' + u.r : ''}"><span class="pn">${i + 1}</span><span class="pi">${u.icon}</span><span class="pt"><b>${u.name}</b>${u.r ? ` <small>${RU_RARITY[u.r].label}</small>` : ''}<br><span class="muted">${u.desc}</span></span><span class="pb"><button class="btn small ghost" data-up="${i}" ${i ? '' : 'disabled'}>▲</button><button class="btn small ghost" data-down="${i}" ${i < order.length - 1 ? '' : 'disabled'}>▼</button></span></li>`; }).join('')}</ol>`, 'Save');
    const m = $('infoCard'), save = () => { saveGame(); };
    m.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const i = +b.dataset.up; [order[i - 1], order[i]] = [order[i], order[i - 1]]; save(); render(); });
    m.querySelectorAll('[data-down]').forEach(b => b.onclick = () => { const i = +b.dataset.down; [order[i + 1], order[i]] = [order[i], order[i + 1]]; save(); render(); });
    let from = -1;
    m.querySelectorAll('.prio-list li').forEach(li => {
      li.ondragstart = () => { from = +li.dataset.i; li.classList.add('drag'); };
      li.ondragover = ev => ev.preventDefault();
      li.ondrop = ev => { ev.preventDefault(); const to = +li.dataset.i; if (from < 0 || from === to) return; order.splice(to, 0, order.splice(from, 1)[0]); save(); render(); };
    });
    m.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
      const p = b.dataset.preset, score = id => {
        const u = info(id), d = (u.desc || '').toLowerCase();
        if (p === 'rarity') return u.r ? RAR_RANK[u.r] : 1;
        const dmg = /damage|explode|lightning|meteor|star|kill/.test(d), safe = /hp|heal|less damage|regenerat|rise again|shield|armor/.test(d);
        return p === 'damage' ? (dmg ? 0 : safe ? 2 : 1) - (u.r === 'legendary' ? 0.5 : 0) : (safe ? 0 : dmg ? 2 : 1) - (u.r === 'legendary' ? 0.5 : 0);
      };
      order.sort((x, y) => score(x) - score(y)); save(); SFX.click(); render();
    });
    $('btnInfoOk').onclick = () => { SFX.click(); save(); if (back) back(); else m.classList.add('hidden'); };
  };
  render();
}
// entry points: Pause menu button, Settings section, Grimoire card checkbox
(function addAutomationButtons() {
  const pause = document.querySelector('#scr-pause .menu-col');
  if (pause) { const b = document.createElement('button'); b.className = 'btn ghost'; b.id = 'btnAutomation'; b.textContent = 'Automation'; b.onclick = () => { SFX.click(); openAutomation(); }; pause.insertBefore(b, $('btnRetreat')); }
  const anchor = [...document.querySelectorAll('#scr-settings h3')].find(h => h.textContent === 'Co-op');
  if (anchor) {
    anchor.insertAdjacentHTML('beforebegin', '<h3>Automation</h3><p class="muted save-note">Auto-pick upgrades, auto Enhance and Overdrive, and auto special skills per card.</p><button class="btn small" id="btnAutoSettings">Open automation settings</button>');
    $('btnAutoSettings').onclick = () => { SFX.click(); if (!SAVE) { toast('Start or continue a game first', 'fail'); return; } openAutomation(); };
  }
})();
const _au_cardEl = cardEl;
cardEl = function (id) {
  const el = _au_cardEl(id);
  if (!cardUnlocked(id) || !CARD_SKILLS[id]) return el;
  const row = document.createElement('label');
  row.className = 'auto-skill-row';
  row.innerHTML = `<input type="checkbox" ${AUTO().skills[id] ? 'checked' : ''}> Auto-cast ${CARD_SKILLS[id].name}`;
  row.onclick = ev => ev.stopPropagation();
  row.querySelector('input').onchange = ev => { if (ev.target.checked) AUTO().skills[id] = true; else delete AUTO().skills[id]; saveGame(); SFX.click(); };
  const host = el.querySelector('.desc');
  (host ? host.parentNode : el).insertBefore(row, host ? host.nextSibling : null);
  return el;
};
