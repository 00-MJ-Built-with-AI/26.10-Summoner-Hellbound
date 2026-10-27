'use strict';
// ---------- Online: Google sign-in, cloud saves, real-player arena, leaderboards ----------
// Everything goes through NET, a small adapter. The real one talks to Firebase; tests swap in a fake.
// With no FIREBASE_CONFIG, NET is null and every online button stays hidden: the game works offline as before.

const FB_VERSION = '10.12.2';
const ONLINE = { user: null, ready: false, dirty: false, lastSync: 0, syncing: false, rivals: null, boards: {} };
let NET = null;

function firebaseNet(cfg) {
  let auth = null, db = null;
  const load = src => new Promise((ok, bad) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
  const boot = (async () => {
    for (const m of ['app', 'auth', 'firestore']) await load(`https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-${m}-compat.js`);
    firebase.initializeApp(cfg);
    auth = firebase.auth(); db = firebase.firestore();
  })();
  const ready = async () => { await boot; return { auth, db }; };
  return {
    async init(onUser) { await ready(); auth.onAuthStateChanged(u => onUser(u ? { uid: u.uid, name: (u.displayName || 'Summoner').split(' ')[0], email: u.email } : null)); try { await auth.getRedirectResult(); } catch (e) { /* no redirect pending */ } },
    async signIn() {
      await ready();
      const p = new firebase.auth.GoogleAuthProvider();
      const standalone = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
      if (standalone || INPUT.touchMode) return auth.signInWithRedirect(p);
      return auth.signInWithPopup(p);
    },
    async signOut() { await ready(); return auth.signOut(); },
    async getSave(uid) { await ready(); const d = await db.collection('saves').doc(uid).get(); return d.exists ? d.data() : null; },
    async putSave(uid, rec) { await ready(); return db.collection('saves').doc(uid).set(rec); },
    async submit(board, uid, entry) {
      await ready();
      const ref = db.collection('boards').doc(board).collection('entries').doc(uid);
      const cur = await ref.get();
      if (cur.exists && !(entry.score > cur.data().score)) return false;
      await ref.set(entry); return true;
    },
    async top(board, n = 50) { await ready(); const q = await db.collection('boards').doc(board).collection('entries').orderBy('score', 'desc').limit(n).get(); return q.docs.map(d => Object.assign({ uid: d.id }, d.data())); },
    async putArena(uid, rec) { await ready(); return db.collection('arena').doc(uid).set(rec); },
    async findArena(rating, uid) {
      await ready();
      const q = await db.collection('arena').where('rating', '>=', rating - 250).where('rating', '<=', rating + 250).limit(25).get();
      return q.docs.map(d => Object.assign({ uid: d.id }, d.data())).filter(r => r.uid !== uid);
    },
  };
}
if (typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey) NET = firebaseNet(FIREBASE_CONFIG);
const onlineOn = () => !!NET;
const signedIn = () => !!(NET && ONLINE.user);

async function onlineInit() {
  if (!NET || ONLINE.ready) return;
  ONLINE.ready = true;
  try { await NET.init(u => { ONLINE.user = u; refreshAccountUI(); if (u) firstSync(); }); } catch (e) { ONLINE.error = 'Could not reach the online service.'; refreshAccountUI(); }
}
// ---------------- cloud saves ----------------
const saveRecord = () => ({ data: JSON.stringify(SAVE), savedAt: SAVE.savedAt || Date.now(), level: SAVE.level, cleared: SAVE.cleared.filter(Boolean).length, mode: SAVE.mode });
async function uploadSave() {
  if (!signedIn() || !SAVE || ONLINE.syncing) return false;
  ONLINE.syncing = true;
  try { await NET.putSave(ONLINE.user.uid, saveRecord()); ONLINE.dirty = false; ONLINE.lastSync = Date.now(); return true; }
  catch (e) { return false; }
  finally { ONLINE.syncing = false; refreshAccountUI(); }
}
async function firstSync() {
  if (!signedIn()) return;
  let cloud = null;
  try { cloud = await NET.getSave(ONLINE.user.uid); } catch (e) { return; }
  const local = SAVE || loadSave();
  if (!cloud) { if (local) { if (!SAVE) SAVE = local; await uploadSave(); } return; }
  if (!local) { adoptCloud(cloud); return; }
  if (Math.abs((cloud.savedAt || 0) - (local.savedAt || 0)) < 5000) { ONLINE.lastSync = Date.now(); refreshAccountUI(); return; }
  if ((cloud.savedAt || 0) > (local.savedAt || 0) || cloud.level > local.level) askWhichSave(cloud, local);
  else { if (!SAVE) SAVE = local; await uploadSave(); }
}
function adoptCloud(cloud) {
  try {
    const o = migrateSave(JSON.parse(cloud.data));
    backupSave(true);
    SAVE = o; saveGame(); SFX.setMuted(!!SAVE.muted);
    ONLINE.lastSync = Date.now();
    toast(`Cloud save loaded: Lv ${SAVE.level}`, 'ach');
    if (STATE === 'title') refreshTitle(); else if (STATE === 'map') buildMap();
  } catch (e) { toast('The cloud save could not be read', 'fail'); }
}
function askWhichSave(cloud, local) {
  const when = t => (t ? new Date(t).toLocaleString() : 'unknown');
  showInfoCard('Two saves found', `<p>Your Google account has a different save than this device.</p>
    <div class="info-row"><span>Cloud: Lv ${cloud.level}, ${cloud.cleared} stages</span><span>${when(cloud.savedAt)}</span></div>
    <div class="info-row"><span>This device: Lv ${local.level}, ${local.cleared.filter(Boolean).length} stages</span><span>${when(local.savedAt)}</span></div>
    <p class="muted">The one you don't pick is kept as a backup in Settings → Restore backup.</p>
    <div class="menu-row"><button class="btn" id="btnKeepLocal">Keep this device's</button></div>`, 'Use the cloud save');
  $('btnInfoOk').onclick = () => { $('infoCard').classList.add('hidden'); adoptCloud(cloud); };
  $('btnKeepLocal').onclick = () => { $('infoCard').classList.add('hidden'); if (!SAVE) SAVE = local; uploadSave(); };
}
// every local save marks the cloud copy dirty; upload at most once a minute, and when leaving the page
const _on_saveGame = saveGame;
saveGame = function () { _on_saveGame(); if (signedIn()) ONLINE.dirty = true; };
setInterval(() => { if (ONLINE.dirty && Date.now() - ONLINE.lastSync > 60000) uploadSave(); }, 15000);
document.addEventListener('visibilitychange', () => { if (document.hidden && ONLINE.dirty) uploadSave(); });

// ---------------- leaderboards ----------------
const BOARDS = [
  { id: 'tower',  name: 'Abyss Tower',  unit: 'floor',   weekly: true, fmt: s => `Floor ${s}` },
  { id: 'rush',   name: 'Boss Rush',    unit: 'time',    weekly: true, fmt: s => { const n = Math.floor(s / 10000), t = 9999 - s % 10000; return `${n} bosses · ${fmtTime(t)}`; } },
  { id: 'arena',  name: 'Arena',        unit: 'rating',  weekly: true, fmt: s => `${arenaRank(s).name} ${s}` },
  { id: 'nyx',    name: 'World Boss',   unit: 'damage',  weekly: true, weeklyOnly: true, fmt: s => `${s.toLocaleString()} damage` },
  { id: 'rift',   name: 'The Rift',     unit: 'floor',   weekly: true, fmt: s => `Floor ${s}` },
];
const boardKey = (id, weekly) => (weekly ? `${id}_${weekKey()}` : `${id}_all`);
async function submitScore(id, score) {
  if (!signedIn() || !(score > 0)) return;
  const b = BOARDS.find(x => x.id === id), entry = { name: ONLINE.user.nick || SAVE.nick || ONLINE.user.name, score: Math.round(score), lv: SAVE.level, at: Date.now() };
  try {
    if (b.weekly) await NET.submit(boardKey(id, true), ONLINE.user.uid, entry);
    if (!b.weeklyOnly) await NET.submit(boardKey(id, false), ONLINE.user.uid, entry);
  } catch (e) { /* offline: the next result will try again */ }
}
const _on_finishStage = finishStage;
finishStage = function (won, retreat) {
  const snap = W && W.active && !W.ended && !W.resultShown ? { tower: W.isTower ? W.floor : 0, rush: W.isRush ? W.floorsCleared * 10000 + (9999 - Math.min(9999, Math.round(W.t))) : 0, rift: W.isRift ? W.rift.floor : 0, raid: W.isRaid ? Math.round(W.raidDmg) : 0, arena: W.isArena } : null;
  _on_finishStage(won, retreat);
  if (!snap || !signedIn()) return;
  if (snap.tower) submitScore('tower', snap.tower);
  if (snap.rush) submitScore('rush', snap.rush);
  if (snap.rift) submitScore('rift', snap.rift);
  if (snap.raid) submitScore('nyx', snap.raid);
  if (snap.arena) { submitScore('arena', SAVE.arena.rating); publishArena(); }
  uploadSave();
};

// ---------------- online arena: your hotbar is published so other players can fight it ----------------
function publishArena() {
  if (!signedIn()) return;
  const deck = SAVE.hotbar.filter(Boolean);
  if (!deck.length) return;
  const cardLv = Math.round(deck.reduce((a, id) => a + SAVE.cards[id].lv, 0) / deck.length);
  NET.putArena(ONLINE.user.uid, { name: ONLINE.user.nick || SAVE.nick || ONLINE.user.name, rating: SAVE.arena.rating, lv: SAVE.level, deck, cardLv, week: weekKey(), at: Date.now() }).catch(() => {});
}
async function fetchOnlineRivals() {
  if (!signedIn()) return null;
  try {
    const list = await NET.findArena(SAVE.arena.rating, ONLINE.user.uid);
    ONLINE.rivals = list.filter(r => Array.isArray(r.deck) && r.deck.every(id => CARDS[id])).slice(0, 12)
      .map((r, k) => ({ k: 100 + k, name: r.name, rating: r.rating, lv: r.lv, deck: r.deck.slice(0, 6), cardLv: clamp(r.cardLv || 1, 1, CARD_PROG.maxLv), online: true }));
    return ONLINE.rivals;
  } catch (e) { return null; }
}
const _on_arenaOpponents = arenaOpponents;
arenaOpponents = function () {
  const ai = _on_arenaOpponents();
  if (!ONLINE.rivals || !ONLINE.rivals.length) return ai;
  const r = SAVE.arena.rating, real = [...ONLINE.rivals].sort((a, b) => Math.abs(a.rating - r) - Math.abs(b.rating - r)).slice(0, 2);
  return [...real, ...ai].slice(0, 3);
};
const _on_arenaRivals = arenaRivals;
arenaRivals = function () { const ai = _on_arenaRivals(); for (const r of ONLINE.rivals || []) ai[r.k] = r; return ai; };
const _on_vilArena = vilArena;
vilArena = function (root) {
  _on_vilArena(root);
  root.querySelectorAll('.ar-op').forEach((el, i) => { const o = arenaOpponents()[i]; if (o && o.online) el.insertAdjacentHTML('afterbegin', '<span class="online-tag">● Real player</span>'); });
  if (signedIn() && !ONLINE.rivals && !ONLINE.fetching) { ONLINE.fetching = true; fetchOnlineRivals().then(r => { ONLINE.fetching = false; if (r && r.length && STATE === 'village' && vilTab === 'arena') buildVillage(); }); }
  if (onlineOn() && !signedIn()) root.querySelector('.intro').insertAdjacentHTML('beforeend', ' <b>Sign in with Google in Settings to fight real players.</b>');
};

// ---------------- UI: account box in Settings, Leaderboards tab in the Codex ----------------
function refreshAccountUI() {
  const box = $('accountBox');
  if (!box) return;
  if (!onlineOn()) { box.innerHTML = '<p class="muted save-note">Online features (cloud saves, online arena, leaderboards) are not set up for this copy of the game yet. See FIREBASE_SETUP.md.</p>'; return; }
  if (ONLINE.error && !ONLINE.user) { box.innerHTML = `<p class="muted save-note">${ONLINE.error}</p><button class="btn small" id="btnSignIn">Try again</button>`; }
  else if (!ONLINE.user) box.innerHTML = '<p class="muted save-note">Sign in to keep your save in the cloud, play it on any device, fight real players in the arena and join the leaderboards.</p><button class="btn small primary" id="btnSignIn">Sign in with Google</button>';
  else {
    const t = ONLINE.lastSync ? new Date(ONLINE.lastSync).toLocaleTimeString() : 'not yet';
    box.innerHTML = `<p class="save-note">Signed in as <b>${ONLINE.user.name}</b>. Cloud save: last synced ${t}${ONLINE.syncing ? ' (syncing…)' : ''}.</p>
      <label class="set-row">Leaderboard name <input type="text" id="nickInput" maxlength="16" value="${(SAVE && SAVE.nick) || ONLINE.user.name}"></label>
      <div class="save-btns"><button class="btn small" id="btnSyncNow">Sync now</button><button class="btn small ghost" id="btnSignOut">Sign out</button></div>`;
    $('btnSyncNow').onclick = () => { SFX.click(); uploadSave(); };
    $('btnSignOut').onclick = () => { SFX.click(); uploadSave().finally(() => NET.signOut()); };
    $('nickInput').onchange = ev => { if (SAVE) { SAVE.nick = ev.target.value.trim().slice(0, 16) || ONLINE.user.name; saveGame(); } };
  }
  const si = $('btnSignIn');
  if (si) si.onclick = () => { SFX.click(); ONLINE.error = null; onlineInit().then(() => NET.signIn()).catch(() => toast('Sign-in was cancelled or blocked', 'fail')); };
}
(function addAccountBox() {
  const anchor = [...document.querySelectorAll('#scr-settings h3')].find(h => h.textContent === 'Save transfer');
  if (!anchor) return;
  anchor.insertAdjacentHTML('beforebegin', '<h3>Account</h3><div id="accountBox"></div>');
  refreshAccountUI();
})();
const _on_buildSettings = buildSettings;
buildSettings = function () { _on_buildSettings(); refreshAccountUI(); };
let boardSel = { id: 'tower', weekly: true };
async function renderBoards(root) {
  const b = BOARDS.find(x => x.id === boardSel.id), weekly = b.weeklyOnly || boardSel.weekly;
  root.innerHTML = `<div class="board-tabs">${BOARDS.map(x => `<button class="btn small ${x.id === b.id ? 'primary' : ''}" data-board="${x.id}">${x.name}</button>`).join('')}</div>
    ${b.weeklyOnly ? '' : `<div class="board-tabs"><button class="btn small ${weekly ? 'primary' : 'ghost'}" data-wk="1">This week</button><button class="btn small ${!weekly ? 'primary' : 'ghost'}" data-wk="0">All time</button></div>`}
    <div id="boardBody" class="muted">${!onlineOn() ? 'Leaderboards need online features, which are not set up yet.' : !signedIn() ? 'Sign in with Google in Settings to see and join the leaderboards.' : 'Loading…'}</div>`;
  root.querySelectorAll('[data-board]').forEach(x => x.onclick = () => { SFX.click(); boardSel.id = x.dataset.board; renderBoards(root); });
  root.querySelectorAll('[data-wk]').forEach(x => x.onclick = () => { SFX.click(); boardSel.weekly = x.dataset.wk === '1'; renderBoards(root); });
  if (!signedIn()) return;
  let rows = [];
  try { rows = await NET.top(boardKey(b.id, weekly)); } catch (e) { $('boardBody').textContent = 'Could not load the leaderboard. Check your connection.'; return; }
  const me = ONLINE.user.uid;
  $('boardBody').innerHTML = rows.length ? `<div class="tbl-wrap"><table class="rec-table board"><thead><tr><th>#</th><th>Summoner</th><th>Lv</th><th>Score</th></tr></thead><tbody>${rows.map((r, i) => `<tr class="${r.uid === me ? 'me' : ''}"><td>${i + 1}</td><td>${String(r.name).replace(/[<>&]/g, '')}</td><td>${r.lv || ''}</td><td>${b.fmt(r.score)}</td></tr>`).join('')}</tbody></table></div>` : 'No scores yet. Be the first!';
}
const _on_buildCodex = buildCodex;
buildCodex = function () {
  if (!document.querySelector('#codexTabs [data-tab="boards"]')) {
    const t = document.createElement('button'); t.className = 'tab'; t.dataset.tab = 'boards'; t.textContent = 'Leaderboards';
    t.onclick = () => { SFX.click(); codexTab = 'boards'; buildCodex(); };
    $('codexTabs').appendChild(t);
  }
  if (codexTab !== 'boards') { _on_buildCodex(); return; }
  document.querySelectorAll('#codexTabs .tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'boards'));
  renderBoards($('codexContent'));
};
// start quietly in the background when online features are configured
if (NET) setTimeout(onlineInit, 1500);
