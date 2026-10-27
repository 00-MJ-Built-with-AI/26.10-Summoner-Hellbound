'use strict';
// ---------- Screens, world map, grimoire, codex, settings, dialogue, HUD ----------

const $ = id => document.getElementById(id);
let STATE = 'title';
let prevScreen = 'title';
let selectedStage = 0;      // number, or 'tower'
let selectedSlot = 0;
let grimTab = 'cards', codexTab = 'bestiary';
let REBIND = null;

const MENU_SCREENS = new Set(['title', 'newgame', 'map', 'grimoire', 'codex']);
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  if (name !== 'play') $('scr-' + name).classList.add('active');
  $('hud').classList.toggle('hidden', !(name === 'play' || name === 'pause'));
  if (name !== STATE && ['grimoire', 'codex', 'settings', 'help', 'map'].includes(name)) SFX.uiOpen();
  STATE = name;
  if (MENU_SCREENS.has(name)) MUSIC.play('menu');
  if (name === 'title') refreshTitle();
  if (name === 'map') buildMap();
  if (name === 'grimoire') { const e = SAVE.hotbar.indexOf(null); if (e >= 0) selectedSlot = e; buildGrimoire(); }
  if (name === 'codex') buildCodex();
  if (name === 'settings') buildSettings();
  if (name === 'help') buildHelp();
}
function openOverlay(name) { if (STATE !== 'help' && STATE !== 'settings') prevScreen = STATE; showScreen(name); }
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const fmt = n => (n >= 100 ? Math.round(n) : Math.round(n * 10) / 10).toLocaleString();
const stars = (arr) => arr.map(b => `<span class="${b ? 'star on' : 'star'}">★</span>`).join('');

// ---------------- title / new game ----------------
function refreshTitle() {
  const s = loadSave();
  $('btnContinue').classList.toggle('hidden', !s);
  if (s) $('continueInfo').textContent = `${MODES[s.mode].name} · Lv ${s.level} · ${s.cleared.filter(Boolean).length}/${STAGES.length} stages`;
  $('titleFoot').textContent = `${key1('up')}${key1('left')}${key1('down')}${key1('right')} to move · ${key1('slot1')}–${key1('slot6')} to summon · hold ${key1('skillMod')} + slot for special skills`;
}
let lastHover = null;
function initMenus() {
  document.addEventListener('pointerover', ev => {
    const b = ev.target.closest && ev.target.closest('.btn, .tab, .rtab, .node, .pick, .mode-card, .boost, .ward, .keybtn, .fchip, .gslot');
    if (b && b !== lastHover && !b.disabled) { lastHover = b; SFX.hover(); }
  });
  document.querySelectorAll('[data-help]').forEach(b => b.addEventListener('click', () => { SFX.click(); openOverlay('help'); }));
  document.querySelectorAll('[data-settings]').forEach(b => b.addEventListener('click', () => { SFX.init(); SFX.click(); openOverlay('settings'); }));
  document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { SFX.click(); showScreen(b.dataset.back); }));
  $('btnHelpBack').onclick = () => { SFX.click(); showScreen(prevScreen); };
  $('btnSettingsBack').onclick = () => { SFX.click(); REBIND = null; showScreen(prevScreen); };
  $('btnContinue').onclick = () => { SFX.init(); SFX.click(); SAVE = loadSave(); SFX.setMuted(!!SAVE.muted); showScreen('map'); };
  $('btnNew').onclick = () => {
    SFX.init(); SFX.click();
    $('overwriteWarn').textContent = loadSave() ? 'Starting a new game will erase your current save.' : 'Like the hero of Hell Mode, you choose your difficulty once, at the very start.';
    showScreen('newgame');
  };
  document.querySelectorAll('.mode-card').forEach(b => b.addEventListener('click', () => {
    SFX.click();
    SAVE = defaultSave(b.dataset.mode);
    saveGame();
    selectedStage = 0;
    showScreen('map');
  }));
  $('btnGrimoire').onclick = () => { SFX.click(); showScreen('grimoire'); };
  $('btnCodex').onclick = () => { SFX.click(); showScreen('codex'); };
  $('btnGrimBack').onclick = () => { SFX.click(); showScreen('map'); };
  $('btnCodexBack').onclick = () => { SFX.click(); showScreen('map'); };
  $('btnToTitle').onclick = () => { SFX.click(); saveGame(); showScreen('title'); };
  $('btnResume').onclick = () => { SFX.click(); resumeGame(); };
  $('btnRetreat').onclick = () => { SFX.click(); finishStage(false, true); };
  $('btnResContinue').onclick = () => {
    SFX.click(); W.ended = true;
    if (W.pendingEnding) { const k = W.pendingEnding; if (k === 'ending') SAVE.endingSeen = true; else SAVE.seenStory[k] = true; saveGame(); showDialogue(STORY[k], () => showScreen('map')); }
    else showScreen('map');
  };
  $('btnResRetry').onclick = () => { SFX.click(); W.isTower ? enterTower() : W.isRush ? enterRush() : W.isDaily ? enterDaily() : W.isRaid ? (ensureWorldBoss(), SAVE.worldBoss.hpLeft > 0 ? enterRaid() : showScreen('map')) : enterStage(W.stageIdx); };
  $('btnPause').onclick = () => pauseGame();
  $('btnMute').onclick = () => toggleMute();
  $('btnTutSkip').onclick = () => { SFX.click(); if (W.tut) endTutorial(); };
  $('btnDlgSkip').onclick = ev => { ev.stopPropagation(); endDialogue(); };
  $('dlg').onclick = () => advanceDialogue();
  $('btnReplayTut').onclick = () => { if (SAVE) { SAVE.tutorialDone = false; saveGame(); toast('The tutorial will play next time you enter Stage 1', 'card'); } };
  $('btnExportSave').onclick = exportSave;
  $('btnImportSave').onclick = importSave;
  $('btnSaveFile').onclick = saveToFile;
  $('loadFile').onchange = loadFromFile;
  $('btnRestore').onclick = showBackups;
  $('btnResetKeys').onclick = () => { SETTINGS.keys = defaultSettings().keys; rebuildKeymap(); saveSettings(); buildSettings(); };
  document.querySelectorAll('#grimTabs .tab').forEach(b => b.onclick = () => { SFX.click(); grimTab = b.dataset.tab; buildGrimoire(); });
  document.querySelectorAll('#codexTabs .tab').forEach(b => b.onclick = () => { SFX.click(); codexTab = b.dataset.tab; buildCodex(); });
  document.querySelectorAll('[data-set]').forEach(el => {
    const k = el.dataset.set;
    el.addEventListener(el.type === 'range' ? 'input' : 'change', () => {
      SETTINGS[k] = el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value;
      saveSettings(); SFX.applyVolumes(); applyTouchMode();
      if (k === 'sfx' || k === 'master') SFX.click();
    });
  });
}
function toggleMute() {
  SFX.init();
  SFX.setMuted(!SFX.muted);
  if (SAVE) { SAVE.muted = SFX.muted; saveGame(); }
  $('btnMute').classList.toggle('off', SFX.muted);
}

// ---------------- help + settings ----------------
function buildHelp() {
  const rows = INPUT.touchMode ? [
    ['Left thumb', 'Drag anywhere on the left side to move'],
    ['Tap a card', 'Summon it ahead of Allen'],
    ['Hold a card', 'Use that card\'s special skill'],
    ['» ✦ ⇄ ↺', 'Dash · Enhance · Swap · Recall'],
  ] : [
    [`${key1('up')} ${key1('left')} ${key1('down')} ${key1('right')}`, 'Move Allen'],
    ['Mouse', 'Aim where summons appear (the faint circle)'],
    [`${keyLabel('slot1')} … ${key1('slot6')}`, 'Summon the card in that hotbar slot (costs mana)'],
    [`${keyLabel('skillMod')} + slot`, "Use that card's special skill (needs the summon on the field)"],
    [keyLabel('dash'), 'Dash: a quick dodge with brief invulnerability'],
    [keyLabel('enhance'), 'Enhance: summons deal +50% damage, act 30% faster for 6s'],
    [keyLabel('swap'), 'Swap places with the summon nearest your cursor'],
    [keyLabel('recall'), 'Recall all summons and refund some mana'],
    [keyLabel('overdrive'), 'Grimoire Overdrive: when the gauge is full, summon every hotbar card for free (+50% damage, 12s)'],
    ['Controller', 'A B X Y LB RB summon · hold LT for special skills · RT dash · D-pad ↑ Enhance, → Swap, ↓ Recall, ← Overdrive · Start pause'],
    [keyLabel('map'), 'Toggle minimap'],
    [`${keyLabel('pause')} · ${keyLabel('mute')}`, 'Pause · Mute'],
  ];
  $('helpGrid').innerHTML = rows.map(([k, v]) => `<div><kbd>${k}</kbd></div><div>${v}</div>`).join('') +
    (INPUT.touchMode ? '' : '<div></div><div class="muted">All keys can be changed in Settings. Numpad keys work with Num Lock on or off.</div>');
}
function buildSettings() {
  document.querySelectorAll('[data-set]').forEach(el => {
    const v = SETTINGS[el.dataset.set];
    if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
  });
  const box = $('binds'); box.innerHTML = '';
  for (const a of ACTIONS) {
    const row = document.createElement('div'); row.className = 'bind-row';
    row.innerHTML = `<span>${a.name}</span>`;
    [0, 1].forEach(i => {
      const b = document.createElement('button');
      b.className = 'keybtn' + (REBIND && REBIND.action === a.id && REBIND.idx === i ? ' listening' : '');
      b.textContent = REBIND && REBIND.action === a.id && REBIND.idx === i ? 'Press a key…' : keyName(SETTINGS.keys[a.id][i]);
      b.onclick = () => { SFX.click(); REBIND = { action: a.id, idx: i }; buildSettings(); };
      row.appendChild(b);
    });
    box.appendChild(row);
  }
}
// ---------------- save transfer (copy/paste code) ----------------
const SAVE_CODE_PREFIX = 'SHG1:';
let importArmed = null;
function saveMsg(text, bad) { const m = $('saveMsg'); m.textContent = text; m.classList.toggle('bad', !!bad); }
function exportSave() {
  SFX.click();
  const s = SAVE || loadSave();
  if (!s) { saveMsg('There is no save in this browser yet. Start a game first.', true); return; }
  const code = SAVE_CODE_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  const box = $('saveCode');
  box.value = code;
  const done = () => saveMsg(`Copied: ${MODES[s.mode].name}, Lv ${s.level}, ${s.cleared.filter(Boolean).length}/${STAGES.length} stages.`);
  const manual = () => { box.focus(); box.select(); saveMsg('Code is selected above. Press Ctrl+C to copy it.'); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, manual);
  else manual();
}
function importSave() {
  SFX.click();
  const raw = $('saveCode').value.trim();
  let data;
  try {
    if (!raw.startsWith(SAVE_CODE_PREFIX)) throw new Error('prefix');
    data = JSON.parse(decodeURIComponent(escape(atob(raw.slice(SAVE_CODE_PREFIX.length)))));
    if (typeof data.level !== 'number' || !data.cards || !MODES[data.mode]) throw new Error('shape');
  } catch (e) { saveMsg("That code isn't a valid save. Copy the whole code, starting with SHG1:", true); importArmed = null; return; }
  const cur = SAVE || loadSave();
  if (cur && importArmed !== raw) {
    importArmed = raw;
    $('btnImportSave').textContent = 'Replace my save';
    saveMsg(`This replaces your current save (Lv ${cur.level}) with Lv ${data.level}. Press "Replace my save" to confirm.`, true);
    return;
  }
  importArmed = null;
  $('btnImportSave').textContent = 'Load pasted code';
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { saveMsg('This browser blocked saving. Check that site data is allowed.', true); return; }
  SAVE = loadSave();
  SFX.setMuted(!!SAVE.muted);
  SFX.level();
  saveMsg(`Loaded: ${MODES[SAVE.mode].name}, Lv ${SAVE.level}, ${SAVE.cleared.filter(Boolean).length}/${STAGES.length} stages. Press Done, then Continue.`);
}

// save file download / upload + backups
function saveToFile() {
  SFX.click();
  const s = SAVE || loadSave();
  if (!s) { saveMsg('There is no save in this browser yet. Start a game first.', true); return; }
  try {
    const blob = new Blob([JSON.stringify(s, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `summoner-save-Lv${s.level}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    saveMsg(`Saved a file with your progress (Lv ${s.level}). Keep it somewhere safe. If no file appeared, use "Copy my save code" instead.`);
  } catch (e) { saveMsg('This browser blocked the download. Use "Copy my save code" instead.', true); }
}
function loadFromFile(ev) {
  const f = ev.target.files && ev.target.files[0];
  ev.target.value = '';
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (typeof data.level !== 'number' || !data.cards || !MODES[data.mode]) throw new Error('shape');
      $('saveCode').value = SAVE_CODE_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      importArmed = null;
      importSave();
    } catch (e) { saveMsg("That file isn't a Summoner save.", true); }
  };
  r.readAsText(f);
}
function showBackups() {
  SFX.click();
  const list = loadBackups();
  const box = $('saveMsg');
  if (!list.length) { saveMsg('No backups yet. One is made automatically after each stage.'); return; }
  box.classList.remove('bad');
  box.innerHTML = 'Pick a backup to restore. This replaces your current save:<div class="save-btns">' +
    list.map((b, i) => `<button class="btn small ghost" data-bk="${i}">Lv ${b.level} · ${b.cleared} stages · ${new Date(b.t).toLocaleString()}</button>`).join('') + '</div>';
  box.querySelectorAll('[data-bk]').forEach(btn => btn.onclick = () => {
    const b = list[+btn.dataset.bk];
    try { localStorage.setItem(SAVE_KEY, b.data); } catch (e) { saveMsg('This browser blocked saving.', true); return; }
    SAVE = loadSave();
    SFX.level();
    saveMsg(`Restored the backup from ${new Date(b.t).toLocaleString()} (Lv ${SAVE.level}).`);
  });
}

function buildRelicsTab(root) {
  const owned = RELICS.filter(r => SAVE.relics[r.id]);
  root.innerHTML = `<p class="muted intro">Clear a boss's stage to earn its relic. Replays have a 25% chance to upgrade it to <b>+</b> (double effect); Awakened bosses always upgrade. Equip up to 3. You own ${owned.length} / ${RELICS.length}.</p>`;
  const slots = document.createElement('div'); slots.className = 'relic-slots';
  SAVE.relicSlots.forEach((id, i) => {
    const r = id && RELICS.find(x => x.id === id);
    const d = document.createElement('div');
    d.className = 'relic-slot' + (r ? ' filled' : '');
    d.innerHTML = r ? `<div class="r-icon">${r.icon}</div><div><div class="r-name">${relicName(id)}</div><div class="r-desc">${r.desc(r.v * SAVE.relics[id])}</div></div><button class="gx" title="Unequip">✕</button>` : `<div class="r-empty">Empty relic slot ${i + 1}</div>`;
    if (r) d.querySelector('.gx').onclick = () => { SFX.click(); SAVE.relicSlots[i] = null; saveGame(); buildGrimoire(); };
    slots.appendChild(d);
  });
  root.appendChild(slots);
  const grid = document.createElement('div'); grid.className = 'relics';
  for (const r of RELICS) {
    const lv = SAVE.relics[r.id] || 0, eq = SAVE.relicSlots.includes(r.id), boss = BOSSES[r.boss];
    const el = document.createElement('div');
    el.className = 'relic' + (lv ? '' : ' unknown') + (eq ? ' equipped' : '');
    el.innerHTML = `<div class="r-icon">${lv ? r.icon : '?'}</div><div class="r-body"><div class="r-name">${lv ? relicName(r.id) : '???'}</div><div class="r-desc">${lv ? r.desc(r.v * lv) : `Dropped by ${SAVE.bestiary[r.boss] ? boss.name : 'an unknown boss'}`}</div></div>` +
      (lv ? `<button class="btn small ${eq ? '' : 'primary'}">${eq ? 'Unequip' : 'Equip'}</button>` : '');
    if (lv) el.querySelector('button').onclick = () => {
      SFX.click();
      const k = SAVE.relicSlots.indexOf(r.id);
      if (k >= 0) SAVE.relicSlots[k] = null;
      else {
        const empty = SAVE.relicSlots.indexOf(null);
        if (empty < 0) { toast('All 3 relic slots are full. Unequip one first.', 'fail'); return; }
        SAVE.relicSlots[empty] = r.id;
      }
      saveGame(); buildGrimoire();
    };
    grid.appendChild(el);
  }
  root.appendChild(grid);
}

function handleRebindKey(ev) {
  ev.preventDefault();
  if (ev.code === 'Escape') { REBIND = null; buildSettings(); return; }
  if (ev.code === 'Backspace' || ev.code === 'Delete') { SETTINGS.keys[REBIND.action][REBIND.idx] = ''; rebuildKeymap(); saveSettings(); }
  else setBinding(REBIND.action, REBIND.idx, ev.code);
  REBIND = null; SFX.click(); buildSettings();
}

// ---------------- dialogue ----------------
const DLG = { lines: null, i: 0, chars: 0, timer: null, done: null };
function showDialogue(lines, onDone) {
  DLG.lines = lines; DLG.i = 0; DLG.done = onDone;
  showScreen('dialogue');
  $('dlgHint').textContent = INPUT.touchMode ? 'Tap to continue' : 'Click or press Space to continue';
  typeLine();
}
function typeLine() {
  const [who, text] = DLG.lines[DLG.i];
  $('dlgWho').textContent = who;
  $('dlgWho').className = 'dlg-who ' + who.toLowerCase();
  DLG.chars = 0;
  clearInterval(DLG.timer);
  DLG.timer = setInterval(() => {
    DLG.chars += 2;
    $('dlgText').textContent = text.slice(0, DLG.chars);
    if (DLG.chars >= text.length) { clearInterval(DLG.timer); DLG.timer = null; }
  }, 22);
}
function advanceDialogue() {
  SFX.click();
  if (DLG.timer) { clearInterval(DLG.timer); DLG.timer = null; $('dlgText').textContent = DLG.lines[DLG.i][1]; return; }
  DLG.i++;
  if (DLG.i >= DLG.lines.length) endDialogue(); else typeLine();
}
function endDialogue() {
  clearInterval(DLG.timer); DLG.timer = null;
  const cb = DLG.done; DLG.done = null;
  if (cb) cb();
}

// ---------------- world map ----------------
const stageUnlocked = i => i === 0 || !!SAVE.cleared[i - 1];
const regionUnlocked = r => stageUnlocked(REGIONS[r].from);
let selectedRegion = null;
function buildMap() {
  $('mapLvl').textContent = SAVE.level + (SAVE.level >= LEVEL_CAP ? ' (max)' : '');
  $('mapXp').style.width = (SAVE.level >= LEVEL_CAP ? 100 : 100 * SAVE.exp / PLAYER.expNext(SAVE.level)) + '%';
  $('mapStones').textContent = SAVE.stones;
  let es = $('mapEssence');
  if (!es) { es = document.createElement('div'); es.id = 'mapEssence'; es.className = 'tb-stones essence'; es.title = 'Abyss Essence: used to awaken cards'; $('mapStones').parentNode.after(es); }
  es.innerHTML = `✧ <b>${SAVE.essence}</b>`;
  const mb = $('mapMode'); mb.textContent = MODES[SAVE.mode].name; mb.classList.toggle('hell', SAVE.mode === 'hell');
  if (selectedRegion === null) selectedRegion = [2, 1, 0].find(regionUnlocked);
  if (selectedStage === 'daily' && !SAVE.cleared[0]) selectedStage = 0;
  if (typeof selectedStage === 'number' && STAGES[selectedStage] && STAGES[selectedStage].region !== selectedRegion) selectedStage = REGIONS[selectedRegion].from;
  // region + mode tabs
  const bar = $('regionBar'); bar.innerHTML = '';
  REGIONS.forEach((rg, r) => {
    const b = document.createElement('button');
    const open = regionUnlocked(r);
    const done = SAVE.cleared.slice(rg.from, rg.to + 1).filter(Boolean).length;
    b.className = 'rtab' + (r === selectedRegion ? ' active' : '') + (open ? '' : ' locked');
    b.innerHTML = `<span class="rt-act">${rg.act}</span>${open ? rg.name : '🔒 ' + rg.name}<span class="rt-prog">${done}/${rg.to - rg.from + 1}</span>`;
    b.onclick = () => { if (!open) { toast(`Clear ${STAGES[rg.from - 1].name} to open ${rg.act}`, 'fail'); return; } SFX.click(); selectedRegion = r; selectedStage = rg.from; buildMap(); };
    bar.appendChild(b);
  });
  const sp = sanctumPending();
  ensureQuests();
  for (const [key, label, open] of [['tower', '♜ Abyss Tower', towerUnlocked()], ['rush', '⚔ Boss Rush', rushUnlocked()], ['daily', '☀ Daily Trial' + (dailyInfo().done ? ' ✓' : ''), !!SAVE.cleared[0]], ['sanctum', '⌂ Sanctum' + (sp.stones >= 10 ? ` ◆${sp.stones}` : ''), true], ['quests', '📜 Quests' + (questsReady() ? ` (${questsReady()})` : ''), true], ['worldboss', '☠ World Boss', !!SAVE.cleared[7]]]) {
    const b = document.createElement('button');
    b.className = 'rtab mode' + (selectedStage === key ? ' active' : '') + (open ? '' : ' locked');
    b.dataset.mode = key;
    b.textContent = label;
    b.onclick = () => { SFX.click(); selectStage(key); };
    bar.appendChild(b);
  }
  bar.insertAdjacentHTML('beforeend', tierSelectorHTML());
  bindTier(bar);
  // nodes for the selected region
  const rg = REGIONS[selectedRegion], map = $('map');
  map.className = 'map r' + selectedRegion;
  map.querySelectorAll('.node').forEach(n => n.remove());
  let d = '', d2 = '';
  for (let i = rg.from; i <= rg.to; i++) {
    const s = STAGES[i], seg = (i === rg.from ? 'M ' : ' L ') + s.map[0] + ' ' + s.map[1];
    d += seg; if (stageUnlocked(i)) d2 += seg;
  }
  $('mapLines').innerHTML =
    `<path d="${d}" stroke="rgba(167,123,255,0.25)" stroke-dasharray="4 4" style="stroke-width:2px"/>` +
    `<path d="${d2}" stroke="#ffd66b" style="stroke-width:3px;filter:drop-shadow(0 0 6px #ffd66b)"/>`;
  for (let i = rg.from; i <= rg.to; i++) {
    const s = STAGES[i], unlocked = stageUnlocked(i), final = BOSSES[s.boss].final;
    const n = document.createElement('button');
    n.className = 'node' + (unlocked ? '' : ' locked') + (unlocked && !SAVE.cleared[i] ? ' next' : '') + (i === selectedStage ? ' selected' : '') + (final ? ' final' : '');
    n.dataset.i = i;
    n.style.left = s.map[0] + '%'; n.style.top = s.map[1] + '%';
    n.style.setProperty('--c', s.theme.accent);
    n.innerHTML = `${i + 1}${SAVE.cleared[i] ? '<span class="check">✓</span>' : ''}<span class="node-label">${s.name}<span class="node-stars">${unlocked ? stars(SAVE.stars[i]) : ''}</span></span>`;
    n.onclick = () => { SFX.click(); selectStage(i); };
    map.appendChild(n);
  }
  if (typeof selectedStage === 'number' && !stageUnlocked(selectedStage)) selectedStage = rg.from;
  renderStageInfo();
}
function selectStage(i) {
  selectedStage = i;
  document.querySelectorAll('.node').forEach(n => n.classList.toggle('selected', +n.dataset.i === i));
  document.querySelectorAll('.rtab.mode').forEach(b => b.classList.toggle('active', b.dataset.mode === i));
  renderStageInfo();
}
// companion + trials + loadout pickers, shared by every mode panel
function prepHTML(withTrials) {
  const comps = Object.keys(COMPANIONS).map(id => {
    const c = COMPANIONS[id], open = compUnlocked(id);
    return `<button class="pick ${SAVE.companion === id ? 'on' : ''} ${open ? '' : 'locked'}" data-comp="${id}" title="${open ? c.desc : c.unlock}" style="--c:${c.color}">${open ? c.name : '🔒'}<small>${c.title}</small></button>`;
  }).join('');
  const anyComp = Object.keys(COMPANIONS).some(compUnlocked);
  const trials = CURSES.map(c => `<button class="pick curse ${SAVE.curses.includes(c.id) ? 'on' : ''}" data-curse="${c.id}" title="${c.desc}">${c.name}<small>+${Math.round(c.bonus * 100)}%</small></button>`).join('');
  const mult = 1 + CURSES.filter(c => SAVE.curses.includes(c.id)).reduce((a, c) => a + c.bonus, 0);
  return `
    <div class="prep">
      <div class="prep-h">Loadout</div>
      <div class="picks">${loadoutButtons()}</div>
      ${anyComp ? `<div class="prep-h">Companion</div><div class="picks">${comps}<button class="pick ${!SAVE.companion ? 'on' : ''}" data-comp="">None</button></div>` : ''}
      ${withTrials ? `<div class="prep-h">Hell Trials <span class="muted">pick up to 3 · rewards ×${mult.toFixed(1)}</span></div><div class="picks">${trials}</div>` : ''}
    </div>`;
}
function bindPrep(root) {
  root.querySelectorAll('[data-load]').forEach(b => b.onclick = () => { SFX.click(); switchLoadout(+b.dataset.load); renderStageInfo(); });
  root.querySelectorAll('[data-comp]').forEach(b => b.onclick = () => {
    const id = b.dataset.comp;
    if (id && !compUnlocked(id)) { toast(COMPANIONS[id].unlock, 'fail'); return; }
    SFX.click(); SAVE.companion = id || null; saveGame(); renderStageInfo();
  });
  root.querySelectorAll('[data-curse]').forEach(b => b.onclick = () => {
    const id = b.dataset.curse, k = SAVE.curses.indexOf(id);
    if (k >= 0) SAVE.curses.splice(k, 1);
    else if (SAVE.curses.length < 3) SAVE.curses.push(id);
    else { toast('You can pick up to 3 trials', 'fail'); return; }
    SFX.click(); saveGame(); renderStageInfo();
  });
}
function renderStageInfo() {
  if (selectedStage === 'tower') { renderTowerInfo(); return; }
  if (selectedStage === 'rush') { renderRushInfo(); return; }
  if (selectedStage === 'daily') { renderDailyInfo(); return; }
  if (selectedStage === 'sanctum') { renderSanctumInfo(); return; }
  if (selectedStage === 'quests') { renderQuestsInfo(); return; }
  if (selectedStage === 'worldboss') { renderWorldBossInfo(); return; }
  const i = selectedStage, s = STAGES[i], unlocked = stageUnlocked(i), b = BOSSES[s.boss];
  const enemyNames = Object.keys(s.enemies).map(k => `<span class="chip">${ENEMIES[k].name}</span>`).join('');
  const recOk = SAVE.level >= s.rec;
  const st = SAVE.stars[i];
  const chRows = [['Clear the stage', st[0]], [challengeText(s.ch[0]), st[1]], [challengeText(s.ch[1]), st[2]]]
    .map(([txt_, ok]) => `<div class="ch-row ${ok ? 'done' : ''}"><span class="star ${ok ? 'on' : ''}">★</span>${txt_}</div>`).join('');
  const relic = RELIC_BY_BOSS[b.base || s.boss], have = relic ? SAVE.relics[relic.id] || 0 : 0;
  const relicLine = relic ? `<div class="info-row"><span>Relic</span><span class="relic-tag">${relic.icon} ${relic.name}${have === 2 ? ' + ✓' : have ? ' ✓ (25% for +)' : ''}</span></div>` : '';
  $('stageInfo').innerHTML = `
    <div class="muted" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase">${REGIONS[s.region].act} · Stage ${i + 1}</div>
    <h3 style="color:${s.theme.accent};text-shadow:0 0 14px ${s.theme.accent}">${s.name}</h3>
    <p class="blurb">${s.blurb}</p>
    <div class="info-row"><span>Boss</span><span style="color:#ff8095;font-weight:800">${b.name}</span></div>
    <div class="info-row"><span>Recommended level</span><span class="${recOk ? '' : 'warn-text'}">Lv ${s.rec}${recOk ? '' : ' (you are Lv ' + SAVE.level + ')'}</span></div>
    <div class="info-row"><span>Best clear</span><span>${SAVE.best[i] ? fmtTime(SAVE.best[i]) : '—'}</span></div>
    ${relicLine}
    ${s.region > 0 ? `<div class="info-row"><span>Abyss Essence</span><span>✧ ${BOSSES[s.boss].final ? 2 : 1} per boss kill</span></div>` : ''}
    <div class="ch-box"><div class="ch-head">Challenges <span class="muted">◆ ${starReward(i)} per new star</span></div>${chRows}</div>
    <div class="enemy-chips">${enemyNames}</div>
    ${unlocked ? prepHTML(true) : ''}
    <button class="btn primary" id="btnEnter" ${unlocked ? '' : 'disabled'}>${unlocked ? (SAVE.cleared[i] ? 'Replay Stage' : 'Enter Stage') : 'Locked: clear the previous stage'}</button>`;
  bindPrep($('stageInfo'));
  const btn = $('btnEnter');
  if (btn && unlocked) btn.onclick = () => { SFX.click(); enterStage(i); };
}
function renderTowerInfo() {
  const open = towerUnlocked();
  $('stageInfo').innerHTML = `
    <div class="muted" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase">Endless</div>
    <h3 style="color:#d48bff;text-shadow:0 0 14px #b06bff">Abyss Tower</h3>
    <p class="blurb">An endless climb. Each floor is a 40-second wave, and every 5th floor is a boss. Floors keep getting harder. Earn ◆ for every floor you clear; boss floors from floor 20 drop Abyss Essence.</p>
    <div class="info-row"><span>Best floor reached</span><span>${SAVE.towerBest || '—'}</span></div>
    <div class="info-row"><span>Floor reward</span><span>◆ 3 × floor number</span></div>
    ${open ? prepHTML(false) : ''}
    <button class="btn primary" id="btnEnter" ${open ? '' : 'disabled'}>${open ? 'Climb the Tower' : 'Locked: clear Crystal Caverns (Stage 3)'}</button>`;
  bindPrep($('stageInfo'));
  if (open) $('btnEnter').onclick = () => { SFX.click(); enterTower(); };
}
function renderRushInfo() {
  const open = rushUnlocked(), list = open ? rushBosses() : [];
  const best = SAVE.rushBest;
  $('stageInfo').innerHTML = `
    <div class="muted" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase">Challenge</div>
    <h3 style="color:#ff6b85;text-shadow:0 0 14px #ff3355">Boss Rush</h3>
    <p class="blurb">Fight every boss you have defeated, back to back, with no waves in between. You heal 30% after each boss. Every boss defeated pays stones, and Act II/III bosses drop Abyss Essence.</p>
    <div class="info-row"><span>Bosses in the rush</span><span>${list.length}</span></div>
    <div class="info-row"><span>Best run</span><span>${best ? `${best.n} bosses · ${fmtTime(best.time)}` : '—'}</span></div>
    ${open ? prepHTML(false) : ''}
    <button class="btn primary" id="btnEnter" ${open ? '' : 'disabled'}>${open ? 'Start Boss Rush' : 'Locked: clear Abyssal Throne (Stage 8)'}</button>`;
  bindPrep($('stageInfo'));
  if (open) $('btnEnter').onclick = () => { SFX.click(); enterRush(); };
}

// ---------------- v4 panels: daily, sanctum, tiers, synergies, records, wardrobe ----------------
function tierSelectorHTML() {
  if (!SAVE.tierMax) return '';
  const t = Math.min(SAVE.tier || 0, SAVE.tierMax);
  return `<div class="tier-sel" title="Hell Tier: enemies +25% HP and damage per tier, rewards up to ×10 at tier 20, and stages get shorter. Clear Throne of the Fallen on your highest tier to unlock the next.">
    <span class="tier-l">Hell Tier</span><button class="tbtn" data-tier="-1" ${t <= 0 ? 'disabled' : ''}>◂</button><b class="tier-n">${t}</b><button class="tbtn" data-tier="1" ${t >= SAVE.tierMax ? 'disabled' : ''}>▸</button>
    <span class="tier-d">${t ? `enemies +${t * 25}% · rewards ×${tierReward(t).toFixed(1)} · stage time ${Math.round(100 / (1 + 0.1 * t))}%` : 'normal difficulty'}</span></div>`;
}
function bindTier(root) {
  root.querySelectorAll('[data-tier]').forEach(b => b.onclick = () => {
    SFX.click();
    SAVE.tier = clamp((SAVE.tier || 0) + +b.dataset.tier, 0, SAVE.tierMax);
    saveGame(); buildMap();
  });
}
function synergyHTML(hotbar) {
  const on = activeSynergies(hotbar);
  return `<div class="syn-row"><span class="syn-h">Synergies</span>${Object.keys(SYNERGIES).map(k => `<span class="syn ${on.includes(k) ? 'on' : ''}" style="--c:${RANK_BY_ID[k].color}" title="${SYNERGIES[k].desc} (equip 2 ${RANK_BY_ID[k].name} cards)">${SYNERGIES[k].name}</span>`).join('')}</div>`;
}
function renderDailyInfo() {
  const d = dailyInfo(), s = STAGES[d.stage];
  const curses = d.curses.map(id => CURSES.find(c => c.id === id));
  $('stageInfo').innerHTML = `
    <div class="muted" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase">Daily Trial · ${new Date().toLocaleDateString()}</div>
    <h3 style="color:#ffd66b;text-shadow:0 0 14px #ffb347">${s.name}</h3>
    <p class="blurb">A new trial every day: a stage you have cleared, with two fixed curses. Clear it once today to open the reward chest. You can retry as often as you like.</p>
    <div class="info-row"><span>Curses</span><span>${curses.map(c => c.name).join(' + ')}</span></div>
    <div class="info-row"><span>Chest</span><span>${d.done ? '<span class="muted">claimed today ✓</span>' : `◆ ${d.stones}${d.essence ? ` · ✧ ${d.essence}` : ''}`}</span></div>
    <div class="info-row"><span>Trials completed</span><span>${SAVE.counters.dailies || 0}</span></div>
    <div class="enemy-chips">${curses.map(c => `<span class="chip">${c.name}: ${c.desc}</span>`).join('')}</div>
    ${prepHTML(false)}
    <button class="btn primary" id="btnEnter">${d.done ? 'Replay Daily Trial' : 'Start Daily Trial'}</button>`;
  bindPrep($('stageInfo'));
  $('btnEnter').onclick = () => { SFX.click(); enterDaily(); };
}
function enterDaily() {
  SFX.init();
  const d = dailyInfo();
  startStage(d.stage, 'daily');
  buildHUD();
  showScreen('play');
  banner('Daily Trial: ' + STAGES[d.stage].name, 'boss');
  MUSIC.play(musicKey(d.stage));
}
function renderSanctumInfo() {
  const p = sanctumPending(), r = sanctumRate(), full = p.hours >= SANCTUM_CAP_H;
  const slots = SAVE.sanctum.cards.map((id, i) => `<button class="sanc-slot" data-sanc="${i}">${id ? `<canvas width="72" height="72" data-icon="${id}"></canvas><span>${CARDS[id].name}</span>` : '<span class="muted">Empty</span>'}</button>`).join('');
  const options = CARD_IDS.filter(cardUnlocked).map(id => `<option value="${id}">${CARDS[id].name} (Lv ${SAVE.cards[id].lv})</option>`).join('');
  $('stageInfo').innerHTML = `
    <div class="muted" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase">Idle rewards</div>
    <h3 style="color:#9dff7a;text-shadow:0 0 14px #4dffa6">Summoner's Sanctum</h3>
    <p class="blurb">Assign up to 3 cards. While you're away, they gather magic stones${SAVE.cleared[8] ? ' and Abyss Essence' : ''}, up to ${SANCTUM_CAP_H} hours' worth. Higher level, enhanced and awakened cards gather more.</p>
    <div class="sanc-slots">${slots}</div>
    <div class="sanc-pick"><select id="sancSel">${options}</select><span class="muted">Click a slot to place the selected card, or to clear it.</span></div>
    <div class="info-row"><span>Gathering rate</span><span>◆ ${Math.round(r.stones)}/h${r.essence ? ` · ✧ ${r.essence.toFixed(2)}/h` : ''}</span></div>
    <div class="info-row"><span>Time gathered</span><span class="${full ? 'warn-text' : ''}">${p.hours.toFixed(1)}h / ${SANCTUM_CAP_H}h${full ? ' (full, collect!)' : ''}</span></div>
    <div class="info-row"><span>Ready to collect</span><span>◆ ${p.stones}${p.essence ? ` · ✧ ${p.essence}` : ''}</span></div>
    <button class="btn primary" id="btnCollect" ${p.stones + p.essence > 0 ? '' : 'disabled'}>Collect</button>`;
  $('stageInfo').querySelectorAll('canvas[data-icon]').forEach(cv => renderCardIcon(cv, cv.dataset.icon));
  $('stageInfo').querySelectorAll('[data-sanc]').forEach(b => b.onclick = () => {
    SFX.click();
    collectSanctum();
    const i = +b.dataset.sanc, id = $('sancSel').value;
    SAVE.sanctum.cards[i] = SAVE.sanctum.cards[i] === id || !id ? null : (SAVE.sanctum.cards.includes(id) ? SAVE.sanctum.cards[i] : id);
    saveGame(); buildMap();
  });
  $('btnCollect').onclick = () => {
    const got = collectSanctum();
    SFX.stone(); SFX.level();
    toast(`Collected ◆ ${got.stones}${got.essence ? ` and ✧ ${got.essence}` : ''} from the Sanctum`, 'ach');
    buildMap();
  };
}
function buildRecords(root) {
  const st = SAVE.stats, c = SAVE.counters;
  const hrs = (st.playTime || 0) / 3600;
  const tiles = [
    ['Time played', hrs >= 1 ? `${hrs.toFixed(1)}h` : `${Math.round((st.playTime || 0) / 60)}m`], ['Enemies slain', st.kills.toLocaleString()],
    ['Bosses defeated', c.bosses], ['Runs', st.runs], ['Deaths', st.deaths], ['Special skills used', c.skills],
    ['Overdrives', c.overdrives || 0], ['Treasure Goblins', c.goblins || 0], ['Stars', `${starCount()} / ${STAGES.length * 3}`],
    ['Tower best', SAVE.towerBest ? 'Floor ' + SAVE.towerBest : '—'], ['Boss Rush best', SAVE.rushBest ? `${SAVE.rushBest.n} bosses` : '—'], ['Hell Tier', SAVE.tierMax || 0],
  ];
  root.innerHTML = `<div class="rec-tiles">${tiles.map(([k, v]) => `<div class="res-item"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}</div>`;
  const rows = CARD_IDS.filter(id => SAVE.cardStats[id] || SAVE.counters.summoned[id])
    .map(id => ({ id, k: (SAVE.cardStats[id] || {}).kills || 0, d: (SAVE.cardStats[id] || {}).dmg || 0, s: SAVE.counters.summoned[id] || 0 }))
    .sort((a, b) => b.d - a.d);
  root.innerHTML += `<h3 class="codex-h">Summons</h3><div class="tbl-wrap"><table class="rec-tbl"><thead><tr><th>Card</th><th>Summoned</th><th>Kills</th><th>Damage</th></tr></thead><tbody>${
    rows.map(r => `<tr><td>${CARDS[r.id].name}</td><td>${r.s.toLocaleString()}</td><td>${r.k.toLocaleString()}</td><td>${Math.round(r.d).toLocaleString()}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Play a stage to start recording.</td></tr>'}</tbody></table></div>`;
  root.innerHTML += `<h3 class="codex-h">Best clear times</h3><div class="tbl-wrap"><table class="rec-tbl"><thead><tr><th>Stage</th><th>Best</th><th>Stars</th></tr></thead><tbody>${
    STAGES.map((s, i) => SAVE.best[i] ? `<tr><td>${i + 1}. ${s.name}</td><td>${fmtTime(SAVE.best[i])}</td><td>${stars(SAVE.stars[i])}</td></tr>` : '').join('') || '<tr><td colspan="3" class="muted">No clears yet.</td></tr>'}</tbody></table></div>`;
  root.innerHTML += `<h3 class="codex-h">Recent runs</h3><div class="tbl-wrap"><table class="rec-tbl"><thead><tr><th>When</th><th>Run</th><th>Result</th><th>Time</th><th>Kills</th><th>◆</th></tr></thead><tbody>${
    SAVE.history.map(h => `<tr><td>${new Date(h.t).toLocaleString()}</td><td>${h.name}${h.tier ? ` <span class="muted">(T${h.tier})</span>` : ''}</td><td class="${h.won ? 'ok' : 'bad'}">${h.won ? 'Won' : h.retreat ? 'Retreated' : 'Lost'}</td><td>${fmtTime(h.time)}</td><td>${h.kills}</td><td>${h.stones}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No runs yet.</td></tr>'}</tbody></table></div>`;
}
function buildWardrobe(root) {
  root.innerHTML = '<p class="muted intro">Cosmetics never change your stats. Unlock them through achievements, stars and Hell Tiers.</p><h3 class="codex-h">Allen\'s outfit</h3>';
  const g1 = document.createElement('div'); g1.className = 'wardrobe';
  for (const o of OUTFITS) {
    const ok = o.ok(), on = SAVE.cosmetics.outfit === o.id;
    const el = document.createElement('button');
    el.className = 'ward' + (ok ? '' : ' locked') + (on ? ' on' : '');
    el.innerHTML = `<canvas width="96" height="96"></canvas><div class="w-name">${o.name}</div><div class="w-req">${on ? 'Equipped' : ok ? 'Click to wear' : '🔒 ' + o.req}</div>`;
    const prev = SAVE.cosmetics.outfit; SAVE.cosmetics.outfit = o.id; renderPortrait(el.querySelector('canvas')); SAVE.cosmetics.outfit = prev;
    el.onclick = () => { if (!ok) { toast(o.req, 'fail'); return; } SFX.click(); SAVE.cosmetics.outfit = o.id; saveGame(); buildCodex(); };
    g1.appendChild(el);
  }
  root.appendChild(g1);
  root.insertAdjacentHTML('beforeend', '<h3 class="codex-h">Summoning circles</h3>');
  const g2 = document.createElement('div'); g2.className = 'wardrobe';
  for (const ci of CIRCLES) {
    const ok = ci.ok(), on = SAVE.cosmetics.circle === ci.id;
    const el = document.createElement('button');
    el.className = 'ward' + (ok ? '' : ' locked') + (on ? ' on' : '');
    el.innerHTML = `<canvas width="96" height="96"></canvas><div class="w-name">${ci.name}</div><div class="w-req">${on ? 'Equipped' : ok ? 'Click to use' : '🔒 ' + ci.req}</div>`;
    const cv = el.querySelector('canvas'), c2 = cv.getContext('2d');
    const col = ci.color === 'prism' ? '#ff4d6d' : ci.color || '#9cff57';
    c2.save(); c2.translate(48, 48); c2.scale(1, 0.6); drawMagicCircle(c2, 0, 0, 38, 0.4, col, 1); if (ci.color === 'prism') drawMagicCircle(c2, 0, 0, 26, -0.6, '#5ab8ff', 1); c2.restore();
    el.onclick = () => { if (!ok) { toast(ci.req, 'fail'); return; } SFX.click(); SAVE.cosmetics.circle = ci.id; saveGame(); buildCodex(); };
    g2.appendChild(el);
  }
  root.appendChild(g2);
}

// ---------------- v5 panels: card filters, equipment, quests, world boss ----------------
const GF = { rank: 'all', q: '', owned: false, fuse: 'all' };
function cardMatches(id) {
  const c = CARDS[id], q = GF.q.trim().toLowerCase();
  if (GF.owned && !cardUnlocked(id)) return false;
  if (GF.rank === 'equipped') { if (!SAVE.hotbar.includes(id)) return false; }
  else if (GF.rank !== 'all' && c.rank !== GF.rank) return false;
  if (q && !(c.name.toLowerCase().includes(q) || (c.role || '').toLowerCase().includes(q) || (cardUnlocked(id) && c.desc.toLowerCase().includes(q)))) return false;
  return true;
}
function filterBarHTML(chips, key, extra) {
  return `<div class="filter-bar">${chips.map(([v, label, col]) => `<button class="fchip ${GF[key] === v ? 'on' : ''}" data-f="${v}" ${col ? `style="--c:${col}"` : ''}>${label}</button>`).join('')}
    <input type="search" id="cardSearch" placeholder="Search cards…" value="${GF.q.replace(/"/g, '&quot;')}" aria-label="Search cards">${extra || ''}</div>`;
}
function bindFilterBar(root, key, rerender) {
  root.querySelectorAll('.fchip').forEach(b => b.onclick = () => { SFX.click(); GF[key] = b.dataset.f; root.querySelectorAll('.fchip').forEach(x => x.classList.toggle('on', x === b)); rerender(); });
  const s = root.querySelector('#cardSearch');
  if (s) s.oninput = () => { GF.q = s.value; rerender(); };
  const o = root.querySelector('#ownedOnly');
  if (o) o.onchange = () => { GF.owned = o.checked; rerender(); };
}
function buildCardsTab(root) {
  const chips = [['all', 'All'], ['equipped', 'Equipped'], ...RANKS.map(r => [r.id, `${r.grade} ${r.name}`, r.color]), ['fusion', 'S Fusion', FUSION_RANK.color]];
  const owned = CARD_IDS.filter(cardUnlocked).length;
  root.innerHTML = filterBarHTML(chips, 'rank', `<label class="owned-t"><input type="checkbox" id="ownedOnly" ${GF.owned ? 'checked' : ''}> Unlocked only</label><span class="muted count">${owned} / ${CARD_IDS.length} unlocked</span>`) + '<div id="cardList"></div>';
  const render = () => {
    const list = $('cardList'); list.innerHTML = '';
    let shown = 0;
    for (const rk of [...RANKS, FUSION_RANK]) {
      const ids = CARD_IDS.filter(k => CARDS[k].rank === rk.id && cardMatches(k) && (rk.id !== 'fusion' || cardUnlocked(k) || GF.rank === 'fusion'));
      if (!ids.length) continue;
      shown += ids.length;
      const unlocked = rk.id === 'fusion' || SAVE.level >= rk.level;
      const sec = document.createElement('div');
      sec.className = 'rank-sec'; sec.style.setProperty('--c', rk.color);
      sec.innerHTML = `<div class="rank-head"><span class="grade">${rk.grade}</span><span class="rname">${rk.name}</span><span class="rlock">${rk.id === 'fusion' ? `${Object.keys(SAVE.fused).length} / ${FUSION_COUNT} discovered` : unlocked ? `${ids.length} card${ids.length > 1 ? 's' : ''}` : '🔒 Unlocks at summoner Lv ' + rk.level}</span></div>`;
      const grid = document.createElement('div'); grid.className = 'cards';
      for (const id of ids) grid.appendChild(cardEl(id));
      sec.appendChild(grid); list.appendChild(sec);
    }
    if (!shown) list.innerHTML = '<p class="muted intro">No cards match. Try another filter or search.</p>';
  };
  bindFilterBar(root, 'rank', render);
  render();
}
function buildFusionTab(root) {
  const fusions = CARD_IDS.filter(k => CARDS[k].fusion);
  const ready = fusions.filter(id => fuseStatus(id).ok).length;
  root.innerHTML = `<p class="muted intro">Fuse two cards that are both <b>Lv ${FUSE_LV}+</b> to discover a new creature. The original cards are kept. ${Object.keys(SAVE.fused).length} / ${fusions.length} discovered${ready ? ` · <b class="ready-n">${ready} ready to fuse</b>` : ''}.</p>` +
    filterBarHTML([['all', 'All'], ['ready', 'Ready to fuse'], ['missing', 'Not discovered'], ['found', 'Discovered']], 'fuse') + '<div class="fusions" id="fusionList"></div>';
  const render = () => {
    const grid = $('fusionList'); grid.innerHTML = '';
    const q = GF.q.trim().toLowerCase();
    const rows = fusions.filter(id => {
      const c = CARDS[id], st = fuseStatus(id), found = !!SAVE.fused[id];
      if (GF.fuse === 'ready' && !st.ok) return false;
      if (GF.fuse === 'missing' && found) return false;
      if (GF.fuse === 'found' && !found) return false;
      if (q && !(c.fusion.some(f => CARDS[f].name.toLowerCase().includes(q)) || (found && c.name.toLowerCase().includes(q)))) return false;
      return true;
    }).sort((a, b) => (fuseStatus(b).ok - fuseStatus(a).ok) || (!!SAVE.fused[a] - !!SAVE.fused[b]));
    for (const id of rows) {
      const c = CARDS[id], st = fuseStatus(id), found = !!SAVE.fused[id];
      const el = document.createElement('div');
      el.className = 'fusion' + (found ? ' found' : '') + (st.ok ? ' ready' : '');
      el.innerHTML = `
        <div class="recipe">
          <div class="ing"><canvas width="96" height="96"></canvas><span>${cardUnlocked(c.fusion[0]) ? CARDS[c.fusion[0]].name : '???'}<br><small>Lv ${SAVE.cards[c.fusion[0]].lv}/${FUSE_LV}</small></span></div>
          <div class="plus">+</div>
          <div class="ing"><canvas width="96" height="96"></canvas><span>${cardUnlocked(c.fusion[1]) ? CARDS[c.fusion[1]].name : '???'}<br><small>Lv ${SAVE.cards[c.fusion[1]].lv}/${FUSE_LV}</small></span></div>
          <div class="plus">→</div>
          <div class="ing result"><canvas width="120" height="120"></canvas><span>${found ? c.name : '???'}<br><small>${c.role}</small></span></div>
        </div>
        <div class="fdesc">${found ? c.desc : 'An unknown creature waits in the grimoire.'}</div>
        <button class="btn small ${st.ok ? 'primary' : ''}" ${st.ok ? '' : 'disabled'}>${found ? 'Discovered ✓' : st.ok ? `Fuse ◆ ${c.fuseCost}` : st.why}</button>`;
      const cvs = el.querySelectorAll('canvas');
      renderCardIcon(cvs[0], c.fusion[0], !cardUnlocked(c.fusion[0]));
      renderCardIcon(cvs[1], c.fusion[1], !cardUnlocked(c.fusion[1]));
      renderCardIcon(cvs[2], id, !found);
      el.querySelector('button').onclick = () => {
        if (!doFuse(id)) return;
        SFX.fuse();
        toast(`Fusion discovered: ${c.name}!`, 'ach');
        buildGrimoire();
      };
      grid.appendChild(el);
    }
    if (!rows.length) grid.innerHTML = '<p class="muted intro">No fusions match this filter.</p>';
  };
  bindFilterBar(root, 'fuse', render);
  render();
}
function matsHTML() {
  return `<div class="mats">${Object.keys(MATS).map(k => `<span class="mat" style="--c:${MATS[k].color}" title="${MATS[k].name}: dropped by ${MATS[k].from}">${MATS[k].icon} ${MATS[k].name} <b>${SAVE.mats[k] || 0}</b></span>`).join('')}</div>`;
}
function buildEquipTab(root) {
  root.innerHTML = `<p class="muted intro">Craft gear for Allen from boss materials, then upgrade it up to +${EQUIP_MAX}. One item per slot is equipped.</p>${matsHTML()}`;
  for (const slot of ['staff', 'robe', 'ring']) {
    const sec = document.createElement('div'); sec.className = 'equip-sec';
    sec.innerHTML = `<h3 class="codex-h">${slot === 'staff' ? 'Staff' : slot === 'robe' ? 'Robe' : 'Ring'}</h3>`;
    const grid = document.createElement('div'); grid.className = 'equips';
    for (const it of EQUIP.filter(x => x.slot === slot)) {
      const lv = SAVE.equip.owned[it.id] || 0, eq = SAVE.equip.slots[slot] === it.id;
      const stats = itemStats(it, Math.max(1, lv)), next = lv && lv < EQUIP_MAX ? itemStats(it, lv + 1) : null;
      const cost = lv ? upgradeCost(it, lv) : null, m = MATS[it.mat];
      const canCraft = !lv && SAVE.stones >= it.craft && (SAVE.mats[it.mat] || 0) >= craftMats(it);
      const canUp = lv && lv < EQUIP_MAX && SAVE.stones >= cost.stones && (SAVE.mats[it.mat] || 0) >= cost.mats;
      const el = document.createElement('div');
      el.className = 'equip' + (lv ? '' : ' unowned') + (eq ? ' equipped' : '');
      el.innerHTML = `
        <div class="e-icon" style="--c:${m.color}">${it.icon}</div>
        <div class="e-body">
          <div class="e-name">${it.name}${lv ? ` <span class="e-lv">+${lv}</span>` : ''}${eq ? ' <span class="e-eq">Equipped</span>' : ''}</div>
          <div class="e-stats">${Object.keys(stats).map(k => `<div>${STAT_TEXT[k](stats[k])}${next ? ` <span class="muted">→ ${STAT_TEXT[k](next[k])}</span>` : ''}</div>`).join('')}</div>
        </div>
        <div class="e-acts">
          ${!lv ? `<button class="btn small ${canCraft ? 'primary' : ''}" data-act="craft" ${canCraft ? '' : 'disabled'}>Craft ◆${it.craft} · ${m.icon}${craftMats(it)}</button>` : ''}
          ${lv && !eq ? '<button class="btn small" data-act="equip">Equip</button>' : ''}
          ${lv && lv < EQUIP_MAX ? `<button class="btn small ${canUp ? 'primary' : ''}" data-act="up" ${canUp ? '' : 'disabled'}>Upgrade ◆${cost.stones} · ${m.icon}${cost.mats}</button>` : ''}
          ${lv >= EQUIP_MAX ? '<span class="muted">Max level</span>' : ''}
        </div>`;
      const on = (act, fn) => { const b = el.querySelector(`[data-act=${act}]`); if (b) b.onclick = fn; };
      on('craft', () => { if (craftItem(it.id)) { SFX.unlock(); toast(`Crafted ${it.name}!`, 'ach'); checkAch(); buildGrimoire(); } });
      on('equip', () => { SFX.click(); SAVE.equip.slots[slot] = it.id; saveGame(); checkAch(); buildGrimoire(); });
      on('up', () => { if (upgradeItem(it.id)) { SFX.level(); checkAch(); buildGrimoire(); } });
      grid.appendChild(el);
    }
    sec.appendChild(grid); root.appendChild(sec);
  }
}
function timeLeft(ms) { const h = Math.floor(ms / 3.6e6), m = Math.floor((ms % 3.6e6) / 6e4); return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${m}m`; }
function renderQuestsInfo() {
  ensureQuests();
  const now = new Date(), endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  const weekEnd = Date.UTC(2026, 0, 5) + (Math.floor((Date.now() - Date.UTC(2026, 0, 5)) / 604800000) + 1) * 604800000 - Date.now();
  const qHTML = (q, i, kind) => {
    const pr = questProgress(q), done = pr >= q.n, qt = QUEST_TYPES[q.type];
    const r = q.reward, m = MATS[r.mat];
    return `<div class="quest ${q.claimed ? 'claimed' : done ? 'done' : ''}">
      <div class="q-text">${qt.text(q.n, q.param)}</div>
      <div class="q-bar"><div style="width:${(100 * pr / q.n).toFixed(1)}%"></div></div>
      <div class="q-foot"><span class="muted">${pr.toLocaleString()} / ${q.n.toLocaleString()}</span><span class="q-rew">◆${r.stones}${r.essence ? ` ✧${r.essence}` : ''} ${m.icon}${r.mats}</span>
      ${q.claimed ? '<span class="muted">Claimed ✓</span>' : `<button class="btn small ${done ? 'primary' : ''}" data-q="${kind}:${i}" ${done ? '' : 'disabled'}>Claim</button>`}</div></div>`;
  };
  $('stageInfo').innerHTML = `
    <div class="muted" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase">Bounties</div>
    <h3 style="color:#ffcf9a;text-shadow:0 0 14px #ff9a3a">Quest Board</h3>
    <p class="blurb">Quests track everything you do in any mode. Claim the rewards here.</p>
    <div class="prep-h">Daily <span class="muted">· resets in ${timeLeft(endOfDay)}</span></div>
    ${SAVE.quests.daily.map((q, i) => qHTML(q, i, 'daily')).join('')}
    <div class="prep-h">Weekly <span class="muted">· resets in ${timeLeft(weekEnd)}</span></div>
    ${SAVE.quests.weekly.map((q, i) => qHTML(q, i, 'weekly')).join('')}`;
  $('stageInfo').querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
    const [kind, i] = b.dataset.q.split(':'), q = SAVE.quests[kind][+i];
    if (claimQuest(q)) { SFX.achievement(); toast(`Quest complete: ◆ ${q.reward.stones}`, 'ach'); buildMap(); }
  });
}
function renderWorldBossInfo() {
  const open = !!SAVE.cleared[7];
  if (open) ensureWorldBoss();
  const wb = SAVE.worldBoss, done = open ? 1 - wb.hpLeft / wb.maxHp : 0;
  const weekEnd = Date.UTC(2026, 0, 5) + (Math.floor((Date.now() - Date.UTC(2026, 0, 5)) / 604800000) + 1) * 604800000 - Date.now();
  $('stageInfo').innerHTML = `
    <div class="muted" style="font-size:12px;letter-spacing:.2em;text-transform:uppercase">Weekly raid · resets in ${timeLeft(weekEnd)}</div>
    <h3 style="color:#b48bff;text-shadow:0 0 14px #7a5cff">Nyx, the Endless Night</h3>
    <p class="blurb">A titan with a huge shared HP pool. Each attempt lasts ${RAID_TIME} seconds, and all the damage you deal carries over until the week ends. Chests open as you wear it down.</p>
    ${open ? `<div class="wb-bar"><div style="width:${(100 * (1 - done)).toFixed(1)}%"></div><span>${Math.round(wb.hpLeft).toLocaleString()} / ${wb.maxHp.toLocaleString()}</span></div>
    <div class="wb-ms">${WB_MILESTONES.map((m, i) => `<div class="ms ${wb.claimed[i] ? 'got' : ''}"><b>${Math.round(m.at * 100)}%</b><span>◆${m.stones}${m.essence ? ` ✧${m.essence}` : ''}${m.mats ? ` · ${m.mats} mats` : ''}</span>${wb.claimed[i] ? '✓' : ''}</div>`).join('')}</div>
    <div class="info-row"><span>Attempts this week</span><span>${wb.attempts}</span></div>
    <div class="info-row"><span>Best attempt</span><span>${wb.bestDmg.toLocaleString()} damage</span></div>
    ${prepHTML(false)}` : ''}
    <button class="btn primary" id="btnEnter" ${open && wb.hpLeft > 0 ? '' : 'disabled'}>${!open ? 'Locked: clear Act I' : wb.hpLeft > 0 ? 'Challenge Nyx' : 'Defeated this week ✓'}</button>`;
  if (open) bindPrep($('stageInfo'));
  if (open && wb.hpLeft > 0) $('btnEnter').onclick = () => { SFX.click(); enterRaid(); };
}
function enterRaid() {
  SFX.init();
  ensureWorldBoss();
  startStage(0, 'raid');
  buildHUD();
  showScreen('play');
  banner('WORLD BOSS', 'boss');
  MUSIC.play('final');
}

// ---------------- grimoire ----------------
function cardStatsHTML(id) {
  const c = CARDS[id], cs = SAVE.cards[id], m = CARD_PROG.mult(cs.lv, cs.enh) * (1 + 0.05 * Math.min(5, tl('pact')));
  const rows = [['HP', Math.round(c.hp * m)]];
  if (c.ai === 'heal') rows.push(['Heal/s', fmt(c.heal * m)]);
  else if (c.ai === 'buffer') rows.push(['Shield', Math.round(c.shield * m)]);
  else if (c.ai === 'priest') rows.push(['Heal', fmt(c.heal * 2 * m)], ['Shield', Math.round((c.shield || 0) * m)]);
  else if (c.ai === 'dragon') rows.push(['Flame', fmt(c.dmg * m)], ['Bite', Math.round(c.bite * m)]);
  else rows.push(['Attack', fmt(c.dmg * m)]);
  rows.push(['Mana', c.cost], ['Cooldown', fmt(c.cd * (1 - 0.06 * Math.min(5, tl('quickcast')))) + 's'], ['Capacity', fmt((c.weight || 1) * (c.count || 1))]);
  if (c.life) rows.push(['Duration', c.life + 's']);
  return rows.map(([k, v]) => `<div>${k} <b>${v}</b></div>`).join('');
}
function cardEl(id) {
  const c = CARDS[id], cs = SAVE.cards[id], rk = RANK_BY_ID[c.rank], sk = CARD_SKILLS[id];
  const unlocked = cardUnlocked(id);
  const el = document.createElement('div');
  el.className = 'card' + (unlocked ? '' : ' locked');
  el.style.setProperty('--c', rk.color);
  const maxed = cs.lv >= CARD_PROG.maxLv;
  const xpPct = maxed ? 100 : 100 * cs.exp / CARD_PROG.expNext(cs.lv);
  const st = '★'.repeat(cs.enh) + `<span class="off">${'★'.repeat(CARD_PROG.maxEnh - cs.enh)}</span>`;
  const enhCost = CARD_PROG.enhCost(cs.enh);
  const canEnh = unlocked && cs.enh < CARD_PROG.maxEnh && SAVE.stones >= enhCost;
  const inSlot = SAVE.hotbar.indexOf(id);
  el.innerHTML = `
    <canvas width="132" height="132"></canvas>
    <div>
      <div><span class="cname">${unlocked ? (SAVE.awakened[id] ? '✦ Awakened ' : '') + c.name : '???'}</span><span class="role">${c.role}</span></div>
      <div class="lvrow">Lv ${cs.lv}${maxed ? ' (max)' : ''}<div class="lvbar"><div style="width:${xpPct}%"></div></div><span class="stars-e">${st}</span></div>
      <div class="desc">${unlocked ? c.desc : c.fusion ? 'Discover this creature through Fusion.' : 'Reach a higher summoner level to reveal this card.'}</div>
      ${unlocked ? `<div class="skill-line"><b>✦ ${sk.name}</b> <span class="muted">(${key1('skillMod')}+slot · ${sk.mp} MP · ${sk.cd}s)</span><br>${sk.desc}</div>` : ''}
      <div class="stats">${unlocked ? cardStatsHTML(id) : ''}</div>
    </div>
    <div class="acts">
      <button class="btn small" data-act="equip" data-id="${id}" ${unlocked ? '' : 'disabled'}>${equipLabel(id)}</button>
      <button class="btn small primary" data-act="enh" ${canEnh ? '' : 'disabled'}>${cs.enh >= CARD_PROG.maxEnh ? 'Fully enhanced' : 'Enhance ◆' + enhCost}</button>
      ${unlocked && cs.lv >= 15 ? (() => { const a = awakenStatus(id), ac = awakenCost(id); return `<button class="btn small ${a.ok ? 'awaken' : ''}" data-act="awk" ${a.ok ? '' : 'disabled'} title="Awakening: +50% stats, upgraded special skill (−30% cooldown)">${SAVE.awakened[id] ? '✦ Awakened' : a.ok ? `Awaken ◆${ac.stones} ✧${ac.essence}` : a.why}</button>`; })() : ''}
    </div>`;
  renderCardIcon(el.querySelector('canvas'), id, !unlocked);
  el.querySelector('[data-act=equip]').onclick = () => {
    SFX.click();
    const cur = SAVE.hotbar.indexOf(id);
    if (cur >= 0) SAVE.hotbar[cur] = SAVE.hotbar[selectedSlot];
    SAVE.hotbar[selectedSlot] = id;
    selectedSlot = nextEmptySlot(selectedSlot);
    saveGame(); rebuildGrimoireKeepScroll();
  };
  const awkBtn = el.querySelector('[data-act=awk]');
  if (awkBtn) awkBtn.onclick = () => { if (doAwaken(id)) { SFX.summon(9); SFX.level(); toast(`${c.name} has awakened!`, 'ach'); buildGrimoire(); } };
  el.querySelector('[data-act=enh]').onclick = () => {
    if (SAVE.stones < enhCost || cs.enh >= CARD_PROG.maxEnh) return;
    SAVE.stones -= enhCost; cs.enh++;
    saveGame(); SFX.level(); checkAch(); buildGrimoire();
  };
  return el;
}
// ---------------- hotbar slot selection ----------------
const LOADOUT_COUNT = 5;
function loadoutButtons() { return Array.from({ length: LOADOUT_COUNT }, (_, i) => `<button class="pick ${SAVE.loadoutIdx === i ? 'on' : ''}" data-load="${i}" title="Loadout ${i + 1}">${i + 1}</button>`).join(''); }
// the next empty slot after `from` (wrapping), or `from` itself when the hotbar is full
function nextEmptySlot(from) {
  for (let k = 1; k <= 6; k++) { const i = (from + k) % 6; if (!SAVE.hotbar[i]) return i; }
  return from;
}
function equipLabel(id) {
  const inSlot = SAVE.hotbar.indexOf(id);
  return inSlot >= 0 ? (inSlot === selectedSlot ? 'In slot ' + (inSlot + 1) : 'Move to slot ' + (selectedSlot + 1)) : 'Equip to slot ' + (selectedSlot + 1);
}
function selectGrimSlot(i) {
  selectedSlot = i;
  document.querySelectorAll('#grimSlots .gslot').forEach((b, k) => b.classList.toggle('sel', k === i));
  document.querySelectorAll('#grimContent [data-act=equip][data-id]').forEach(b => { b.textContent = equipLabel(b.dataset.id); });
}
function rebuildGrimoireKeepScroll() {
  const sc = $('scr-grimoire'), top = sc.scrollTop;
  buildGrimoire();
  sc.scrollTop = top;
}
function measureGrimSticky() {
  const sc = $('scr-grimoire'), tb = sc.querySelector('.topbar'), gh = sc.querySelector('.grim-hotbar');
  if (tb) sc.style.setProperty('--tbh', tb.offsetHeight + 'px');
  if (gh) sc.style.setProperty('--ghh', gh.offsetHeight + 'px');
}
window.addEventListener('resize', () => { if (STATE === 'grimoire') measureGrimSticky(); });
function buildGrimoire() {
  $('grimStones').textContent = SAVE.stones;
  document.querySelectorAll('#grimTabs .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === grimTab));
  const slots = $('grimSlots'); slots.innerHTML = '';
  if (selectedSlot < 0 || selectedSlot > 5) selectedSlot = 0;
  SAVE.hotbar.forEach((id, i) => {
    const b = document.createElement('div');
    b.className = 'gslot' + (i === selectedSlot ? ' sel' : '');
    b.innerHTML = `<span class="k">${keyName(SETTINGS.keys['slot' + (i + 1)][0])}</span>`;
    if (id) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 96; renderCardIcon(cv, id); b.prepend(cv);
      const cs = SAVE.cards[id], info = document.createElement('div'); info.className = 'gs-info';
      info.innerHTML = `<span class="gs-lv">Lv ${cs.lv}</span><span class="gs-st">★${cs.enh}</span>`;
      b.title = `${CARDS[id].name} · Lv ${cs.lv} · ${cs.enh}/${CARD_PROG.maxEnh} stars`;
      b.appendChild(info);
      const x = document.createElement('button'); x.className = 'gx'; x.textContent = '✕'; x.title = 'Clear slot';
      x.onclick = ev => { ev.stopPropagation(); SAVE.hotbar[i] = null; selectedSlot = i; saveGame(); SFX.click(); rebuildGrimoireKeepScroll(); };
      b.appendChild(x);
    } else b.innerHTML += '<div class="empty">empty</div>';
    b.onclick = () => { SFX.click(); selectGrimSlot(i); };
    slots.appendChild(b);
  });
  const ps = pstat(false);
  $('grimStats').innerHTML = `<div class="loadouts">Loadout ${loadoutButtons()}</div><div>Essence <b>✧ ${SAVE.essence}</b></div><div>Summoner level <b>${SAVE.level}</b></div><div>Capacity <b>${ps.cap}</b></div><div>Max HP <b>${ps.hp}</b></div><div>Max mana <b>${ps.mp}</b></div><div>Mana regen <b>${fmt(ps.regen)}/s</b></div><div>Stone throw <b>${fmt(ps.stone)}</b></div>` + synergyHTML();
  const root = $('grimContent'); root.innerHTML = '';
  requestAnimationFrame(measureGrimSticky);
  if (grimTab === 'cards') buildCardsTab(root);
  else if (grimTab === 'fusion') buildFusionTab(root);
  else if (grimTab === 'talents') buildTalentsTab(root);
  else if (grimTab === 'equip') buildEquipTab(root);
  else buildRelicsTab(root);
  $('grimStats').querySelectorAll('[data-load]').forEach(b => b.onclick = () => { SFX.click(); switchLoadout(+b.dataset.load); buildGrimoire(); });
}
function buildTalentsTab(root) {
  root.innerHTML = `<p class="muted intro">Permanent upgrades for Allen, bought with ◆ magic stones.</p>`;
  const grid = document.createElement('div'); grid.className = 'talents';
  for (const t of TALENTS) {
    const lv = tl(t.id), maxed = lv >= t.max, cost = talentCost(t, lv);
    const el = document.createElement('div');
    el.className = 'talent' + (maxed ? ' maxed' : '');
    el.innerHTML = `
      <div class="t-icon">${t.icon}</div>
      <div class="t-body">
        <div class="t-name">${t.name}</div>
        <div class="pips">${Array.from({ length: t.max }, (_, k) => `<span class="${k < lv ? 'on' : ''}"></span>`).join('')}</div>
        <div class="t-desc">${t.desc}</div>
      </div>
      <button class="btn small ${!maxed && SAVE.stones >= cost ? 'primary' : ''}" ${!maxed && SAVE.stones >= cost ? '' : 'disabled'}>${maxed ? 'Max' : '◆ ' + cost}</button>`;
    el.querySelector('button').onclick = () => { if (buyTalent(t.id)) { SFX.level(); buildGrimoire(); } };
    grid.appendChild(el);
  }
  root.appendChild(grid);
}

// ---------------- codex ----------------
function buildCodex() {
  document.querySelectorAll('#codexTabs .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === codexTab));
  const root = $('codexContent'); root.innerHTML = '';
  if (codexTab === 'bestiary') {
    const bossKeys = Object.keys(BOSSES).filter(k => !BOSSES[k].awakened);
    const keys = [...Object.keys(ENEMIES).filter(k => !ENEMIES[k].hidden), ...bossKeys.filter(k => !BOSSES[k].event)];
    const seen = keys.filter(k => SAVE.bestiary[k]).length;
    root.innerHTML = `<p class="muted intro">${seen} / ${keys.length} discovered. Defeat a creature to record it.</p>`;
    for (const [title, list] of [['Monsters', Object.keys(ENEMIES).filter(k => !ENEMIES[k].hidden)], ['Bosses', bossKeys]]) {
      const h = document.createElement('h3'); h.className = 'codex-h'; h.textContent = title; root.appendChild(h);
      const grid = document.createElement('div'); grid.className = 'beasts';
      for (const k of list) {
        const n = SAVE.bestiary[k] || 0, boss = BOSSES[k];
        const el = document.createElement('div');
        el.className = 'beast' + (n ? '' : ' unknown') + (boss ? ' boss' : '');
        el.innerHTML = `<canvas width="110" height="110"></canvas><div><div class="b-name">${n ? (boss ? boss.name : ENEMIES[k].name) : '???'}</div>${n && boss ? `<div class="b-title">${boss.title}</div>` : ''}<div class="b-lore">${n ? LORE[k] : 'Not yet encountered.'}</div><div class="b-kills">${n ? 'Defeated ' + n.toLocaleString() : ''}</div></div>`;
        renderEnemyIcon(el.querySelector('canvas'), k, !n);
        grid.appendChild(el);
      }
      root.appendChild(grid);
    }
  } else if (codexTab === 'records') {
    buildRecords(root);
  } else if (codexTab === 'wardrobe') {
    buildWardrobe(root);
  } else {
    const got = ACHIEVEMENTS.filter(a => SAVE.ach[a.id]).length;
    root.innerHTML = `<p class="muted intro">${got} / ${ACHIEVEMENTS.length} unlocked. Each one rewards magic stones.</p>`;
    const grid = document.createElement('div'); grid.className = 'achs';
    for (const a of ACHIEVEMENTS) {
      const done = SAVE.ach[a.id];
      const el = document.createElement('div');
      el.className = 'ach' + (done ? ' done' : '');
      el.innerHTML = `<div class="a-icon">${done ? '🏆' : '🔒'}</div><div><div class="a-name">${a.name}</div><div class="a-desc">${a.desc}</div></div><div class="a-rew">◆ ${a.reward}</div>`;
      grid.appendChild(el);
    }
    root.appendChild(grid);
  }
}

// ---------------- play flow ----------------
function enterStage(i) {
  SFX.init();
  const go = () => {
    startStage(i);
    buildHUD();
    showScreen('play');
    banner(STAGES[i].name, 'level');
    MUSIC.play(musicKey(i));
  };
  if (STORY.pre[i] && !SAVE.seenStory[i]) { SAVE.seenStory[i] = true; saveGame(); showDialogue(STORY.pre[i], go); }
  else go();
}
function enterTower() {
  SFX.init();
  const go = () => {
    startStage(0, 'tower');
    buildHUD();
    showScreen('play');
    banner('Abyss Tower · Floor 1', 'rank');
    MUSIC.play('s' + W.themeIdx);
  };
  if (!SAVE.seenStory.tower) { SAVE.seenStory.tower = true; saveGame(); showDialogue(STORY.tower, go); }
  else go();
}
function enterRush() {
  SFX.init();
  startStage(0, 'rush');
  buildHUD();
  showScreen('play');
  banner('BOSS RUSH', 'boss');
  MUSIC.play(musicKey(W.themeIdx));
}
function pauseGame() { if (STATE === 'play' && !W.choosing) showScreen('pause'); }
function resumeGame() { if (STATE === 'pause') { INPUT.keys.clear(); showScreen('play'); } }
function finishStage(won, retreat) {
  if (W.ended || W.resultShown) return;
  W.resultShown = true;
  hideBoostModal();
  MUSIC.play('menu');
  const t = $('resTitle');
  const notes = [];
  const lvTxt = W.startLevel === SAVE.level ? 'Lv ' + SAVE.level : `Lv ${W.startLevel} → ${SAVE.level}`;
  if (W.isTower) {
    SAVE.towerBest = Math.max(SAVE.towerBest, W.floor);
    t.textContent = retreat ? 'LEFT THE TOWER' : 'RUN OVER';
    t.classList.add('lose');
    $('resStage').textContent = `Abyss Tower: you reached floor ${W.floor}`;
    fillResults([['Floor reached', W.floor], ['Best floor', SAVE.towerBest], ['Enemies slain', W.kills], ['EXP gained', fmt(W.expGained)], ['Summoner level', lvTxt], ['Magic stones', '◆ ' + W.stones]]);
  } else if (W.isRaid) {
    const wb = SAVE.worldBoss, dmg = Math.round(W.raidDmg);
    wb.hpLeft = Math.max(0, wb.hpLeft - dmg); wb.bestDmg = Math.max(wb.bestDmg, dmg);
    t.textContent = wb.hpLeft <= 0 ? 'NYX DEFEATED' : 'RAID OVER';
    t.classList.toggle('lose', wb.hpLeft > 0);
    $('resStage').textContent = `You dealt ${dmg.toLocaleString()} damage to Nyx`;
    fillResults([['Damage dealt', dmg.toLocaleString()], ['Nyx HP left', Math.round(100 * wb.hpLeft / wb.maxHp) + '%'], ['Best this week', wb.bestDmg.toLocaleString()], ['Attempts', wb.attempts], ['EXP gained', fmt(W.expGained)], ['Summoner level', lvTxt]]);
    for (const m of worldBossMilestones()) notes.push(`<div class="res-note relic">${m}</div>`);
  } else if (W.isRush) {
    const n = W.floorsCleared, time = W.t;
    const prev = SAVE.rushBest;
    if (!prev || n > prev.n || (n === prev.n && W.won && time < prev.time)) SAVE.rushBest = { n, time };
    t.textContent = W.won ? 'RUSH COMPLETE' : retreat ? 'RUSH ABANDONED' : 'RUSH OVER';
    t.classList.toggle('lose', !W.won);
    $('resStage').textContent = `Boss Rush: ${n} of ${W.rushList.length} bosses defeated`;
    fillResults([['Bosses defeated', `${n} / ${W.rushList.length}`], ['Best run', SAVE.rushBest ? `${SAVE.rushBest.n} bosses` : '—'], ['Time', fmtTime(W.t)], ['EXP gained', fmt(W.expGained)], ['Summoner level', lvTxt], ['Magic stones', '◆ ' + W.stones]]);
  } else {
    const idx = W.stageIdx;
    let lost = 0, bonus = 0;
    if (!won && SAVE.mode === 'hell') { lost = Math.floor(W.stones * 0.5); SAVE.stones -= lost; }
    if (won) {
      const firstClear = !SAVE.cleared[idx];
      SAVE.cleared[idx] = true;
      if (!SAVE.best[idx] || W.time < SAVE.best[idx]) SAVE.best[idx] = W.time;
      const met = [true, challengeMet(STAGES[idx].ch[0]), challengeMet(STAGES[idx].ch[1])];
      const st = SAVE.stars[idx];
      const lines = ['Clear the stage', challengeText(STAGES[idx].ch[0]), challengeText(STAGES[idx].ch[1])];
      let newStars = 0;
      met.forEach((m, k) => { if (m && !st[k]) { st[k] = true; newStars++; } });
      bonus = newStars * starReward(idx);
      SAVE.stones += bonus;
      SAVE.counters.clears = (SAVE.counters.clears || 0) + 1;
      if (W.curses.size >= 3 && !W.isDaily) SAVE.counters.trial3++;
      if (W.syn.size >= 3) SAVE.counters.syn3 = (SAVE.counters.syn3 || 0) + 1;
      if (idx === 27 && W.tier >= 1 && W.tier === SAVE.tierMax && SAVE.tierMax < TIER_MAX) { SAVE.tierMax++; notes.push(`<div class="res-note relic">Hell Tier ${SAVE.tierMax} unlocked! Choose it above the map.</div>`); }
      if (W.isDaily) {
        const di = dailyInfo();
        if (!di.done) {
          SAVE.daily = { key: di.key, done: true };
          SAVE.stones += di.stones; SAVE.essence += di.essence;
          SAVE.counters.dailies = (SAVE.counters.dailies || 0) + 1;
          notes.push(`<div class="res-note relic">Daily Trial chest opened: ◆ ${di.stones}${di.essence ? ` and ✧ ${di.essence}` : ''}</div>`);
        }
      }
      notes.push(`<div class="res-stars">${lines.map((l, k) => `<div class="ch-row ${st[k] ? 'done' : ''}"><span class="star ${st[k] ? 'on' : ''}">★</span>${l}</div>`).join('')}</div>`);
      if (bonus) notes.push(`<div class="res-note">${newStars} new star${newStars > 1 ? 's' : ''}: +◆ ${bonus}</div>`);
      const rel = awardRelic(STAGES[idx].boss);
      if (rel) notes.push(`<div class="res-note relic">${rel.upgraded ? 'Relic upgraded' : 'New relic'}: <b>${rel.relic.icon} ${rel.relic.name}${rel.upgraded ? ' +' : ''}</b>. ${rel.relic.desc(rel.relic.v * (rel.upgraded ? 2 : 1))}. Equip relics in the Grimoire.</div>`);
      if (firstClear) {
        if (idx + 1 < STAGES.length) notes.push(`<div class="res-note"><b>${STAGES[idx + 1].name}</b> is now open${STAGES[idx + 1].region !== STAGES[idx].region ? ` in <b>${REGIONS[STAGES[idx + 1].region].act}</b>!` : '!'}</div>`);
        if (idx === 2) notes.push('<div class="res-note">The <b>Abyss Tower</b> is open!</div>');
        if (idx === 7) notes.push('<div class="res-note"><b>Boss Rush</b> is open, and <b>Roran</b> the Swordsman can now join you!</div>');
        for (const id in COMPANIONS) if (COMPANIONS[id].unlockAt === idx && idx !== 7) notes.push(`<div class="res-note"><b>${COMPANIONS[id].name}</b> the ${COMPANIONS[id].title} can now join you!</div>`);
        if (idx === 7 && !SAVE.endingSeen) W.pendingEnding = 'ending';
        if (idx === 17 && !SAVE.seenStory.ending2) W.pendingEnding = 'ending2';
        if (idx === 27 && !SAVE.seenStory.ending3) W.pendingEnding = 'ending3';
      }
    }
    t.textContent = won ? 'VICTORY' : retreat ? 'RETREATED' : 'DEFEATED';
    t.classList.toggle('lose', !won);
    $('resStage').textContent = (W.isDaily ? 'Daily Trial: ' : '') + STAGES[idx].name + (won ? ' cleared!' : '') + (W.tier ? ` · Hell Tier ${W.tier}` : '') + (W.rewardMult > 1 ? ` · Trials ×${W.rewardMult.toFixed(1)}` : '');
    fillResults([['Time', fmtTime(W.time)], ['Enemies slain', W.kills], ['EXP gained', fmt(W.expGained)], ['Summoner level', lvTxt], ['Magic stones', '◆ ' + (W.stones + bonus - lost)], ['Total stones', '◆ ' + SAVE.stones]]);
    if (lost) notes.push(`<div class="res-note bad">Hell Mode penalty: lost ◆ ${lost} (half the stones from this run).</div>`);
    if (!won && !retreat) notes.push('<div class="res-note bad">Your EXP and card progress were kept. Try talents, relics, fusion, or replaying earlier stages.</div>');
    if (won && idx + 1 < STAGES.length) { selectedStage = idx + 1; selectedRegion = STAGES[idx + 1].region; }
  }
  const matKeys = Object.keys(W.mats || {}).filter(k => W.mats[k]);
  if (matKeys.length) notes.push(`<div class="res-note relic">Materials: ${matKeys.map(k => `${MATS[k].icon} +${W.mats[k]} ${MATS[k].name}`).join(' · ')}</div>`);
  if (W.essence) notes.push(`<div class="res-note relic">Abyss Essence collected: ✧ ${W.essence} (total ${SAVE.essence})</div>`);
  for (const rid of W.unlocks) { const rk = RANK_BY_ID[rid]; notes.push(`<div class="res-note">New summon rank unlocked: <b>${rk.name} (${rk.grade})</b>. Check your Grimoire.</div>`); }
  const ups = Object.entries(W.cardUps);
  if (ups.length) notes.push(`<div class="res-note">Card level ups: ${ups.map(([id, lv]) => `${CARDS[id].name} → Lv ${lv}`).join(' · ')}</div>`);
  $('resExtra').innerHTML = notes.join('');
  $('btnResRetry').textContent = W.isTower ? 'Climb Again' : W.isRush ? 'Rush Again' : W.isRaid ? 'Fight Again' : 'Retry Stage';
  checkAch();
  saveGame();
  checkTierUnlock();
  recordRun(won, retreat);
  backupSave(true);
  showScreen('result');
}
function fillResults(items) {
  $('resGrid').innerHTML = items.map(([k, v]) => `<div class="res-item"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
}

// ---------------- HUD ----------------
let hudCache = {};
let mmFrame = 0;
function buildHUD() {
  hudCache = {};
  renderPortrait($('portrait'));
  $('stageName').textContent = W.st.name;
  $('btnMute').classList.toggle('off', SFX.muted);
  hideBossBar();
  hideBoostModal();
  $('bossIntro').classList.remove('show');
  buildHotbar();
  const sk = $('skills'); sk.innerHTML = '';
  const odb = document.createElement('div');
  odb.className = 'skill odskill'; odb.id = 'odBtn'; odb.title = 'Grimoire Overdrive: summon every hotbar card for free when the gauge is full';
  odb.innerHTML = `❂<div class="cd"></div><span class="key">${key1('overdrive')}</span>`;
  odb.addEventListener('pointerdown', ev => { ev.stopPropagation(); ev.preventDefault(); SFX.init(); useOverdrive(); });
  if (W.syn.size) setTimeout(() => toast('Synergies: ' + [...W.syn].map(k => SYNERGIES[k].name).join(', '), 'card'), 1500);
  for (const s of SKILLS) {
    const act = Object.keys(SKILL_ACTION).find(k => SKILL_ACTION[k] === s.key);
    const d = document.createElement('div');
    d.className = 'skill'; d.title = `${s.name}: ${s.desc}`;
    d.innerHTML = `${s.icon}<div class="cd"></div><span class="key">${key1(act)}</span>`;
    d.dataset.key = s.key;
    d.addEventListener('pointerdown', ev => { ev.stopPropagation(); ev.preventDefault(); SFX.init(); useSkill(s.key); });
    sk.appendChild(d);
  }
  sk.appendChild(odb);
  updateTutBox();
}
function buildHotbar() {
  const hb = $('hotbar'); if (!hb) return;
  hb.innerHTML = '';
  for (const k in hudCache) if (/^(cd|nm|sk)\d/.test(k)) delete hudCache[k];
  SAVE.hotbar.forEach((id, i) => {
    const d = document.createElement('div');
    d.className = 'slot' + (id ? '' : ' empty');
    const kn = keyName(SETTINGS.keys['slot' + (i + 1)].find(Boolean));
    if (id) {
      d.style.setProperty('--c', RANK_BY_ID[CARDS[id].rank].color);
      d.title = `${CARDS[id].name}: ${CARDS[id].desc}\nSpecial (${key1('skillMod')}+${kn}): ${CARD_SKILLS[id].name}. ${CARD_SKILLS[id].desc}`;
      const cv = document.createElement('canvas'); cv.width = cv.height = 96;
      renderCardIcon(cv, id);
      d.appendChild(cv);
      d.insertAdjacentHTML('beforeend', `<span class="key">${kn}</span><span class="cost">${CARDS[id].cost}</span><div class="cd"></div><div class="sk" title="Special skill"></div>`);
      bindSlot(d, i);
    } else d.innerHTML = `<span class="key">${kn}</span>`;
    hb.appendChild(d);
  });
  hudCache.slots = [...hb.children];
}
function flashSlot(i) {
  const el = hudCache.slots && hudCache.slots[i]; if (!el) return;
  el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
}
function setIf(key, val, fn) { if (hudCache[key] !== val) { hudCache[key] = val; fn(val); } }
function updateHUD() {
  const p = W.player;
  setIf('hp', Math.round(p.hp) + '/' + p.maxHp, v => { $('hpTxt').textContent = v; $('hpFill').style.transform = `scaleX(${clamp(p.hp / p.maxHp, 0, 1)})`; });
  setIf('sh', Math.round(p.shield), v => { $('shFill').style.transform = `scaleX(${clamp(v / p.maxHp, 0, 1)})`; });
  setIf('mp', Math.floor(p.mp) + '/' + p.maxMp, v => { $('mpTxt').textContent = v; $('mpFill').style.transform = `scaleX(${clamp(p.mp / p.maxMp, 0, 1)})`; });
  setIf('xp', Math.round(1000 * SAVE.exp / PLAYER.expNext(SAVE.level)), v => { $('xpFill').style.transform = `scaleX(${v / 1000})`; });
  setIf('soul', Math.round(100 * W.soul / W.soulMax), v => { $('soulFill').style.transform = `scaleX(${clamp(v / 100, 0, 1)})`; });
  setIf('lvl', SAVE.level, v => { $('hudLvl').textContent = v; });
  setIf('cap', fmt(capUsed()) + ' / ' + capacity(), v => { $('capTxt').textContent = v; });
  setIf('stones', W.stones, v => { $('stoneTxt').textContent = v; });
  setIf('kills', W.kills, v => { $('killTxt').textContent = v; });
  setIf('picks', W.picks, () => {
    $('boostIcons').innerHTML = Object.entries(W.boosts).map(([id, n]) => { const b = BOOSTS.find(x => x.id === id); return `<span class="bicon" title="${b.name}: ${b.desc}">${b.icon}${n > 1 ? '<sub>' + n + '</sub>' : ''}</span>`; }).join('');
  });
  let tt;
  if (W.isRaid) {
    tt = W.boss ? `⚠ NYX · ${fmtTime(Math.max(0, W.raidT))} ⚠` : 'The night stirs…';
  } else if (W.isRush) {
    tt = W.floorPause > 0 ? 'Next boss…' : W.bossSpawned ? `⚠ BOSS ${W.rushI + 1}/${W.rushList.length} ⚠` : 'Get ready…';
  } else if (W.isTower) {
    tt = W.floorPause > 0 ? 'Next floor…' : W.st.bossFloor ? (W.bossSpawned ? '⚠ BOSS FLOOR ⚠' : 'Boss in ' + fmtTime(Math.max(0, W.st.duration - W.time))) : 'Floor clear in ' + fmtTime(Math.max(0, W.st.duration - W.time));
  } else tt = W.bossSpawned ? '⚠ BOSS ⚠' : (tutGating() ? 'Tutorial' : 'Boss in ' + fmtTime(Math.max(0, W.st.duration - W.time)));
  setIf('timer', tt, v => { const el = $('timer'); el.textContent = v; el.classList.toggle('boss', v.includes('BOSS')); });
  setIf('stname', W.st.name, v => { $('stageName').textContent = v; });
  if (W.boss && !W.boss.dead) setIf('boss', Math.round(1000 * W.boss.hp / W.boss.maxHp), v => { $('bossFill').style.transform = `scaleX(${clamp(v / 1000, 0, 1)})`; });
  if (hudCache.slots) SAVE.hotbar.forEach((id, i) => {
    if (!id) return;
    const el = hudCache.slots[i], c = CARDS[id], sk = CARD_SKILLS[id];
    if (!el) return;
    const cd = Math.max(0, W.slotCd[i] / (c.cd * W.ps.cdMult));
    setIf('cd' + i, Math.round(cd * 50), v => { el.querySelector('.cd').style.transform = `scaleY(${v / 50})`; });
    setIf('nm' + i, p.mp < c.cost, v => el.classList.toggle('nomana', v));
    const has = W.summons.some(s => s.id === id), scd = W.cskCd[id] || 0;
    const state = !has ? 'off' : scd > 0 ? 'cd' : p.mp < sk.mp ? 'cd' : 'ready';
    setIf('sk' + i, state, v => { el.querySelector('.sk').className = 'sk ' + v; });
  });
  setIf('od', Math.round(W.od) + (W.odT > 0 ? 'a' + Math.ceil(W.odT) : ''), () => {
    $('odFill').style.transform = `scaleX(${W.odT > 0 ? W.odT / 12 : W.od / OD_MAX})`;
    $('odTxt').textContent = W.odT > 0 ? 'OVERDRIVE ACTIVE' : W.od >= OD_MAX ? `OVERDRIVE READY · ${INPUT.touchMode ? '❂' : key1('overdrive')}` : 'OVERDRIVE';
    const ob = $('odBtn');
    if (ob) { ob.classList.toggle('ready', W.od >= OD_MAX && W.odT <= 0); ob.querySelector('.cd').style.setProperty('--p', (W.odT > 0 ? 0 : 100 - Math.min(100, W.od)) + '%'); }
  });
  setIf('buff', W.buff && W.buff.t > 0 ? `${SHRINES[W.buff.type].name} ${Math.ceil(W.buff.t)}s` : '', v => { $('boostIcons').dataset.buff = v; });
  document.querySelectorAll('#skills .skill[data-key]').forEach(el => {
    const sk = SKILLS.find(s => s.key === el.dataset.key);
    const max = sk.key === 'Space' ? W.ps.dashCd : sk.cd;
    const pct = Math.max(0, p.cds[sk.key] / max) * 100;
    setIf('sk' + sk.key, Math.round(pct), v => el.querySelector('.cd').style.setProperty('--p', v + '%'));
    setIf('ska' + sk.key, sk.key === 'KeyQ' && p.enhT > 0, v => el.classList.toggle('active', v));
  });
  const mm = $('minimap');
  setIf('mmOn', SETTINGS.minimap, v => mm.classList.toggle('hidden', !v));
  if (SETTINGS.minimap && (mmFrame++ % 2 === 0)) drawMinimap(mm);
}
function showBossBar(name) { $('bossName').textContent = name; $('bossBar').classList.remove('hidden'); hudCache.boss = null; }
function hideBossBar() { $('bossBar').classList.add('hidden'); }
function showBossIntro(bd) {
  const el = $('bossIntro');
  $('biTitle').textContent = bd.title;
  $('biName').textContent = bd.name;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}
function banner(text, cls) {
  const b = $('banner');
  b.className = 'banner'; void b.offsetWidth;
  b.textContent = text; b.className = 'banner show ' + (cls || '');
}
function toast(text, cls) {
  const box = $('toasts');
  if (box.lastChild && box.lastChild.textContent === text) return;
  const d = document.createElement('div');
  d.className = 'toast ' + (cls || ''); d.textContent = text;
  box.appendChild(d);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => d.remove(), 2600);
}
function showBoostModal(list) {
  const box = $('boostCards'); box.innerHTML = '';
  list.forEach((b, i) => {
    const n = W.boosts[b.id] || 0;
    const el = document.createElement('button');
    el.className = 'boost';
    el.innerHTML = `<div class="b-key">${INPUT.touchMode ? '' : i + 1}</div><div class="b-icon">${b.icon}</div><div class="b-name">${b.name}${n ? ` <span class="muted">×${n + 1}</span>` : ''}</div><div class="b-desc">${b.desc}</div>`;
    el.onclick = () => pickBoost(i);
    box.appendChild(el);
  });
  $('boostModal').classList.remove('hidden');
}
function hideBoostModal() { $('boostModal').classList.add('hidden'); }
function updateTutBox() {
  const box = $('tutBox');
  if (!W.tut) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  $('tutText').textContent = tutText();
  $('tutDots').innerHTML = TUT_STEPS.map((s, k) => `<span class="${k < W.tut.step ? 'on' : k === W.tut.step ? 'cur' : ''}"></span>`).join('');
}
