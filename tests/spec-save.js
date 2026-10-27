'use strict';
// ---------- Saving: storage round-trips, migrations, autosave, backups, transfer codes, settings ----------

group('Save system', () => {
  test('a new save has every field the game needs', () => {
    const s = defaultSave('normal');
    for (const k of ['level', 'exp', 'stones', 'cards', 'hotbar', 'cleared', 'best', 'stars', 'talents', 'fused', 'relics', 'relicSlots', 'essence', 'awakened', 'loadouts', 'mats', 'equip', 'quests', 'worldBoss', 'sanctum', 'cosmetics', 'counters', 'history'])
      expect(s[k] !== undefined, 'field ' + k).toBeTruthy();
    expect(s.cleared.length, 'cleared slots').toBe(28);
    expect(s.loadouts.length, 'loadouts').toBe(5);
    expect(Object.keys(s.cards).length, 'card entries').toBe(CARD_IDS.length);
  });
  test('saving and loading keeps level, cards, fusions, relics and equipment', () => {
    const s = H.save({ level: 23, cleared: 12, stones: 777 });
    s.cards.fang_wolf = { lv: 9, exp: 3, enh: 2 }; s.fused.griffin = true; s.relics.horn = 2; s.relicSlots[0] = 'horn';
    s.equip.owned.oak_staff = 4; s.equip.slots.staff = 'oak_staff'; s.mats.horn = 7; s.essence = 5;
    saveGame();
    const l = loadSave();
    expect(l.level, 'level').toBe(23);
    expect(l.stones, 'stones').toBe(777);
    expect(l.cards.fang_wolf, 'card').toEqual({ lv: 9, exp: 3, enh: 2 });
    expect(l.fused.griffin, 'fusion').toBe(true);
    expect(l.relics.horn, 'relic +').toBe(2);
    expect(l.equip.owned.oak_staff, 'equipment').toBe(4);
    expect(l.mats.horn, 'materials').toBe(7);
    expect(l.cleared.filter(Boolean).length, 'cleared stages').toBe(12);
  });
  test('a very old (v1) save upgrades to the current version', () => {
    const v1 = { v: 1, mode: 'normal', level: 7, exp: 40, stones: 149, cards: { spark_beetle: { lv: 3, exp: 0, enh: 1 } }, hotbar: ['spark_beetle', null, null, null, null, null], cleared: [true, false, false, false, false, false, false, false], best: [100, null, null, null, null, null, null, null], stats: { kills: 600, deaths: 0, runs: 1 }, muted: false };
    localStorage.setItem(SAVE_KEY, JSON.stringify(v1));
    const m = loadSave();
    expect(m.v, 'version').toBe(6);
    expect(m.evo, 'v6 fields added').toEqual({});
    expect(m.arena.rating, 'arena rating').toBe(1000);
    expect(m.level, 'level kept').toBe(7);
    expect(m.cards.spark_beetle.lv, 'card kept').toBe(3);
    expect(m.cleared.length, 'stage slots').toBe(28);
    expect(m.stars[0][0], 'clear star').toBe(true);
    expect(m.tutorialDone, 'tutorial skipped for veterans').toBe(true);
    expect(m.loadouts.length, 'loadouts').toBe(5);
    expect(!!m.cards.arch_angel && !!m.mats && !!m.equip.slots, 'new systems added').toBeTruthy();
  });
  test('a corrupted save is ignored instead of crashing', () => {
    localStorage.setItem(SAVE_KEY, '{not json');
    expect(loadSave(), 'result').toBe(null);
  });
  test('autosave writes during play and when the page closes', () => {
    H.save({ level: 5, cardLv: 3 });
    H.start(0);
    SAVE.stones = 4242;
    window.dispatchEvent(new Event('pagehide'));
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)).stones, 'saved on close').toBe(4242);
    SAVE.stones = 5151;
    document.dispatchEvent(new Event('visibilitychange'));
    saveGame();
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)).stones, 'saved').toBe(5151);
  });
  test('rolling backups keep the latest 3 and can be restored', () => {
    localStorage.removeItem(BACKUP_KEY);
    H.save({ level: 10 });
    for (let i = 0; i < 5; i++) { SAVE.level = 10 + i; backupSave(true); }
    const list = loadBackups();
    expect(list.length, 'backups kept').toBe(3);
    expect(list[0].level, 'newest first').toBe(14);
    openOverlay('settings');
    document.getElementById('btnRestore').click();
    const btns = document.querySelectorAll('[data-bk]');
    expect(btns.length, 'restore buttons').toBe(3);
    SAVE.level = 1; saveGame();
    btns[2].click();
    expect(SAVE.level, 'restored level').toBe(12);
  });
  test('save codes move progress between browsers', async () => {
    H.save({ level: 31, cleared: 20, stones: 1234 });
    openOverlay('settings');
    document.getElementById('btnExportSave').click();
    await new Promise(r => setTimeout(r, 50));
    const code = document.getElementById('saveCode').value;
    expect(code.startsWith('SHG1:'), 'code prefix').toBeTruthy();
    localStorage.removeItem(SAVE_KEY); SAVE = null;
    document.getElementById('saveCode').value = code;
    document.getElementById('btnImportSave').click();
    expect(SAVE && SAVE.level, 'imported level').toBe(31);
    expect(SAVE.stones, 'imported stones').toBe(1234);
  });
  test('importing over an existing save asks for confirmation first', () => {
    H.save({ level: 9 });
    const other = defaultSave('normal'); other.level = 33;
    document.getElementById('saveCode').value = 'SHG1:' + btoa(unescape(encodeURIComponent(JSON.stringify(other))));
    openOverlay('settings');
    document.getElementById('btnImportSave').click();
    expect(SAVE.level, 'not replaced yet').toBe(9);
    document.getElementById('btnImportSave').click();
    expect(SAVE.level, 'replaced after confirm').toBe(33);
  });
  test('an invalid save code is rejected with a message', () => {
    H.save({ level: 4 });
    openOverlay('settings');
    document.getElementById('saveCode').value = 'hello';
    document.getElementById('btnImportSave').click();
    expect(document.getElementById('saveMsg').textContent, 'message').toContain("isn't a valid save");
    expect(SAVE.level, 'save untouched').toBe(4);
  });
  test('settings and key bindings persist separately from the save', () => {
    setBinding('dash', 1, 'KeyF');
    SETTINGS.music = 0.2; saveSettings();
    SETTINGS = defaultSettings(); loadSettings(); rebuildKeymap();
    expect(SETTINGS.keys.dash[1], 'rebound key').toBe('KeyF');
    expect(SETTINGS.music, 'music volume').toBe(0.2);
    expect(SETTINGS.keys.overdrive[0], 'overdrive key moved off F').toBe('');
  });
});
