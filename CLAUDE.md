# World Cup 2026 Bracket Picker

Single-user, single-page bracket picker for the FIFA World Cup 2026 knockout
stage. Ships as static files on GitHub Pages. No build step, no dependencies,
no framework — just an `index.html` shell that loads split CSS files and ES
modules from the browser.

## Project layout

```
world-cup-2026-bracket/
├── index.html          # Thin shell: markup + <link>/<script type="module">
├── styles/
│   ├── base.css        # Tokens, reset, body, icon font, icon/data skeletons
│   ├── layout.css      # Header, hero, live pill, champion banner, progress FAB, footer
│   ├── bracket.css     # Round tabs, match cards, scoreboard, sides, final match
│   └── modal.css       # Details button, bottom-sheet modal, goal list, stat bars
├── src/
│   ├── main.js         # Entry point — boots the app, exposes window globals
│   ├── data.js         # Static bracket data (R32/R16/QF/SF/FINAL/ROUNDS)
│   ├── state.js        # Picks map, storage, findMatch, resolveTeams, applyPick, resetAllPicks
│   ├── render.js       # sideHTML/matchHTML/renderTabs/render + active round + swipe gestures
│   ├── live.js         # ESPN scoreboard fetch, name aliases, applyLiveData, initLive/refreshLive
│   └── details.js      # Match details modal — fetch summary, extract goals/stats, open/close
└── .github/
    └── workflows/      # `pages.yml` auto-deploys main to GitHub Pages
```

Keep files small — nothing here should grow past ~400 lines. If a module
starts sprawling, split by concern (e.g. goal extraction, stat mapping) into
sibling files rather than adding sections.

## How it fits together

```
data.js ─────────────┐
                     ▼
state.js ── picks + resolveTeams ──┐
                     │             │
                     ▼             ▼
                 render.js ────► live.js ── ESPN scoreboard
                     ▲             │
                     │             ▼
                     └─────── details.js ── ESPN summary (per event)
                                   │
                                   ▼
                                main.js ── window.pick / window.selectRound / …
```

- **`state.js` owns `picks`** — a mutable map from matchId to `'a' | 'b'`. It
  persists to `localStorage` under `wc2026-picks-v1`. Locked matches (real
  results) are re-applied on load so they always reflect the truth.
- **`render.js`** turns the current state into HTML on demand. It also owns
  the UI state that doesn't belong in `state.js`: which tab is active, whether
  the user picked a tab (so live-refresh doesn't yank them around), and
  per-round scroll offsets.
- **`live.js`** hits ESPN's public scoreboard endpoint, matches events to
  matches by team name (with alias table for USA/DR Congo/etc.), and mutates
  the ROUNDS data in place — writing back real dates, venues, scores,
  `eventId` (for the details modal), and locking winners.
- **`details.js`** lazy-fetches ESPN's per-event `summary` endpoint when the
  chart-icon button is tapped, extracts goal scorers + stat comparisons, and
  renders a bottom-sheet modal. Summaries are cached per event in memory.
- **`main.js`** wires everything: exposes `pick`, `resetPicks`, `selectRound`,
  `refreshLive`, `openDetails`, `closeDetails` on `window` (inline `onclick=`
  attributes call them), boots the render, and gates the two skeleton states
  (`fonts-ready`, `data-ready`).

## Local dev

```
python3 -m http.server 8765
```

Open http://localhost:8765/index.html. ES modules require `http://` (not
`file://`) or the imports will fail with CORS errors.

For a fast browser smoke test with the chrome-devtools MCP:
1. Serve as above.
2. Navigate to `http://localhost:8765/index.html`.
3. Wait for "Pick your champion" to appear.
4. Verify the live pill shows "Live · N finished · …" (ESPN hydration worked).
5. Click a `.details-btn` on a locked match and verify the modal populates.

## Deploy

Pushing to `main` triggers `.github/workflows/pages.yml`, which uploads the
whole repo to GitHub Pages. There's no build step — files are served as-is,
so any path in `index.html` or in the ES-module imports must resolve
relatively from the repo root.

## Key conventions and gotchas

- **Icon font loading**: Material Symbols Rounded is loaded async. Until
  `document.fonts.ready` resolves, the browser renders the raw ligature text
  ("refresh", "bar_chart", "calendar_today") which is ugly. `main.js` adds a
  `fonts-ready` class on the `<html>` element when the font arrives; until
  then `base.css` shows a shimmering square placeholder of the right size at
  each icon slot. There's a 3.5s safety timeout in case font loading hangs.
- **Data-loading skeletons**: date-pill and status-note text also shimmer
  until the first ESPN fetch settles (`data-ready` class).
- **Inline onclicks**: rendered HTML uses `onclick="pick(...)"` etc. That
  requires the handlers to be on `window`, which `main.js` sets up. If you
  add a new inline handler, remember to also expose it via `window.foo = foo`
  in `main.js`.
- **Picks and downstream matches**: when a user changes a pick,
  `clearDownstream` walks the bracket and removes any dependent picks that
  are no longer reachable. Live-sync does the same when a real result
  overrides a prediction.
- **ESPN name matching**: `NAME_ALIASES` in `live.js` handles teams whose
  ESPN display name differs from ours (e.g. "United States" vs "USA",
  "Korea Republic" vs "South Korea"). When adding a team that ESPN spells
  oddly, add its normalized form here.
- **Dates**: everything is shown in Africa/Cairo time via `fmtDate` in
  `live.js`. If the user relocates, change `CAIRO_TZ` there.
- **Locked matches on the initial deploy**: `data.js` still carries a few
  `locked: 'b', score: '0–1'` seeds for matches that finished before the app
  went live. Live-sync will overwrite them, so leave them as-is — they're a
  fallback for the offline/cached state.
- **The details button only appears when `match.eventId` is set** — that
  field is added by `applyLiveData`, so a fresh load without network will
  simply not offer the button. That's fine.

## When you make changes

- **Adding a stat row to the modal**: append to `STAT_KEYS` in `details.js`.
  Field names come from ESPN's `boxscore.teams[].statistics[].name`; check
  what's actually in the payload for the sport-specific stat you want. The
  `keys` array accepts multiple aliases in case the API varies.
- **Adding a new round or reshaping the bracket**: edit `data.js` only. The
  render code is data-driven off `ROUNDS`, and `src` arrays wire the
  progression between rounds.
- **Adding a global keyboard shortcut**: `details.js` already listens on
  `document` for Escape; other modules should follow that pattern (bind
  once, at module load, checking whatever local state matters).
- **UI polish**: tokens live in `styles/base.css` under `:root`. Prefer
  editing tokens over hard-coding colors.

## What NOT to add

- A build step / bundler / TypeScript / framework. This app is deliberately
  zero-dep so it can ship as plain files.
- A test suite. There's nothing to test that a manual browser smoke test
  won't catch faster.
- Analytics, tracking, or third-party embeds. This is a personal bracket.
