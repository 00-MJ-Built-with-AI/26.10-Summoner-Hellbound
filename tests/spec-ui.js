'use strict';
// ---------- Interface: screens, map, Grimoire, Codex, settings, HUD, keyboard/controller/touch, rendering, audio ----------

const visible = id => document.getElementById(id).classList.contains('active');

group('Menus', () => {
  test('every screen opens', () => {
    H.save({ level: 20, cleared: 12 });
    const bad = [];
    for (const s of ['title', 'newgame', 'map', 'grimoire', 'codex', 'settings', 'help', 'pause', 'result']) {
      try { showScreen(s); if (!visible('scr-' + s)) bad.push(s + ' not visible'); } catch (e) { bad.push(s + ': ' + e.message); }
    }
    expect(bad, 'screens').toBeEmpty();
  });
  test('New Game creates a save in the chosen difficulty', () => {
    localStorage.removeItem(SAVE_KEY);
    showScreen('title');
    document.getElementById('btnNew').click();
    document.querySelector('.mode-card[data-mode=hell]').click();
    expect(SAVE.mode, 'mode').toBe('hell');
    expect(STATE, 'went to the map').toBe('map');
    expect(!!loadSave(), 'saved').toBeTruthy();
  });
  test('the map shows 3 acts, locks regions and opens every mode panel', () => {
    H.save({ level: 30, cleared: 9 });
    selectedRegion = null; showScreen('map');
    const tabs = [...document.querySelectorAll('.rtab:not(.mode)')];
    expect(tabs.length, 'region tabs').toBe(3);
    expect(tabs[2].classList.contains('locked'), 'Act III locked').toBe(true);
    expect(document.querySelectorAll('#map .node').length, 'Act II nodes').toBe(10);
    const bad = [];
    for (const m of ['tower', 'rush', 'daily', 'sanctum', 'quests', 'worldboss']) {
      try { selectStage(m); if (!document.querySelector('#stageInfo h3')) bad.push(m + ': no panel'); } catch (e) { bad.push(m + ': ' + e.message); }
    }
    expect(bad, 'mode panels').toBeEmpty();
  });
  test('stage panel pickers: loadout, companion and Hell Trials', () => {
    H.save({ level: 30, cleared: 9 });
    selectedRegion = 1; selectedStage = 8; showScreen('map');
    document.querySelector('#stageInfo [data-comp=roran]').click();
    expect(SAVE.companion, 'companion').toBe('roran');
    for (const id of ['swift', 'brutal', 'horde', 'frail']) { const b = document.querySelector(`#stageInfo [data-curse=${id}]`); if (b) b.click(); }
    expect(SAVE.curses.length, 'max 3 trials').toBe(3);
    document.querySelector('#stageInfo [data-load="4"]').click();
    expect(SAVE.loadoutIdx, 'loadout 5').toBe(4);
  });
  test('every Grimoire tab renders', () => {
    H.save({ level: 40, cleared: 28, fusions: true, stones: 1e6 });
    const bad = [];
    for (const t of ['cards', 'fusion', 'talents', 'relics', 'equip']) {
      try { grimTab = t; showScreen('grimoire'); if (!document.getElementById('grimContent').children.length) bad.push(t + ' empty'); } catch (e) { bad.push(t + ': ' + e.message); }
    }
    expect(bad, 'tabs').toBeEmpty();
  });
  test('Grimoire filters and search narrow the card list', () => {
    H.save({ level: 40, cleared: 28 });
    GF.rank = 'all'; GF.q = ''; GF.owned = false;
    grimTab = 'cards'; showScreen('grimoire');
    const all = document.querySelectorAll('#cardList .card').length;
    document.querySelector('.fchip[data-f=beast]').click();
    const beasts = document.querySelectorAll('#cardList .card').length;
    expect(beasts, 'beast cards').toBe(CARD_IDS.filter(id => CARDS[id].rank === 'beast').length);
    const s = document.getElementById('cardSearch'); s.value = 'wolf'; s.dispatchEvent(new Event('input'));
    expect(document.querySelectorAll('#cardList .card').length, 'search "wolf"').toBe(2);
    expect(all, 'all cards').toBeGreaterThan(beasts);
    GF.rank = 'all'; GF.q = '';
  });
  test('Grimoire slots: next empty slot is preselected, Equip fills it, keys 1–6 pick slots', () => {
    H.save({ level: 10, hotbar: ['spark_beetle', null, null, null, null, null] });
    GF.rank = 'all'; GF.q = '';
    grimTab = 'cards'; showScreen('grimoire');
    expect(selectedSlot, 'first empty slot').toBe(1);
    [...document.querySelectorAll('#grimContent [data-act=equip]')].find(b => b.dataset.id === 'fang_wolf').click();
    expect(SAVE.hotbar[1], 'equipped into slot 2').toBe('fang_wolf');
    expect(selectedSlot, 'moved to next empty').toBe(2);
    H.key('Digit6');
    expect(selectedSlot, 'key 6').toBe(5);
    H.key('Numpad1');
    expect(selectedSlot, 'numpad 1').toBe(0);
  });
  test('Grimoire slots show each summon\'s level and stars', () => {
    H.save({ level: 10, hotbar: ['spark_beetle', 'fang_wolf', null, null, null, null] });
    SAVE.cards.fang_wolf.lv = 17; SAVE.cards.fang_wolf.enh = 3;
    grimTab = 'cards'; showScreen('grimoire');
    const slots = document.querySelectorAll('#grimSlots .gslot');
    expect(slots[1].querySelector('.gs-lv').textContent, 'level').toBe('Lv 17');
    const st = slots[1].querySelector('.gs-st');
    expect(st.textContent.length - st.querySelector('.off').textContent.length, 'lit stars').toBe(3);
    expect(st.textContent.length, 'total stars').toBe(CARD_PROG.maxEnh);
    expect(slots[2].querySelector('.gs-info'), 'empty slot has no info').toBe(null);
  });
  test('every Codex tab renders', () => {
    H.save({ level: 20, cleared: 9 });
    const bad = [];
    for (const t of ['bestiary', 'ach', 'records', 'wardrobe']) {
      try { codexTab = t; showScreen('codex'); if (!document.getElementById('codexContent').children.length) bad.push(t + ' empty'); } catch (e) { bad.push(t + ': ' + e.message); }
    }
    expect(bad, 'tabs').toBeEmpty();
  });
  test('key rebinding: listen, assign, clear conflicts, cancel with Esc', () => {
    H.save({ level: 5 });
    openOverlay('settings');
    REBIND = { action: 'enhance', idx: 1 };
    H.key('KeyZ');
    expect(SETTINGS.keys.enhance[1], 'assigned').toBe('KeyZ');
    expect(KEYMAP.KeyZ, 'key map updated').toBe('enhance');
    REBIND = { action: 'swap', idx: 0 };
    H.key('KeyZ');
    expect(SETTINGS.keys.enhance[1], 'conflict removed').toBe('');
    REBIND = { action: 'swap', idx: 1 };
    H.key('Escape');
    expect(REBIND, 'cancelled').toBe(null);
  });
});

group('Input', () => {
  test('keyboard: number keys summon, Shift/Numpad 0 + number uses the special skill', () => {
    H.save({ level: 5, hotbar: ['spark_beetle', 'venom_mantis', null, null, null, null] });
    H.start(0); showScreen('play'); W.player.mp = 999;
    H.key('Digit1');
    expect(W.summons.filter(s => s.id === 'spark_beetle').length, 'beetles').toBe(3);
    H.key('ShiftLeft', { shiftKey: true }); H.key('Digit1', { shiftKey: true }); H.keyUp('ShiftLeft');
    expect(W.cskCd.spark_beetle, 'Shift skill').toBeGreaterThan(0);
    W.slotCd[1] = 0; H.key('Numpad2');
    expect(W.summons.some(s => s.id === 'venom_mantis'), 'numpad summon').toBe(true);
    H.key('Numpad0'); W.cskCd.venom_mantis = 0; H.key('Numpad2'); H.keyUp('Numpad0');
    expect(W.cskCd.venom_mantis, 'Numpad 0 skill').toBeGreaterThan(0);
  });
  test('keyboard: WASD moves Allen and Space dashes', () => {
    H.save({ level: 5 });
    H.start(0); showScreen('play');
    INPUT.keys.add('KeyD'); H.sim(0.5, { god: true }); INPUT.keys.clear();
    expect(W.player.x, 'moved right').toBeGreaterThan(60);
    const x = W.player.x;
    INPUT.keys.add('KeyD'); H.key('Space'); H.sim(0.2, { god: true }); INPUT.keys.clear();
    expect(W.player.x - x, 'dash distance').toBeGreaterThan(100);
  });
  test('controller: left stick moves, A summons, Start pauses', () => {
    H.save({ level: 5, hotbar: ['spark_beetle', null, null, null, null, null] });
    H.start(0); showScreen('play'); W.player.mp = 999;
    const pad = { connected: true, axes: [0.9, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    navigator.getGamepads = () => [pad];
    pollGamepad();
    pad.buttons[0] = { pressed: true, value: 1 }; pollGamepad();
    for (let i = 0; i < 30; i++) { pollGamepad(); updateWorld(1 / 60); }
    expect(INPUT.padMode, 'controller mode').toBe(true);
    expect(W.player.x, 'moved').toBeGreaterThan(40);
    expect(W.summons.filter(s => s.id === 'spark_beetle').length, 'A summoned').toBe(3);
    pad.buttons[0] = { pressed: false, value: 0 }; pad.buttons[9] = { pressed: true, value: 1 }; pollGamepad();
    expect(STATE, 'Start paused').toBe('pause');
  });
  test('touch: controls appear, tapping a card summons, holding it uses the skill', async () => {
    H.save({ level: 5, hotbar: ['spark_beetle', null, null, null, null, null] });
    SETTINGS.touch = 'on'; applyTouchMode();
    expect(document.body.classList.contains('touch'), 'touch layout').toBe(true);
    H.start(0); showScreen('play'); W.player.mp = 999;
    const slot = document.querySelector('#hotbar .slot');
    slot.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true }));
    slot.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'touch', bubbles: true }));
    expect(W.summons.filter(s => s.id === 'spark_beetle').length, 'tap summoned').toBe(3);
    slot.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    slot.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'touch', bubbles: true }));
    expect(W.cskCd.spark_beetle, 'long press used the skill').toBeGreaterThan(0);
  });
});

group('Rendering & HUD', () => {
  test('the HUD shows 6 slots, 5 skill buttons and updates without errors', () => {
    H.save({ level: 20, cleared: 9, hotbar: ['fang_wolf', 'gale_hawk', null, null, null, null] });
    H.start(5);
    expect(document.querySelectorAll('#hotbar .slot').length, 'slots').toBe(6);
    expect(document.querySelectorAll('#skills .skill').length, 'skill buttons').toBe(5);
    H.sim(3, { god: true, summon: true, render: true });
    updateHUD();
    expect(document.getElementById('hpTxt').textContent, 'HP text').toContain('/');
  });
  test('the world renders on every graphics quality in every act', () => {
    H.save({ level: 40, cleared: 28, cardLv: 10, hotbar: ['ember_wyrm', 'seraph', 'fang_wolf', 'arcane_wisp', 'healing_sprout', 'stone_golem'] });
    const bad = [];
    for (const st of [0, 3, 5, 10, 21, 27]) {
      H.start(st);
      H.sim(2, { god: true, summon: true });
      for (const q of ['low', 'medium', 'high']) { SETTINGS.quality = q; try { renderWorld(1 / 60); } catch (e) { bad.push(`stage ${st + 1} ${q}: ${e.message}`); } }
    }
    expect(bad, 'render errors').toBeEmpty();
  });
  test('performance: a full screen of 200 enemies renders fast enough', () => {
    H.save({ level: 40, cleared: 28, cardLv: 10, fusions: true, hotbar: ['dragon_emperor', 'seraphic_king', 'thunder_dragon', 'eye_of_the_void', 'phantom_lord', 'star_titan'] });
    H.start(26);
    for (let i = 0; i < 200; i++) spawnEnemy(weightedPick(W.st.enemies));
    H.sim(2, { god: true, summon: true });
    SETTINGS.quality = 'high';
    const a = performance.now();
    for (let i = 0; i < 20; i++) renderWorld(1 / 60);
    const ms = (performance.now() - a) / 20;
    expect(ms, 'ms per frame on High').toBeLessThan(16);
  }, { warn: true });
  test('the minimap draws enemies, summons and the boss', () => {
    H.save({ level: 20, cleared: 9 });
    H.start(5); W.time = W.st.duration;
    H.sim(5, { god: true, until: () => W.boss });
    drawMinimap(document.getElementById('minimap'));
    expect(!!W.boss, 'boss present').toBeTruthy();
  });
  test('Wardrobe outfits change how Allen is drawn', () => {
    H.save({ level: 40, cleared: 28 });
    const cv = document.createElement('canvas'); cv.width = cv.height = 76;
    SAVE.cosmetics.outfit = 'default'; renderPortrait(cv);
    const a = cv.getContext('2d').getImageData(0, 0, 76, 76).data.join(',');
    SAVE.cosmetics.outfit = 'crimson'; renderPortrait(cv);
    const b = cv.getContext('2d').getImageData(0, 0, 76, 76).data.join(',');
    expect(a !== b, 'portrait changed').toBe(true);
  });
});

group('Audio', () => {
  test('every sound effect, creature voice and music theme plays without errors', () => {
    H.save({ level: 20 });
    SFX.init();
    const bad = [];
    for (const k of Object.keys(SFX)) { if (typeof SFX[k] !== 'function' || ['init', 'setMuted', 'applyVolumes'].includes(k)) continue; try { SFX[k](2); } catch (e) { bad.push('SFX.' + k + ': ' + e.message); } }
    for (const id of CARD_IDS) { try { voiceCard(id); voiceCard(id, true); } catch (e) { bad.push('voice ' + id + ': ' + e.message); } }
    for (const k in BOSSES) { try { voiceBoss(BOSSES[k]); } catch (e) { bad.push('boss voice ' + k + ': ' + e.message); } }
    for (const k of Object.keys(THEMES)) { try { MUSIC.play(k); } catch (e) { bad.push('music ' + k + ': ' + e.message); } }
    MUSIC.stop();
    expect(bad, 'audio errors').toBeEmpty();
  });
  test('mute silences everything and is remembered', () => {
    H.save({ level: 2 });
    const was = SFX.muted;
    toggleMute();
    expect(SFX.muted, 'muted').toBe(!was);
    expect(SAVE.muted, 'saved').toBe(!was);
    toggleMute();
  });
});
