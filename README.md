# Summoner: Hellbound Grimoire

[![Feature tests](https://github.com/00-MJ-Built-with-AI/summoner-hellbound/actions/workflows/tests.yml/badge.svg)](https://github.com/00-MJ-Built-with-AI/summoner-hellbound/actions/workflows/tests.yml) · [Play](https://00-mj-built-with-ai.github.io/summoner-hellbound/) · [Test report](https://00-mj-built-with-ai.github.io/summoner-hellbound/tests/)

A neon-fantasy action game for the browser, inspired by the summoner from *Hell Mode*. You play Allen, a summoner who barely fights himself: your power is the grimoire, a growing army of 100 summon cards across 9 ranks.

No install, no build step. Open `index.html` in a browser, or serve the folder with any static web server.

## Play

```bash
python -m http.server 5200
```

Then open http://localhost:5200.

| Action | Keyboard | Controller |
|---|---|---|
| Move | W A S D / arrows | Left stick |
| Aim summons | Mouse | Right stick |
| Summon slot 1–6 | 1–6 or Numpad 1–6 | A B X Y LB RB |
| Special skill | Hold Shift or Numpad 0 + slot | Hold LT + slot |
| Dash | Space | RT |
| Enhance / Swap / Recall | Q / E / R | D-pad up / right / down |
| Grimoire Overdrive | F or Numpad + | D-pad left |
| Pause | Esc or P | Start |

All keys can be rebound in Settings. Phones and tablets get touch controls automatically.

## What's in it

- **28 stages** in three acts, each ending in a boss, plus 10 Awakened rematches
- **100 summon cards**: Insect, Beast, Bird, Grass, Stone, Fish, Spirit, Dragon and Celestial ranks, plus 36 fusions
- Special skills, card leveling, enhancement, awakening and rank synergies
- Relics, talents, equipment crafted from boss materials, and 3 companions
- Abyss Tower (endless), Boss Rush, Daily Trial, weekly World Boss, quest board, Hell Tiers 1–10
- Generated music and sound (Web Audio), procedural art (Canvas 2D), dynamic lighting and weather
- Saves automatically in the browser, with backups, save files and copy/paste save codes

## Tests

86 automated tests cover every feature: content integrity (all 100 cards, enemies, bosses, stages), saving and migrations, progression, combat (every card and its special skill, every enemy, every boss attack pattern), all game modes, menus, keyboard/controller/touch input, rendering at each graphics quality, and audio. The tests load the real game with temporary storage, so they never touch a real save.

**In a browser:** open `tests/index.html` (locally through `npm start`, or online at https://00-mj-built-with-ai.github.io/summoner-hellbound/tests/). Add `?only=boss` to run a subset.

**From the command line** (Node 18+; uses your installed Edge or Chrome):

```bash
npm install
```

```bash
npm test
```

`npm test -- boss` runs only tests whose name contains "boss". The command exits with code 1 if anything fails.

## Code layout

| File | Contents |
|---|---|
| `js/data.js`, `js/content2.js`, `js/cards3.js` | Cards, enemies, bosses, stages (Act I, Acts II–III, 50 extra cards + 30 fusions) |
| `js/game.js` | Simulation: player, summon AI, enemies, bosses, combat |
| `js/features.js`, `js/content3.js`, `js/content4.js` | Skills, relics, tower, events, tiers, quests, equipment, World Boss, lighting |
| `js/draw.js`, `js/draw2.js` | All character and world drawing |
| `js/audio.js` | Synthesized sound effects, creature voices and adaptive music |
| `js/ui.js`, `js/main.js`, `js/settings.js`, `js/touch.js` | Menus, HUD, saves, input, controller and touch support |
