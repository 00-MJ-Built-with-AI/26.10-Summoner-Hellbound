'use strict';
// ---------- Touch controls: floating joystick (left), tap/long-press cards, skill buttons ----------

function detectTouch() {
  if (SETTINGS.touch === 'on') return true;
  if (SETTINGS.touch === 'off') return false;
  return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
}
function applyTouchMode() {
  INPUT.touchMode = detectTouch();
  document.body.classList.toggle('touch', INPUT.touchMode);
  if (!INPUT.touchMode) INPUT.joy = null;
}

const JOY = { id: null, ox: 0, oy: 0 };
function initTouch() {
  const base = $('joyBase'), knob = $('joyKnob');
  const R = 60;
  const show = (x, y) => { base.style.display = 'block'; base.style.left = x + 'px'; base.style.top = y + 'px'; };
  cv.addEventListener('touchstart', ev => {
    if (!INPUT.touchMode || STATE !== 'play') return;
    SFX.init();
    for (const t of ev.changedTouches) {
      if (JOY.id === null && t.clientX < VW * 0.6) {
        JOY.id = t.identifier; JOY.ox = t.clientX; JOY.oy = t.clientY;
        show(t.clientX, t.clientY); knob.style.transform = 'translate(-50%,-50%)';
        INPUT.joy = { x: 0, y: 0 };
      }
    }
    ev.preventDefault();
  }, { passive: false });
  cv.addEventListener('touchmove', ev => {
    for (const t of ev.changedTouches) {
      if (t.identifier !== JOY.id) continue;
      let dx = t.clientX - JOY.ox, dy = t.clientY - JOY.oy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      const m = Math.min(1, d / R);
      INPUT.joy = d > 6 ? { x: (dx / (Math.hypot(dx, dy) || 1)) * m, y: (dy / (Math.hypot(dx, dy) || 1)) * m } : { x: 0, y: 0 };
    }
    ev.preventDefault();
  }, { passive: false });
  const end = ev => {
    for (const t of ev.changedTouches) if (t.identifier === JOY.id) { JOY.id = null; INPUT.joy = null; base.style.display = 'none'; }
  };
  cv.addEventListener('touchend', end);
  cv.addEventListener('touchcancel', end);
  window.matchMedia && window.matchMedia('(pointer: coarse)').addEventListener?.('change', applyTouchMode);
}

// hotbar slot: tap = summon, long-press = special skill (touch); click = summon, shift-click = skill (mouse)
function bindSlot(el, i) {
  let timer = null, fired = false;
  el.addEventListener('pointerdown', ev => {
    ev.stopPropagation(); ev.preventDefault();
    SFX.init();
    if (ev.pointerType === 'mouse') { if (ev.shiftKey || ev.button === 2) useCardSkill(i); else trySummon(i); return; }
    fired = false;
    el.classList.add('pressing');
    timer = setTimeout(() => { fired = true; timer = null; el.classList.remove('pressing'); useCardSkill(i); if (navigator.vibrate) navigator.vibrate(30); }, 420);
  });
  const release = ev => {
    el.classList.remove('pressing');
    if (timer) { clearTimeout(timer); timer = null; if (!fired && ev.type === 'pointerup') trySummon(i); }
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('pointerleave', release);
  el.addEventListener('contextmenu', ev => ev.preventDefault());
}
