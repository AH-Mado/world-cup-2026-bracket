import { ROUNDS, TOTAL_MATCHES } from './data.js';
import { picks, resolveTeams, getWinner } from './state.js';
import { t, teamName, localizeFallbackDate } from './i18n.js';
import { fmtDate } from './live.js';

// UI state — which round tab is active, whether the user picked a tab
// themselves (so live-refresh knows not to jump around under them), and
// per-round scroll offsets so switching tabs restores position.
export let activeRound = 0;
export let userSelectedRound = false;
const roundScrollY = {};

export function setActiveRound(i) { activeRound = i; }

function codeFor(team, fallback) {
  if (!team) return fallback;
  if (team.code) return team.code;
  return teamName(team).slice(0, 3).toUpperCase();
}

function sideHTML(team, matchId, side, opts) {
  const { isLocked, isLive } = opts;
  if (!team) {
    return `<div class="side empty">
      <div class="flag-badge">?</div>
      <div class="team-name">${t('awaiting_winner')}</div>
      <div class="team-sub">${t('tbd')}</div>
    </div>`;
  }
  // Suppress the star while a match is live — the currently-leading team isn't
  // the winner yet, and a user's pre-match pick shouldn't look like a call on
  // the live scoreline either. Star returns once the match is locked.
  const isWinner = !isLive && picks[matchId] === side;
  const classes = ['side', `side-${side}`];
  if (isWinner) classes.push('winner');
  if (isLocked) classes.push('locked');
  const onclick = isLocked ? '' : `onclick="pick('${matchId}','${side}')"`;
  const codeLabel = codeFor(team, side.toUpperCase());
  const star = isWinner ? `<span class="winner-star" aria-label="winner">★</span>` : '';

  return `<div class="${classes.join(' ')}" ${onclick}>
    <div class="flag-wrap">
      <div class="flag-badge">${team.flag || '⚽'}</div>
      ${star}
    </div>
    <div class="team-name">${teamName(team)}</div>
    <div class="team-sub">${codeLabel}</div>
  </div>`;
}

// Accepts "2–1", "0-1", "1–1 (3–4p)", "2–1 LIVE"
function parseScore(scoreStr) {
  if (!scoreStr) return null;
  const clean = scoreStr.replace(/LIVE/i, '').trim();
  const m = clean.match(/^(\d+)\s*[–-]\s*(\d+)/);
  if (!m) return null;
  const detail = clean.replace(m[0], '').trim();
  return { a: parseInt(m[1], 10), b: parseInt(m[2], 10), detail };
}

function matchHTML(match, isFinal) {
  const teams = resolveTeams(match);
  const isLocked = !!match.locked;
  const parsed = parseScore(match.score);
  const isLive = !!match.score && /LIVE/i.test(match.score);

  // Prefer the raw ISO from ESPN (formatted fresh in the current locale) so
  // toggling language re-localizes hydrated matches too. Fall back to the
  // hard-coded seed date, translated on the fly when needed.
  const dateLabel = match.dateIso
    ? (fmtDate(match.dateIso) || localizeFallbackDate(match.date || ''))
    : localizeFallbackDate(match.date || '');
  const venueLabel = match.venue || '';
  const datePillClass = parsed ? 'muted' : '';

  const scoreCenter = parsed
    ? `<div class="score-block">
        <div class="score"><span>${parsed.a}</span><span class="sep">:</span><span>${parsed.b}</span></div>
        ${parsed.detail ? `<div class="score-detail">${parsed.detail}</div>` : ''}
      </div>`
    : `<div class="score-block"><div class="score vs">${t('vs')}</div></div>`;

  let statusRow;
  if (isLive) {
    statusRow = `<div class="status-row"><div class="live-badge"><span class="blink"></span>${t('live_badge')}</div></div>`;
  } else if (isLocked) {
    statusRow = `<div class="status-row"><div class="status-note done">${t('full_time_locked')}</div></div>`;
  } else {
    statusRow = `<div class="status-row"><div class="status-note">${venueLabel}</div></div>`;
  }

  const meta = `<div class="match-meta-row">
    <div class="date-pill ${datePillClass}">
      <span class="material-symbols-rounded">calendar_today</span>
      <span>${dateLabel}</span>
    </div>
  </div>`;

  const scoreboard = `<div class="scoreboard">
    ${sideHTML(teams[0], match.id, 'a', { isLocked, isLive })}
    ${scoreCenter}
    ${sideHTML(teams[1], match.id, 'b', { isLocked, isLive })}
  </div>`;

  const canShowDetails = !!match.eventId && (isLocked || isLive);
  const detailsBtn = canShowDetails
    ? `<button class="details-btn" onclick="event.stopPropagation();openDetails('${match.id}')" aria-label="${t('match_details')}" title="${t('match_details')}">
        <span class="material-symbols-rounded">bar_chart</span>
      </button>`
    : '';

  if (isFinal) {
    return `<div class="match final-match">
      <div class="final-inner">
        ${detailsBtn}
        <div class="final-crown">
          <span class="material-symbols-rounded">trophy</span>
          <p>${t('grand_final')}</p>
        </div>
        ${meta}
        ${scoreboard}
        ${statusRow}
      </div>
    </div>`;
  }

  return `<div class="match">
    ${detailsBtn}
    ${meta}
    ${scoreboard}
    ${statusRow}
  </div>`;
}

export function selectRound(i) {
  if (i < 0 || i >= ROUNDS.length || i === activeRound) return;
  userSelectedRound = true;
  roundScrollY[activeRound] = window.scrollY;
  activeRound = i;
  render();
  const restore = roundScrollY[i] ?? 0;
  window.scrollTo(0, restore);
  const tabBar = document.getElementById('roundTabs');
  const activeTab = tabBar && tabBar.querySelector('.round-tab.active');
  if (tabBar && activeTab) {
    const target = activeTab.offsetLeft - (tabBar.clientWidth - activeTab.clientWidth) / 2;
    tabBar.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }
}

export function setupSwipeGestures() {
  const bracket = document.getElementById('bracket');
  if (!bracket || bracket.__swipeReady) return;
  bracket.__swipeReady = true;
  let sx = 0, sy = 0, t0 = 0;
  bracket.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    t0 = Date.now();
  }, { passive: true });
  bracket.addEventListener('touchend', (e) => {
    if (!t0) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    const dt = Date.now() - t0;
    t0 = 0;
    if (dt > 500) return;
    if (Math.abs(dx) < 60) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) selectRound(activeRound + 1);
    else selectRound(activeRound - 1);
  }, { passive: true });
}

function renderTabs() {
  const tabs = document.getElementById('roundTabs');
  tabs.innerHTML = ROUNDS.map((r, i) => {
    const remaining = r.matches.filter(m => !m.locked).length;
    const total = r.matches.length;
    const countLabel = remaining === 0 ? '✓' : `${total - remaining}/${total}`;
    const short = t(`round_${r.key}_short`);
    return `<button class="round-tab${i === activeRound ? ' active' : ''}" role="tab" aria-selected="${i === activeRound}" onclick="selectRound(${i})">
      <span>${short}</span><span class="tab-count">${countLabel}</span>
    </button>`;
  }).join('');
}

function updateProgress() {
  const predicted = Object.keys(picks).length;
  const pct = TOTAL_MATCHES ? (predicted / TOTAL_MATCHES) * 100 : 0;
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');
  if (fill) fill.style.width = `${pct}%`;
  if (text) text.textContent = `${predicted}/${TOTAL_MATCHES}`;
}

export function render() {
  const bracket = document.getElementById('bracket');
  bracket.innerHTML = ROUNDS.map((r, i) => {
    const roundClass = `round${i === activeRound ? ' active-round' : ''} round-${r.matches.length === 1 ? 'final' : r.matches.length}`;
    return `<div class="${roundClass}" data-key="${r.key}">
      <div class="round-label">${r.label}</div>
      ${r.matches.map(m => matchHTML(m, r.isFinal)).join('')}
    </div>`;
  }).join('');

  renderTabs();
  updateProgress();

  const champion = getWinner('final');
  const banner = document.getElementById('championBanner');
  const name = document.getElementById('championName');
  if (champion) {
    banner.classList.remove('empty');
    name.textContent = `${champion.flag}  ${teamName(champion)}`;
  } else {
    banner.classList.add('empty');
  }
}
