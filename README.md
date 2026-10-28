# Summoner: Hellbound Grimoire

[![Feature tests](https://github.com/00-MJ-Built-with-AI/26.10-summoner-hellbound/actions/workflows/tests.yml/badge.svg)](https://github.com/00-MJ-Built-with-AI/26.10-summoner-hellbound/actions/workflows/tests.yml) · [Play](https://00-mj-built-with-ai.github.io/26.10-summoner-hellbound/) · [Test report](https://00-mj-built-with-ai.github.io/26.10-summoner-hellbound/tests/)

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
| Photo mode | V | |
| Player 2 (co-op) | I J K L move · H dash · U skill | second controller |

All keys can be rebound in Settings. Phones and tablets get touch controls automatically. Turn on Player 2 in Settings → Co-op.

## What's in it

- **48 stages** in five acts with multi-phase bosses, a true ending and an epilogue. **No level cap** for you or your cards, with Paragon points past level 70
- **134 summon cards** across 10 ranks, including 20 mythic legends (Fenrir, Kraken, Bahamut, Kitsune…), plus 46 fusions; 20 stars and 10 awakenings per card; 30 talents up to rank 20
- Special skills, card leveling, enhancement, awakening with two evolution paths per card, rank synergies and 20 earned summon skins
- **Run upgrades**: every run level in a stage offers 3 of 42 upgrades (common, rare, legendary)
- **Automation**: priority lists that auto-pick run upgrades and soul boosts, auto Enhance and Overdrive, and an auto special skill toggle per card
- **The Rift**: a draft roguelite mode with permanent perks; **seasonal events** (Night of Pumpkins, Oct 27 – Nov 7)
- **Arabic** with a right-to-left layout (language picker on the title screen and in Settings)
- Online (optional, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md)): Google sign-in, cloud saves, real-player arena, leaderboards
- Android app with optional rewarded ads (see [ANDROID.md](ANDROID.md)); a one-time boost after 3 falls on a stage; controller rumble
- **Village**: 6 buildings with permanent bonuses, the Summoning Altar, a 28-day login calendar, weekly challenges and an arena against 30 rival summoners
- Local co-op (Player 2 plays a companion), photo mode with filters and 10-second clips, play stats in the Codex
- Installs as an app and works offline; accessibility options (colorblind palettes, reduced flashing, text size, high contrast, assist mode) and phone vibration
- Relics, talents, equipment crafted from boss materials, and 3 companions
- Abyss Tower (endless), Boss Rush, Daily Trial, weekly World Boss, quest board, Hell Tiers 1–10
- Generated music and sound (Web Audio), procedural art (Canvas 2D), dynamic lighting and weather
- Saves automatically in the browser, with backups, save files and copy/paste save codes

## Tests

169 automated tests cover every feature: content integrity (all 104 cards, enemies, bosses, 48 stages), Arabic coverage, the Rift, events, skins, automation, online flows (with a fake server), ads, run upgrades, evolutions, Act IV boss phases, co-op, the Village, arena, photo mode, accessibility, install files, saving and migrations, progression, combat (every card and its special skill, every enemy, every boss attack pattern), all game modes, menus, keyboard/controller/touch input, rendering at each graphics quality, and audio. The tests load the real game with temporary storage, so they never touch a real save.

**In a browser:** open `tests/index.html` (locally through `npm start`, or online at https://00-mj-built-with-ai.github.io/26.10-summoner-hellbound/tests/). Add `?only=boss` to run a subset.

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
