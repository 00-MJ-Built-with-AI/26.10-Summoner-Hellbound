'use strict';
// ---------- Languages: English (built in) and Arabic (right-to-left). The choice is kept with the settings;
//            switching reloads the page so every screen is rebuilt in the new language. ----------

const LANGS = { en: 'English', ar: 'العربية' };
if (SETTINGS.lang === undefined) SETTINGS.lang = 'en';
V6_SETTINGS.lang = 'en';
const LANG = (() => { const q = new URLSearchParams(location.search).get('lang'); return LANGS[q] ? q : LANGS[SETTINGS.lang] ? SETTINGS.lang : 'en'; })();
const T_CACHE = new Map();
const LATIN = /[A-Za-z]{2}/;
const T = s => (LANG === 'en' ? s : trAr(s));
function trAr(s) {
  if (typeof s !== 'string' || !LATIN.test(s)) return s;
  if (T_CACHE.has(s)) return T_CACHE.get(s);
  if (s.includes('\n')) return s.split('\n').map(trAr).join('\n');
  let out = AR_UI[s];
  if (out === undefined) {
    out = s;
    for (const [re, rep] of AR_PATTERNS) {
      const m = s.match(re);
      if (!m) continue;
      out = typeof rep === 'function' ? rep(...m) : rep.replace(/\$(\d)/g, (_, i) => trAr(m[+i] || ''));
      break;
    }
  }
  if (T_CACHE.size < 5000) T_CACHE.set(s, out);
  return out;
}

function applyArabicData() {
  // cards and special skills (fusion "X Ascendant" skills reuse the parent skill's Arabic name)
  const skillAr = {};
  for (const id of CARD_IDS) { const a = AR_CARDS[id]; if (a && a[3] && CARD_SKILLS[id]) skillAr[CARD_SKILLS[id].name] = a[3]; }
  for (const id of CARD_IDS) {
    const c = CARDS[id], a = AR_CARDS[id], sk = CARD_SKILLS[id];
    if (a) { c.name = a[0]; c.role = a[1]; c.desc = a[2]; }
    if (sk) {
      const base = sk.name.replace(/ Ascendant$/, '');
      sk.name = (a && a[3]) || (skillAr[base] ? `${skillAr[base]} المتسامية` : sk.name);
      sk.desc = AR_SKILL_DESC[sk.desc] || sk.desc;
    }
  }
  for (const k in ENEMIES) { const a = AR_ENEMIES[k]; if (a) { ENEMIES[k].name = a[0]; if (a[1]) LORE[k] = a[1]; } }
  for (const k in BOSSES) {
    const b = BOSSES[k], a = AR_BOSSES[b.base || k];
    if (!a) continue;
    if (b.base) { b.name = `${a[0]} المستيقظ`; b.title = 'نهض مرة أخرى، أقوى من قبل'; }
    else { b.name = a[0]; b.title = a[1]; if (a[2]) LORE[k] = a[2]; (b.phases || []).forEach((p, i) => { if (a[3 + i]) p.name = a[3 + i]; }); }
  }
  STAGES.forEach((s, i) => { const a = AR_STAGES[i]; if (a) { s.name = a[0]; s.blurb = a[1]; } });
  REGIONS.forEach((r, i) => { const a = AR_REGIONS[i]; if (a) { r.name = a[0]; r.act = a[1]; } });
  for (const r of RANKS) if (AR_RANKS[r.id]) r.name = AR_RANKS[r.id];
  // story: keep structure, swap speakers and lines
  const swap = (lines, ar) => lines.forEach((l, i) => { l[0] = AR_SPEAKERS[l[0]] || l[0]; if (ar && ar[i]) l[1] = ar[i]; });
  for (const k in STORY) {
    if (k === 'pre') { for (const i in STORY.pre) if (STORY.pre[i]) swap(STORY.pre[i], AR_STORY.pre[i]); }
    else if (Array.isArray(STORY[k])) swap(STORY[k], AR_STORY[k]);
  }
  for (const a of ACHIEVEMENTS) { const t = AR_ACH[a.id]; if (t) { a.name = t[0]; a.desc = t[1]; } }
  for (const r of RELICS) { if (AR_RELICS[r.id]) r.name = AR_RELICS[r.id]; if (AR_RELIC_EFF[r.eff]) r.desc = AR_RELIC_EFF[r.eff]; }
  for (const u of RUN_UPGRADES) { const t = AR_RUNUPS[u.id]; if (t) { u.name = t[0]; u.desc = t[1]; } }
  for (const k in RU_RARITY) RU_RARITY[k].label = AR_RARITY[RU_RARITY[k].label] || RU_RARITY[k].label;
  for (const b of BOOSTS) { const t = AR_BOOSTS[b.id]; if (t) { b.name = t[0]; b.desc = t[1]; } }
  for (const t of TALENTS) { const a = AR_TALENTS[t.id]; if (a) { t.name = a[0]; t.desc = a[1]; } }
  for (const k in SYNERGIES) { const a = AR_SYN[k]; if (a) { SYNERGIES[k].name = a[0]; SYNERGIES[k].desc = a[1]; } }
  for (const s of SKILLS) { const a = AR_SKILLS[s.key]; if (a) { s.name = a[0]; s.desc = a[1]; } }
  for (const k in COMPANIONS) { const a = AR_COMP[k]; if (a) Object.assign(COMPANIONS[k], { name: a[0], title: a[1], desc: a[2], unlock: a[3] }); }
  for (const k in HERO_SKILLS) { const a = AR_HERO_SKILLS[k]; if (a) Object.assign(HERO_SKILLS[k], { name: a[0], desc: a[1] }); }
  for (const o of OUTFITS) { const a = AR_OUTFITS[o.id]; if (a) { o.name = a[0]; o.req = a[1]; } }
  for (const o of CIRCLES) { const a = AR_CIRCLES[o.id]; if (a) { o.name = a[0]; o.req = a[1]; } }
  for (const k in MATS) { const a = AR_MATS[k]; if (a) { MATS[k].name = a[0]; MATS[k].from = a[1]; } }
  for (const c of CURSES) { const a = AR_CURSES[c.id]; if (a) { c.name = a[0]; c.desc = a[1]; } }
  for (const b of BUILDINGS) { const a = AR_BUILDINGS[b.id]; if (a) { b.name = a[0]; b.fmt = a[1]; } }
  for (const s of SKINS) { const a = AR_SKINS[s.id]; if (a) { s.name = a[0]; s.from = a[1]; } }
  for (const k in EVO_STYLES) { const a = AR_EVO[k]; if (a) Object.assign(EVO_STYLES[k], { name: a[0], desc: a[1], sk: a[2] }); }
  for (const p of RIFT_PERKS) { const a = AR_PERKS[p.id]; if (a) { p.name = a[0]; p.desc = a[1]; } }
  for (const e of EVENTS) {
    const a = AR_EVENTS[e.id]; if (!a) continue;
    e.name = a.name; e.blurb = a.blurb; e.stage.name = a.stage; e.currency.name = a.currency;
    for (const it of e.shop) if (a.shop[it.id]) it.name = a.shop[it.id];
  }
  for (const k in MODES) { const a = AR_MODES[k]; if (a) MODES[k].name = a[0]; }
  for (const w of WEEKLY_POOL) { const a = AR_WEEKLY[w.id]; if (a) { w.name = a[0]; w.desc = a[1]; } }
  ARENA_RANKS.forEach((r, i) => { if (AR_ARENA[i]) r.name = AR_ARENA[i]; });
  WHATS_NEW.splice(0, WHATS_NEW.length, ...AR_WHATSNEW);
  for (const k in AR_TIPS) TIPS[k] = AR_TIPS[k];
  if (typeof EQUIP !== 'undefined') for (const e of EQUIP) if (AR_EQUIP[e.id]) e.name = AR_EQUIP[e.id];
  for (const a of ACTIONS) a.name = T(a.name);
}

// translate text already on the page, then everything added or changed later
function trText(n) {
  const v = n.nodeValue;
  if (!v || !LATIN.test(v)) return;
  const t = v.trim(), r = T(t);
  if (r !== t) n.nodeValue = v.replace(t, r);
}
function trAttrs(el) {
  for (const a of ['title', 'placeholder']) { const v = el.getAttribute && el.getAttribute(a); if (v && LATIN.test(v)) { const r = T(v.trim()); if (r !== v.trim()) el.setAttribute(a, r); } }
}
function trTree(root) {
  if (root.nodeType === 3) { trText(root); return; }
  if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|CANVAS)$/.test(root.tagName)) return;
  trAttrs(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { if (n.nodeType === 3) trText(n); else trAttrs(n); }
}
function startArabic() {
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
  document.title = 'المستدعي: غريموار الجحيم';
  const f = document.createElement('link');
  f.rel = 'stylesheet'; f.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&family=Reem+Kufi:wght@600;700&display=swap';
  document.head.appendChild(f);
  applyArabicData();
  trTree(document.body);
  new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'characterData') trText(m.target);
      else if (m.type === 'attributes') trAttrs(m.target);
      else for (const n of m.addedNodes) trTree(n);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'placeholder'] });
  // text drawn on the canvas and short messages
  const _txt = txt; txt = function (x, y, text, ...rest) { return _txt(x, y, typeof text === 'string' ? T(text) : text, ...rest); };
}
if (LANG === 'ar') startArabic();

// language picker: Settings → Display, and two buttons on the title screen
function setLanguage(l) {
  if (!LANGS[l] || l === SETTINGS.lang) return;
  SETTINGS.lang = l; saveSettings();
  if (SAVE) saveGame();
  location.reload();
}
(function addLanguagePickers() {
  const q = document.querySelector('#scr-settings [data-set="quality"]');
  const row = q && q.closest('.set-row');
  if (row) {
    row.insertAdjacentHTML('beforebegin', `<label class="set-row">${LANG === 'ar' ? 'اللغة' : 'Language'} <select id="langSel">${Object.entries(LANGS).map(([k, n]) => `<option value="${k}" ${k === LANG ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`);
    document.getElementById('langSel').onchange = ev => setLanguage(ev.target.value);
  }
  const title = document.getElementById('scr-title');
  if (title) {
    const box = document.createElement('div');
    box.className = 'lang-switch';
    box.innerHTML = Object.entries(LANGS).map(([k, n]) => `<button class="btn small ${k === LANG ? 'primary' : 'ghost'}" data-lang="${k}">${n}</button>`).join('');
    box.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => setLanguage(b.dataset.lang));
    title.appendChild(box);
  }
})();
