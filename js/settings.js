'use strict';
// ---------- Settings + rebindable controls (stored separately from the save, so they survive New Game) ----------

const SETTINGS_KEY = 'summoner_settings_v1';
// Every action has two bindings. Numpad defaults let you play two-handed: WASD on the left, numpad on the right.
// ev.code is the physical key, so numpad keys work whether Num Lock is on or off.
const ACTIONS = [
  { id: 'up',      name: 'Move up',            def: ['KeyW', 'ArrowUp'] },
  { id: 'down',    name: 'Move down',          def: ['KeyS', 'ArrowDown'] },
  { id: 'left',    name: 'Move left',          def: ['KeyA', 'ArrowLeft'] },
  { id: 'right',   name: 'Move right',         def: ['KeyD', 'ArrowRight'] },
  { id: 'slot1',   name: 'Summon slot 1',      def: ['Digit1', 'Numpad1'] },
  { id: 'slot2',   name: 'Summon slot 2',      def: ['Digit2', 'Numpad2'] },
  { id: 'slot3',   name: 'Summon slot 3',      def: ['Digit3', 'Numpad3'] },
  { id: 'slot4',   name: 'Summon slot 4',      def: ['Digit4', 'Numpad4'] },
  { id: 'slot5',   name: 'Summon slot 5',      def: ['Digit5', 'Numpad5'] },
  { id: 'slot6',   name: 'Summon slot 6',      def: ['Digit6', 'Numpad6'] },
  { id: 'slot7',   name: 'Summon slot 7',      def: ['Digit7', ''] },
  { id: 'slot8',   name: 'Summon slot 8',      def: ['Digit8', ''] },
  { id: 'slot9',   name: 'Summon slot 9',      def: ['Digit9', ''] },
  { id: 'slot10',  name: 'Summon slot 10',     def: ['Digit0', ''] },
  { id: 'skillMod', name: 'Special skill (hold + slot key)', def: ['Shift', 'Numpad0'] },
  { id: 'dash',    name: 'Dash',               def: ['Space', 'NumpadEnter'] },
  { id: 'enhance', name: 'Enhance',            def: ['KeyQ', 'Numpad7'] },
  { id: 'swap',    name: 'Swap',               def: ['KeyE', 'Numpad8'] },
  { id: 'recall',  name: 'Recall',             def: ['KeyR', 'Numpad9'] },
  { id: 'map',     name: 'Toggle minimap',     def: ['Tab', 'NumpadDecimal'] },
  { id: 'pause',   name: 'Pause',              def: ['Escape', 'KeyP'] },
  { id: 'mute',    name: 'Mute',               def: ['KeyM', ''] },
];
const SKILL_ACTION = { dash: 'Space', enhance: 'KeyQ', swap: 'KeyE', recall: 'KeyR' };   // action -> SKILLS key

function defaultSettings() {
  const keys = {};
  for (const a of ACTIONS) keys[a.id] = [...a.def];
  return { master: 0.8, music: 0.55, sfx: 0.8, shake: 1, dmgNums: true, minimap: true, touch: 'auto', keys };
}
let SETTINGS = defaultSettings();
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const o = JSON.parse(raw), d = defaultSettings();
    SETTINGS = Object.assign(d, o);
    SETTINGS.keys = Object.assign(d.keys, o.keys || {});
  } catch (e) { /* keep defaults */ }
}
function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); } catch (e) { /* storage unavailable */ }
}

// code -> action id (rebuilt when bindings change)
let KEYMAP = {};
function rebuildKeymap() {
  KEYMAP = {};
  for (const a of ACTIONS) for (const k of SETTINGS.keys[a.id]) if (k && k !== 'Shift') KEYMAP[k] = a.id;
}
const bound = (action, code) => SETTINGS.keys[action].includes(code);
function actionHeld(action) {
  for (const k of SETTINGS.keys[action]) {
    if (!k) continue;
    if (k === 'Shift' ? (INPUT.keys.has('ShiftLeft') || INPUT.keys.has('ShiftRight')) : INPUT.keys.has(k)) return true;
  }
  return false;
}
function setBinding(action, idx, code) {
  if (code === 'ShiftLeft' || code === 'ShiftRight') code = 'Shift';
  // a key can only do one thing: remove it from every other action
  for (const a of ACTIONS) SETTINGS.keys[a.id] = SETTINGS.keys[a.id].map(k => (k === code ? '' : k));
  SETTINGS.keys[action][idx] = code;
  rebuildKeymap(); saveSettings();
}
function keyName(code) {
  if (!code) return '—';
  const map = {
    Space: 'Space', Shift: 'Shift', Escape: 'Esc', Tab: 'Tab', Enter: 'Enter', Backspace: 'Bksp',
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', NumpadEnter: 'Num Enter',
    NumpadAdd: 'Num +', NumpadSubtract: 'Num −', NumpadMultiply: 'Num ×', NumpadDivide: 'Num ÷', NumpadDecimal: 'Num .',
    ControlLeft: 'Ctrl', ControlRight: 'R-Ctrl', AltLeft: 'Alt', AltRight: 'R-Alt', CapsLock: 'Caps',
    Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backslash: '\\',
  };
  if (map[code]) return map[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num ' + code.slice(6);
  return code;
}
const keyLabel = action => SETTINGS.keys[action].filter(Boolean).map(keyName).join(' / ') || 'unbound';
const key1 = action => keyName(SETTINGS.keys[action].find(Boolean));

loadSettings();
rebuildKeymap();
