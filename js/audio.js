'use strict';
// ---------- Synthesized sound effects + generative music (Web Audio, no files) ----------

const AUDIO = { ac: null, master: null, sfxBus: null, musicBus: null, noiseBuf: null, muted: false, pan: 0 };
// stereo position for the next sounds, from a world x coordinate
function panAt(x) { if (!W || !W.active) return; AUDIO.pan = clamp((x - W.camX) * ZOOM / (VW / 2), -0.85, 0.85); }
function makeIR(ac, sec) {
  const len = Math.floor(ac.sampleRate * sec), buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  return buf;
}

const SFX = (() => {
  const last = {};
  function init() {
    if (AUDIO.ac) { if (AUDIO.ac.state === 'suspended') AUDIO.ac.resume(); return; }
    try {
      const ac = AUDIO.ac = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ac.createDynamicsCompressor();
      AUDIO.master = ac.createGain(); AUDIO.sfxBus = ac.createGain(); AUDIO.musicBus = ac.createGain();
      AUDIO.sfxBus.connect(AUDIO.master); AUDIO.musicBus.connect(AUDIO.master);
      AUDIO.master.connect(comp); comp.connect(ac.destination);
      // shared reverb: effects get a little room, music gets more
      const verb = ac.createConvolver(); verb.buffer = makeIR(ac, 2.4);
      const wet = ac.createGain(); wet.gain.value = 0.32; verb.connect(wet); wet.connect(AUDIO.master);
      const sfxSend = ac.createGain(); sfxSend.gain.value = 0.2; AUDIO.sfxBus.connect(sfxSend); sfxSend.connect(verb);
      const musSend = ac.createGain(); musSend.gain.value = 0.45; AUDIO.musicBus.connect(musSend); musSend.connect(verb);
      AUDIO.noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = AUDIO.noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      applyVolumes();
      MUSIC.resume();
    } catch (e) { AUDIO.ac = null; }
  }
  function applyVolumes() {
    if (!AUDIO.ac) return;
    AUDIO.master.gain.value = AUDIO.muted ? 0 : SETTINGS.master * 0.6;
    AUDIO.sfxBus.gain.value = SETTINGS.sfx;
    AUDIO.musicBus.gain.value = SETTINGS.music * 0.9;
  }
  function setMuted(m) { AUDIO.muted = m; applyVolumes(); }
  function gate(name, gap) {
    if (!AUDIO.ac || AUDIO.muted) return false;
    const n = AUDIO.ac.currentTime;
    if (last[name] && n - last[name] < gap) return false;
    last[name] = n; return true;
  }
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
  const note = (base, semi) => base * Math.pow(2, semi / 12);

  return {
    init, setMuted, applyVolumes, get muted() { return AUDIO.muted; },
    summon(rank = 0) {
      if (!gate('summon', 0.05)) return;
      const base = 260 + rank * 30;
      for (let i = 0; i < 4; i++) tone({ type: 'triangle', f: note(base, PENTA[i + (rank % 3)]), dur: 0.35, vol: 0.09, delay: i * 0.045 });
      tone({ type: 'sine', f: base * 0.5, f2: base * 2, dur: 0.4, vol: 0.08 });
      noise({ f: 3000, f2: 8000, ftype: 'bandpass', q: 2, dur: 0.35, vol: 0.06, attack: 0.08 });
      tone({ type: 'sine', f: 110, f2: 55, dur: 0.3, vol: 0.12 });
      for (let i = 0; i < 3; i++) tone({ type: 'sine', f: note(base * 4, PENTA[(i + rank) % 8]), dur: 0.25, vol: 0.025, delay: 0.18 + i * 0.05 });
    },
    skill() {
      if (!gate('skill', 0.1)) return;
      [0, 7, 12, 19, 24].forEach((s, i) => tone({ type: 'square', f: note(330, s), dur: 0.22, vol: 0.05, delay: i * 0.035, lp: 3000 }));
      noise({ f: 800, f2: 6000, ftype: 'bandpass', q: 2, dur: 0.4, vol: 0.08 });
    },
    hit() { if (!gate('hit', 0.045)) return; noise({ f: 2200, f2: 600, dur: 0.07, vol: 0.07 }); tone({ type: 'square', f: 2400, dur: 0.02, vol: 0.025, lp: 5000 }); },
    die() { if (!gate('die', 0.06)) return; tone({ type: 'square', f: 420, f2: 90, dur: 0.12, vol: 0.05, lp: 2000 }); },
    throw_() { if (!gate('throw', 0.1)) return; tone({ type: 'sine', f: 900, f2: 500, dur: 0.05, vol: 0.03 }); },
    exp() { if (!gate('exp', 0.035)) return; tone({ type: 'sine', f: rand(1300, 1700), dur: 0.06, vol: 0.035 }); },
    stone() { if (!gate('stone', 0.06)) return; tone({ type: 'triangle', f: 1800, dur: 0.25, vol: 0.07 }); tone({ type: 'sine', f: 2700, dur: 0.2, vol: 0.05, delay: 0.05 }); },
    level() {
      if (!gate('level', 0.3)) return;
      [0, 4, 7, 12, 16].forEach((s, i) => tone({ type: 'triangle', f: note(392, s), dur: 0.45, vol: 0.12, delay: i * 0.08 }));
      noise({ f: 6000, ftype: 'highpass', dur: 0.6, vol: 0.04, attack: 0.2 });
      [0, 4, 7].forEach(s2 => tone({ type: 'sawtooth', f: note(196, s2), dur: 1.1, vol: 0.025, attack: 0.25, lp: 1600, pan: 0 }));
    },
    hurt() { if (!gate('hurt', 0.12)) return; tone({ type: 'sawtooth', f: 160, f2: 60, dur: 0.18, vol: 0.12, lp: 800 }); },
    roar() {
      if (!gate('roar', 0.5)) return;
      tone({ type: 'sawtooth', f: 90, f2: 45, dur: 1.4, vol: 0.18, attack: 0.15, lp: 600 });
      tone({ type: 'sawtooth', f: 96, f2: 48, dur: 1.4, vol: 0.14, attack: 0.15, lp: 500 });
      noise({ f: 500, f2: 150, dur: 1.2, vol: 0.12, attack: 0.1 });
    },
    boom(big) {
      if (!gate('boom', 0.08)) return;
      noise({ f: big ? 900 : 1500, f2: 80, dur: big ? 0.9 : 0.4, vol: big ? 0.3 : 0.16 });
      tone({ type: 'sine', f: 120, f2: 35, dur: big ? 0.7 : 0.3, vol: 0.2 });
      noise({ f: 6000, ftype: 'highpass', dur: big ? 0.6 : 0.25, vol: 0.05, delay: 0.03 });
      if (big) tone({ type: 'sine', f: 55, f2: 28, dur: 1.2, vol: 0.22 });
    },
    whoosh() { if (!gate('whoosh', 0.08)) return; noise({ f: 600, f2: 2400, ftype: 'bandpass', q: 3, dur: 0.22, vol: 0.08, attack: 0.05 }); },
    enhance() {
      if (!gate('enh', 0.2)) return;
      [0, 7, 12, 19].forEach((s, i) => tone({ type: 'sawtooth', f: note(220, s), dur: 0.6, vol: 0.05, delay: i * 0.05, lp: 2500 }));
      noise({ f: 1200, f2: 5000, ftype: 'bandpass', q: 2, dur: 0.6, vol: 0.06, attack: 0.1 });
    },
    swap() { if (!gate('swap', 0.15)) return; tone({ type: 'sine', f: 400, f2: 1600, dur: 0.15, vol: 0.1 }); tone({ type: 'sine', f: 1600, f2: 400, dur: 0.15, vol: 0.1, delay: 0.12 }); },
    fail() { if (!gate('fail', 0.25)) return; tone({ type: 'square', f: 140, dur: 0.12, vol: 0.06, lp: 900 }); tone({ type: 'square', f: 110, dur: 0.14, vol: 0.06, delay: 0.1, lp: 900 }); },
    click() { if (!gate('click', 0.04)) return; tone({ type: 'triangle', f: 700, f2: 1000, dur: 0.06, vol: 0.06 }); },
    heal() { if (!gate('heal', 0.4)) return; tone({ type: 'sine', f: 660, f2: 990, dur: 0.3, vol: 0.04 }); },
    bubble() { if (!gate('bubble', 0.3)) return; for (let i = 0; i < 3; i++) tone({ type: 'sine', f: rand(500, 900), f2: rand(1200, 1800), dur: 0.08, vol: 0.05, delay: i * 0.06 }); },
    breath() { if (!gate('breath', 0.4)) return; noise({ f: 400, f2: 1800, dur: 1.2, vol: 0.14, attack: 0.1 }); },
    slam() { if (!gate('slam', 0.15)) return; tone({ type: 'sine', f: 90, f2: 40, dur: 0.35, vol: 0.22 }); noise({ f: 700, f2: 100, dur: 0.3, vol: 0.12 }); },
    shoot() { if (!gate('shoot', 0.07)) return; tone({ type: 'sine', f: 700, f2: 1300, dur: 0.1, vol: 0.04 }); },
    victory() { if (!gate('victory', 0.5)) return; [0, 4, 7, 12, 7, 12, 16, 19].forEach((s, i) => tone({ type: 'triangle', f: note(330, s), dur: 0.5, vol: 0.11, delay: i * 0.11 })); },
    defeat() { if (!gate('defeat', 0.5)) return; [12, 8, 5, 0].forEach((s, i) => tone({ type: 'sawtooth', f: note(220, s), dur: 0.6, vol: 0.07, delay: i * 0.22, lp: 1200 })); },
    crit() { if (!gate('crit', 0.06)) return; noise({ f: 4000, f2: 900, dur: 0.09, vol: 0.09 }); tone({ type: 'square', f: 1400, f2: 700, dur: 0.07, vol: 0.05, lp: 4000 }); tone({ type: 'sine', f: 180, f2: 60, dur: 0.12, vol: 0.12 }); },
    hover() { if (!gate('hover', 0.06)) return; tone({ type: 'sine', f: 1500, f2: 1800, dur: 0.035, vol: 0.018, pan: 0 }); },
    uiOpen() { if (!gate('uiopen', 0.15)) return; noise({ f: 500, f2: 2500, ftype: 'bandpass', q: 2, dur: 0.18, vol: 0.045, attack: 0.04, pan: 0 }); tone({ type: 'triangle', f: 520, f2: 780, dur: 0.16, vol: 0.035, pan: 0 }); },
    achievement() { if (!gate('ach', 0.4)) return; [0, 4, 7, 12, 16, 19].forEach((s2, i) => tone({ type: 'triangle', f: note(523, s2), dur: 0.5, vol: 0.08, delay: i * 0.06, pan: 0 })); tone({ type: 'sine', f: note(523, 24), dur: 1.2, vol: 0.05, delay: 0.36, attack: 0.05, pan: 0 }); },
    unlock() { if (!gate('unlock', 0.3)) return; [0, 7, 12, 19, 24].forEach((s2, i) => tone({ type: 'sine', f: note(392, s2), dur: 0.6, vol: 0.07, delay: i * 0.08, pan: 0 })); noise({ f: 2000, f2: 9000, ftype: 'bandpass', q: 1.5, dur: 0.8, vol: 0.05, attack: 0.3, pan: 0 }); },
    fuse() { if (!gate('fuse', 0.5)) return; tone({ type: 'sawtooth', f: 110, f2: 880, dur: 1.2, vol: 0.06, lp: 2400, attack: 0.3, pan: 0 }); tone({ type: 'sawtooth', f: 165, f2: 1320, dur: 1.2, vol: 0.05, lp: 2400, attack: 0.3, pan: 0 }); [0, 4, 7, 12].forEach((s2, i) => tone({ type: 'triangle', f: note(523, s2), dur: 0.9, vol: 0.08, delay: 1.1 + i * 0.07, pan: 0 })); noise({ f: 400, f2: 6000, ftype: 'bandpass', q: 2, dur: 1.3, vol: 0.07, attack: 0.4, pan: 0 }); },
    thunder() { if (!gate('thunder', 1)) return; noise({ f: 1400, f2: 60, dur: 2.2, vol: 0.24, attack: 0.01, pan: rand(-0.6, 0.6) }); tone({ type: 'sine', f: 60, f2: 30, dur: 1.5, vol: 0.18, pan: 0 }); },
    warn() { if (!gate('warn', 0.3)) return; tone({ type: 'square', f: 880, dur: 0.12, vol: 0.05 }); tone({ type: 'square', f: 660, dur: 0.12, vol: 0.05, delay: 0.15 }); },
  };
})();

// shared synth voices; `o.out` selects the bus (default: SFX), `o.at` an absolute start time
function tone(o) {
  const ac = AUDIO.ac; if (!ac) return;
  const t0 = o.at ?? ac.currentTime + (o.delay || 0);
  const osc = ac.createOscillator(), g = ac.createGain();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.f, t0);
  if (o.detune) osc.detune.value = o.detune;
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + o.dur);
  const vol = o.vol ?? 0.2;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  let node = osc;
  if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; node.connect(f); node = f; }
  node.connect(g); routeOut(g, o);
  osc.start(t0); osc.stop(t0 + o.dur + 0.05);
}
function routeOut(g, o) {
  const ac = AUDIO.ac, out = o.out || AUDIO.sfxBus, pan = o.pan ?? (o.out ? 0 : AUDIO.pan);
  if (pan && ac.createStereoPanner) { const pn = ac.createStereoPanner(); pn.pan.value = pan; g.connect(pn); pn.connect(out); }
  else g.connect(out);
}
function noise(o) {
  const ac = AUDIO.ac; if (!ac) return;
  const t0 = o.at ?? ac.currentTime + (o.delay || 0);
  const src = ac.createBufferSource(); src.buffer = AUDIO.noiseBuf;
  const f = ac.createBiquadFilter(); f.type = o.ftype || 'lowpass'; f.Q.value = o.q || 1;
  f.frequency.setValueAtTime(o.f || 1200, t0);
  if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + o.dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.vol ?? 0.2, t0 + (o.attack || 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  src.connect(f); f.connect(g); routeOut(g, o);
  src.start(t0, Math.random() * 0.5); src.stop(t0 + o.dur + 0.05);
}

// ---------- generative music: 16th-note step sequencer, 4-bar chord loops ----------
const MINOR = [0, 2, 3, 5, 7, 8, 10], DORIAN = [0, 2, 3, 5, 7, 9, 10], HARM = [0, 2, 3, 5, 7, 8, 11];
const PHRYG = [0, 1, 3, 5, 7, 8, 10], LYD = [0, 2, 4, 6, 7, 9, 11], PDOM = [0, 1, 4, 5, 7, 8, 10];
const THEMES = {
  menu:  { bpm: 70,  root: 50, scale: DORIAN, prog: [0, 5, 3, 4], arp: [0, 1, 2, 1], arpEvery: 4, arpType: 'sine',     bass: 16, drums: 0, lp: 1100 },
  s0:    { bpm: 84,  root: 55, scale: DORIAN, prog: [0, 3, 4, 0], arp: [0, 2, 1, 2], arpEvery: 2, arpType: 'triangle', bass: 8,  drums: 1, lp: 1400 },
  s1:    { bpm: 80,  root: 52, scale: MINOR,  prog: [0, 5, 6, 4], arp: [0, 1, 2, 3], arpEvery: 2, arpType: 'triangle', bass: 8,  drums: 1, lp: 1200 },
  s2:    { bpm: 72,  root: 57, scale: HARM,   prog: [0, 3, 4, 0], arp: [2, 1, 0, 1], arpEvery: 4, arpType: 'sine',     bass: 16, drums: 0, lp: 1600 },
  s3:    { bpm: 66,  root: 50, scale: PHRYG,  prog: [0, 1, 0, 6], arp: [0, 2, 1, 2], arpEvery: 4, arpType: 'sine',     bass: 16, drums: 0, lp: 900 },
  s4:    { bpm: 92,  root: 48, scale: PDOM,   prog: [0, 1, 0, 6], arp: [0, 1, 2, 1], arpEvery: 2, arpType: 'sawtooth', bass: 8,  drums: 1, lp: 1300 },
  s5:    { bpm: 76,  root: 59, scale: LYD,    prog: [0, 1, 4, 0], arp: [0, 2, 3, 1], arpEvery: 2, arpType: 'sine',     bass: 16, drums: 0, lp: 1800 },
  s6:    { bpm: 98,  root: 46, scale: PHRYG,  prog: [0, 5, 1, 0], arp: [0, 1, 2, 3], arpEvery: 2, arpType: 'square',   bass: 4,  drums: 2, lp: 1200 },
  s7:    { bpm: 90,  root: 45, scale: HARM,   prog: [0, 5, 3, 4], arp: [0, 2, 1, 3], arpEvery: 2, arpType: 'sawtooth', bass: 4,  drums: 2, lp: 1300 },
  boss:  { bpm: 142, root: 45, scale: HARM,   prog: [0, 5, 6, 4], arp: [0, 1, 2, 3], arpEvery: 1, arpType: 'square',   bass: 2,  drums: 3, lp: 2200 },
  a2a:   { bpm: 100, root: 45, scale: PDOM,   prog: [0, 1, 6, 0], arp: [0, 1, 2, 1], arpEvery: 2, arpType: 'sawtooth', bass: 4,  drums: 2, lp: 1400 },
  a2b:   { bpm: 92,  root: 43, scale: HARM,   prog: [0, 5, 3, 4], arp: [0, 2, 1, 3], arpEvery: 2, arpType: 'square',   bass: 4,  drums: 2, lp: 1200 },
  a3a:   { bpm: 84,  root: 57, scale: LYD,    prog: [0, 4, 1, 0], arp: [0, 1, 2, 3], arpEvery: 2, arpType: 'sine',     bass: 8,  drums: 1, lp: 2200 },
  a3b:   { bpm: 96,  root: 52, scale: DORIAN, prog: [0, 6, 5, 4], arp: [0, 2, 3, 1], arpEvery: 2, arpType: 'triangle', bass: 4,  drums: 2, lp: 2000 },
  final: { bpm: 150, root: 43, scale: PHRYG,  prog: [0, 1, 5, 6], arp: [0, 1, 2, 3], arpEvery: 1, arpType: 'sawtooth', bass: 2,  drums: 3, lp: 2600 },
};
const musicKey = i => (i < 8 ? 's' + i : i < 18 ? (i % 2 ? 'a2b' : 'a2a') : (i % 2 ? 'a3b' : 'a3a'));
const MUSIC = (() => {
  let cur = null, want = 'menu', bus = null, step = 0, nextT = 0, timer = null, intensity = 0;
  const motifs = {};
  function motif(key) {
    if (motifs[key]) return motifs[key];
    let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) | 0;
    const rng = mulberry32(h), m = []; let d = 4;
    for (let i = 0; i < 8; i++) { if (i % 2 && rng() < 0.3) { m.push(null); continue; } d = clamp(d + Math.round((rng() - 0.5) * 4), 0, 9); m.push(d); }
    return (motifs[key] = m);
  }
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  function degNote(th, deg, oct) {
    const n = th.scale.length, d = ((deg % n) + n) % n, o = Math.floor(deg / n);
    return th.root + th.scale[d] + 12 * (o + oct);
  }
  function schedule(th, s, t, key) {
    const stepDur = 60 / th.bpm / 4, bar = Math.floor(s / 16) % th.prog.length, deg = th.prog[bar], i = s % 16;
    const chord = [deg, deg + 2, deg + 4, deg + 7];
    if (i === 0) {
      for (const cdeg of chord.slice(0, 3)) {
        const f = mf(degNote(th, cdeg, 0));
        tone({ at: t, type: 'sawtooth', f, dur: stepDur * 16, vol: 0.022, attack: 0.5, lp: th.lp * 0.6, out: bus, detune: -7 });
        tone({ at: t, type: 'sawtooth', f, dur: stepDur * 16, vol: 0.022, attack: 0.5, lp: th.lp * 0.6, out: bus, detune: 7 });
      }
    }
    if (i % th.arpEvery === 0) {
      const k = Math.floor(i / th.arpEvery) % th.arp.length;
      const f = mf(degNote(th, chord[th.arp[k]], th.drums >= 3 ? 1 : 2));
      tone({ at: t, type: th.arpType, f, dur: stepDur * Math.min(4, th.arpEvery * 1.6), vol: th.arpType === 'sine' ? 0.05 : 0.028, lp: th.lp, out: bus });
    }
    const I = intensity, barK = Math.floor(s / 16) % 4;
    // lead melody: motif A on bars 1 & 3, a lifted variation on bar 2, rest on bar 4
    if (i % 2 === 0 && barK !== 3) {
      const mo = motif(key)[(i / 2) % 8];
      if (mo !== null) {
        const lf = mf(degNote(th, mo + (barK === 1 ? 2 : 0), th.drums >= 3 ? 1 : 1));
        const lt = th.drums >= 3 ? 'square' : key === 'menu' ? 'sine' : 'triangle';
        tone({ at: t, type: lt, f: lf, dur: stepDur * 2.6, vol: (lt === 'square' ? 0.018 : 0.032) * (0.8 + I * 0.4), lp: 2800, out: bus });
        tone({ at: t, type: 'sine', f: lf * 2, dur: stepDur * 2, vol: 0.01, detune: 9, out: bus });
      }
    }
    if (i % th.bass === 0) tone({ at: t, type: th.drums >= 3 ? 'sawtooth' : 'sine', f: mf(degNote(th, deg, -1)), dur: stepDur * Math.min(th.bass, 6), vol: (th.drums >= 3 ? 0.06 : 0.09) * (0.75 + I * 0.5), lp: 500, out: bus });
    // adaptive layer: crowded battles add a pulse and hats even in calm themes
    if (key !== 'menu' && I > 0.45 && th.drums < 2 && (i === 8 || i === 0)) tone({ at: t, type: 'sine', f: 130, f2: 42, dur: 0.2, vol: 0.12 * I, out: bus });
    if (key !== 'menu' && I > 0.3 && th.drums < 1 && i % 4 === 2) noise({ at: t, f: 8000, ftype: 'highpass', dur: 0.035, vol: 0.02 * I, out: bus });
    if (th.drums >= 1 && (i === 0 || (th.drums >= 2 && i === 8) || (th.drums >= 3 && (i === 4 || i === 12 || i === 10)))) {
      tone({ at: t, type: 'sine', f: 140, f2: 40, dur: 0.22, vol: th.drums >= 3 ? 0.3 : 0.18, out: bus });
    }
    if (th.drums >= 2 && (i === 4 || i === 12)) noise({ at: t, f: 2200, f2: 900, ftype: 'bandpass', q: 0.8, dur: 0.16, vol: th.drums >= 3 ? 0.12 : 0.07, out: bus });
    if (th.drums >= 1 && i % (th.drums >= 3 ? 2 : 4) === 2) noise({ at: t, f: 8000, ftype: 'highpass', dur: 0.04, vol: 0.03, out: bus });
  }
  function tick() {
    const ac = AUDIO.ac; if (!ac || !cur) return;
    const th = THEMES[cur];
    if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
    while (nextT < ac.currentTime + 0.15) { schedule(th, step, nextT, cur); nextT += 60 / th.bpm / 4; step++; }
  }
  function start(key) {
    const ac = AUDIO.ac;
    if (bus) { const old = bus; old.gain.setTargetAtTime(0, ac.currentTime, 0.4); setTimeout(() => old.disconnect(), 2500); }
    cur = key; step = 0; nextT = ac.currentTime + 0.1;
    if (!key) { bus = null; return; }
    bus = ac.createGain(); bus.gain.value = 0.0001; bus.connect(AUDIO.musicBus);
    bus.gain.setTargetAtTime(1, ac.currentTime, 0.6);
    if (!timer) timer = setInterval(tick, 40);
  }
  return {
    play(key) { want = key; if (AUDIO.ac && cur !== key) start(key); },
    stop() { want = null; if (AUDIO.ac) start(null); },
    resume() { if (AUDIO.ac && want && cur !== want) start(want); },
    setIntensity(v) { intensity += (v - intensity) * 0.02; },
  };
})();

// ---------- creature voices: every rank has its own call; bosses get a unique cry ----------
const VOICE_LAST = {};
function voiceCard(id, attack) {
  const ac = AUDIO.ac, c = CARDS[id];
  if (!ac || AUDIO.muted || !c) return;
  const kind = c.rank === 'fusion' ? c.tags[0] : c.rank;
  const now = ac.currentTime;
  if (VOICE_LAST[kind] && now - VOICE_LAST[kind] < (attack ? 0.5 : 0.15)) return;
  VOICE_LAST[kind] = now;
  const big = (c.r || 12) / 14, pitch = 1 / clamp(big, 0.6, 1.8), v = attack ? 0.6 : 1;
  switch (kind) {
    case 'insect': tone({ type: 'sawtooth', f: 240 * pitch, f2: 300 * pitch, dur: 0.22, vol: 0.035 * v, lp: 2200, detune: 25 }); tone({ type: 'sawtooth', f: 246 * pitch, f2: 290 * pitch, dur: 0.22, vol: 0.03 * v, lp: 2200, detune: -25 }); break;
    case 'beast':
      if (big > 1.2) { tone({ type: 'sawtooth', f: 85 * pitch, f2: 60, dur: 0.45, vol: 0.08 * v, lp: 420 }); noise({ f: 300, f2: 120, dur: 0.4, vol: 0.05 * v }); }
      else { tone({ type: 'sine', f: 330 * pitch, f2: 560 * pitch, dur: 0.3, vol: 0.05 * v }); tone({ type: 'sine', f: 560 * pitch, f2: 400 * pitch, dur: 0.4, vol: 0.045 * v, delay: 0.28 }); }
      break;
    case 'bird': tone({ type: 'square', f: 2000 * pitch, f2: 1200 * pitch, dur: 0.16, vol: 0.03 * v, lp: 5000 }); noise({ f: 3200, ftype: 'bandpass', q: 4, dur: 0.14, vol: 0.04 * v }); break;
    case 'grass': [0, 7, 12].forEach((st, i) => tone({ type: 'sine', f: 880 * Math.pow(2, st / 12), dur: 0.5, vol: 0.03 * v, delay: i * 0.05 })); break;
    case 'stone': tone({ type: 'sine', f: 70, f2: 38, dur: 0.6, vol: 0.14 * v }); noise({ f: 250, f2: 80, dur: 0.5, vol: 0.08 * v }); break;
    case 'fish': for (let i = 0; i < 3; i++) tone({ type: 'sine', f: 420 + i * 160, f2: 1300 + i * 200, dur: 0.07, vol: 0.04 * v, delay: i * 0.07 }); break;
    case 'spirit': noise({ f: 1800, f2: 3200, ftype: 'bandpass', q: 9, dur: 0.5, vol: 0.06 * v, attack: 0.15 }); tone({ type: 'sine', f: 660 * pitch, f2: 620 * pitch, dur: 0.5, vol: 0.025 * v, attack: 0.12 }); break;
    case 'dragon': tone({ type: 'sawtooth', f: 150 * pitch, f2: 70, dur: 0.9, vol: 0.1 * v, lp: 900, attack: 0.05 }); tone({ type: 'sawtooth', f: 155 * pitch, f2: 72, dur: 0.9, vol: 0.08 * v, lp: 800, attack: 0.05 }); noise({ f: 900, f2: 200, dur: 0.8, vol: 0.07 * v, attack: 0.05 }); break;
    case 'celestial': [0, 4, 7, 11].forEach((st, i) => tone({ type: 'triangle', f: 523 * Math.pow(2, st / 12), dur: 0.9, vol: 0.03 * v, attack: 0.2, delay: i * 0.03 })); break;
  }
  if (c.rank === 'fusion' && !attack) tone({ type: 'sine', f: 1760, f2: 2640, dur: 0.4, vol: 0.03, delay: 0.1 });
}
function voiceBoss(bd, x) {
  const ac = AUDIO.ac;
  if (!ac || AUDIO.muted) return;
  let h = 0; for (const ch of bd.name) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const base = 55 + (Math.abs(h) % 60), keep = AUDIO.pan;
  if (x !== undefined) panAt(x);
  tone({ type: 'sawtooth', f: base * 2, f2: base, dur: 1.6, vol: 0.16, lp: 700, attack: 0.12 });
  tone({ type: 'square', f: base * 3.01, f2: base * 1.5, dur: 1.3, vol: 0.05, lp: 1200, attack: 0.1, delay: 0.05 });
  noise({ f: 800, f2: 120, dur: 1.4, vol: 0.12, attack: 0.1 });
  if (bd.final || bd.world) tone({ type: 'sine', f: base / 2, f2: base / 3, dur: 2.2, vol: 0.2, attack: 0.2 });
  AUDIO.pan = keep;
}
