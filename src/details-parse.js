// Pure data extractors for the details modal. Kept separate from details.js
// so the modal shell stays focused on DOM / open-close logic. Nothing here
// touches the DOM or i18n — the render side does that.

// ESPN's stats field names vary a bit across responses; each entry lists the
// name candidates that map to one display row plus the i18n key for its
// label. Order here = display order in the modal.
export const STAT_KEYS = [
  { keys: ['possessionpct', 'possession'],                         labelKey: 'stat_possession', suffix: '%' },
  { keys: ['totalshots', 'shots'],                                 labelKey: 'stat_shots' },
  { keys: ['shotsongoal', 'shotsontarget', 'shotsontargetnumeric'],labelKey: 'stat_on_target' },
  { keys: ['shotsoffgoal', 'shotsofftarget'],                      labelKey: 'stat_off_target' },
  { keys: ['blockedshots'],                                        labelKey: 'stat_blocked' },
  { keys: ['saves', 'goalkeepersaves'],                            labelKey: 'stat_saves' },
  { keys: ['corners', 'woncorners', 'cornerkicks'],                labelKey: 'stat_corners' },
  { keys: ['offsides'],                                            labelKey: 'stat_offsides' },
  { keys: ['foulscommitted', 'fouls'],                             labelKey: 'stat_fouls' },
  { keys: ['yellowcards'],                                         labelKey: 'stat_yellow' },
  { keys: ['redcards'],                                            labelKey: 'stat_red' },
  { keys: ['totalpasses', 'passes'],                               labelKey: 'stat_passes' },
  { keys: ['accuratepasses', 'accuratepassesnumeric'],             labelKey: 'stat_accurate_passes' },
  { keys: ['passpct', 'passcompletionpct', 'passingaccuracy'],     labelKey: 'stat_pass_accuracy', suffix: '%' },
  { keys: ['crosses', 'totalcrosses'],                             labelKey: 'stat_crosses' },
  { keys: ['totaltackles', 'tackles'],                             labelKey: 'stat_tackles' },
  { keys: ['interceptions'],                                       labelKey: 'stat_interceptions' },
];

function normStat(k) {
  return (k || '').toLowerCase().replace(/[^a-z]/g, '');
}

export function statValue(teamStats, keys) {
  if (!teamStats) return null;
  const normKeys = keys.map(normStat);
  for (const s of teamStats) {
    const n = normStat(s.name || s.abbreviation || s.displayName);
    if (normKeys.includes(n)) {
      const raw = s.displayValue != null ? s.displayValue : s.value;
      if (raw == null || raw === '') return null;
      return String(raw);
    }
  }
  return null;
}

export function parseStatNumber(str) {
  if (str == null) return NaN;
  const m = String(str).match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
}

// Map an ESPN team id to our 'a' | 'b' side, honoring which side of the card
// the home team is displayed on.
function toSide(teamId, homeC, awayC, homeIsA) {
  if (!teamId) return null;
  const id = String(teamId);
  if (homeC && id === String(homeC.id)) return homeIsA ? 'a' : 'b';
  if (awayC && id === String(awayC.id)) return homeIsA ? 'b' : 'a';
  return null;
}

// ESPN's summary payload exposes the timeline in two overlapping places:
//   - `keyEvents[]`  → the canonical timeline (goals, cards, subs, etc.)
//                     with a stable `type.type` slug and full participant list.
//   - `header.competitions[0].details[]` → a compact subset (mostly goals +
//                     cards), sometimes present when keyEvents isn't.
//   - `scoringPlays[]` → older shape, still returned for some events.
// We prefer keyEvents when present and fall back to the other two.
function timelineSource(data) {
  const ke = Array.isArray(data?.keyEvents) ? data.keyEvents : null;
  if (ke && ke.length) return ke;
  const details = data?.header?.competitions?.[0]?.details;
  if (Array.isArray(details) && details.length) return details;
  return [];
}

function eventTypeSlug(e) {
  return (e?.type?.type || '').toLowerCase();
}

function eventTypeText(e) {
  return (e?.type?.text || e?.text || '').toLowerCase();
}

function participantName(p) {
  return p?.athlete?.displayName || p?.displayName || '';
}

export function extractGoals(data, homeC, awayC, homeIsA) {
  const source = timelineSource(data);
  const goals = source
    .filter(e => e.scoringPlay === true || /^goal(\s*-|$)/.test(eventTypeText(e)))
    .map(e => {
      const parts = e.participants || e.athletesInvolved || [];
      return {
        player: participantName(parts[0]) || e.text || 'Goal',
        minute: e.clock?.displayValue || '',
        teamId: e.team?.id,
        ownGoal: e.ownGoal === true || /own\s*goal/.test(eventTypeText(e)),
        penalty: e.penaltyKick === true || /penalty/.test(eventTypeText(e)),
      };
    });

  // Older-shape fallback if keyEvents/details returned nothing.
  const fromScoringPlays = (!goals.length && Array.isArray(data?.scoringPlays))
    ? data.scoringPlays.map(p => ({
        player: p.athletesInvolved?.[0]?.displayName || (p.text || '').replace(/\s*-\s*Goal.*$/i, '').trim() || 'Goal',
        minute: p.clock?.displayValue || '',
        teamId: p.team?.id,
        ownGoal: /own\s*goal/i.test(p.type?.text || '') || /own\s*goal/i.test(p.text || ''),
        penalty: /pen/i.test(p.type?.text || ''),
      }))
    : [];

  const a = [], b = [];
  for (const g of goals.concat(fromScoringPlays)) {
    const side = toSide(g.teamId, homeC, awayC, homeIsA);
    if (side === 'a') a.push(g);
    else if (side === 'b') b.push(g);
  }
  return { a, b };
}

// Non-goal timeline events: substitutions, yellow/red cards, missed penalties.
// Reads from the same `keyEvents` timeline used by extractGoals.
export function extractEvents(data, homeC, awayC, homeIsA) {
  const source = timelineSource(data);
  const a = [], b = [];
  const push = (side, e) => { if (side === 'a') a.push(e); else if (side === 'b') b.push(e); };

  for (const e of source) {
    const side = toSide(e.team?.id, homeC, awayC, homeIsA);
    if (!side) continue;
    const slug = eventTypeSlug(e);
    const text = eventTypeText(e);
    const minute = e.clock?.displayValue || '';
    const parts = e.participants || e.athletesInvolved || [];

    // Skip goals — they render in their own section.
    if (e.scoringPlay === true || /^goal(\s*-|$)/.test(text)) continue;

    // Missed / saved penalty. ESPN uses a couple of type slugs and text
    // variants across events; catch them all with fallbacks on the flag.
    if (slug.startsWith('penalty-miss') || slug.startsWith('penalty-saved') ||
        /pen(alty)?.*(miss|saved|off\s*target|blocked)/i.test(text) ||
        (e.penaltyKick === true && e.scoringPlay !== true)) {
      push(side, { kind: 'pen-miss', minute, player: participantName(parts[0]) });
      continue;
    }

    if (slug === 'red-card' || e.redCard === true || /red\s*card|second\s*yellow/i.test(text)) {
      push(side, { kind: 'red', minute, player: participantName(parts[0]) });
    } else if (slug === 'yellow-card' || e.yellowCard === true || /yellow\s*card/i.test(text)) {
      push(side, { kind: 'yellow', minute, player: participantName(parts[0]) });
    } else if (slug === 'substitution' || /substitut/i.test(text)) {
      // In ESPN's payload participants[0] is the incoming player, [1] the
      // outgoing one — verified against the `text` field which reads
      // "<in> replaces <out>". If a `type` label is present on the
      // participant (older shape), use that instead.
      let inP = parts.find(p => /(^|-)in\b/i.test(p.type || '')) || parts[0];
      let outP = parts.find(p => /out/i.test(p.type || '')) || parts[1];
      const playerIn = participantName(inP);
      const playerOut = participantName(outP);
      if (playerIn || playerOut) push(side, { kind: 'sub', minute, playerIn, playerOut });
    }
  }
  return { a, b };
}
