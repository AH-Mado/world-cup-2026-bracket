// Static bracket data. `locked`/`score` on R32 matches capture pre-tournament
// results that shipped in the initial deploy; ESPN live sync will overwrite
// these as newer results come in (see live.js#applyLiveData).

export const R32 = [
  { id: 'r32-1',  date: 'Jun 28', venue: 'Toronto',         a: { flag: '🇿🇦', name: 'South Africa', code: 'RSA' },      b: { flag: '🇨🇦', name: 'Canada',       code: 'CAN' }, locked: 'b', score: '0–1' },
  { id: 'r32-2',  date: 'Jun 29', venue: 'Monterrey',       a: { flag: '🇳🇱', name: 'Netherlands',  code: 'NED' },      b: { flag: '🇲🇦', name: 'Morocco',      code: 'MAR' } },
  { id: 'r32-3',  date: 'Jun 28', venue: 'Philadelphia',    a: { flag: '🇩🇪', name: 'Germany',      code: 'GER' },      b: { flag: '🇵🇾', name: 'Paraguay',     code: 'PAR' }, locked: 'b', score: '1–1 (3–4p)' },
  { id: 'r32-4',  date: 'Jun 30', venue: 'East Rutherford', a: { flag: '🇫🇷', name: 'France',       code: 'FRA' },      b: { flag: '🇸🇪', name: 'Sweden',       code: 'SWE' } },
  { id: 'r32-5',  date: 'Jun 28', venue: 'Dallas',          a: { flag: '🇧🇷', name: 'Brazil',       code: 'BRA' },      b: { flag: '🇯🇵', name: 'Japan',        code: 'JPN' }, locked: 'a', score: '2–1' },
  { id: 'r32-6',  date: 'Jun 30', venue: 'Arlington',       a: { flag: '🇨🇮', name: 'Ivory Coast',  code: 'CIV' },      b: { flag: '🇳🇴', name: 'Norway',       code: 'NOR' } },
  { id: 'r32-7',  date: 'Jun 30', venue: 'Mexico City',     a: { flag: '🇲🇽', name: 'Mexico',       code: 'MEX' },      b: { flag: '🇪🇨', name: 'Ecuador',      code: 'ECU' } },
  { id: 'r32-8',  date: 'Jul 1',  venue: 'Atlanta',         a: { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'England',      code: 'ENG' },      b: { flag: '🇨🇩', name: 'DR Congo',     code: 'COD' } },
  { id: 'r32-9',  date: 'Jul 2',  venue: 'Toronto',         a: { flag: '🇵🇹', name: 'Portugal',     code: 'POR' },      b: { flag: '🇭🇷', name: 'Croatia',      code: 'CRO' } },
  { id: 'r32-10', date: 'Jul 2',  venue: 'Los Angeles',     a: { flag: '🇪🇸', name: 'Spain',        code: 'ESP' },      b: { flag: '🇦🇹', name: 'Austria',      code: 'AUT' } },
  { id: 'r32-11', date: 'Jul 1',  venue: 'Santa Clara',     a: { flag: '🇺🇸', name: 'USA',          code: 'USA' },      b: { flag: '🇧🇦', name: 'Bosnia & H.',  code: 'BIH' } },
  { id: 'r32-12', date: 'Jul 1',  venue: 'Seattle',         a: { flag: '🇧🇪', name: 'Belgium',      code: 'BEL' },      b: { flag: '🇸🇳', name: 'Senegal',      code: 'SEN' } },
  { id: 'r32-13', date: 'Jul 3',  venue: 'Miami',           a: { flag: '🇦🇷', name: 'Argentina',    code: 'ARG' },      b: { flag: '🇨🇻', name: 'Cabo Verde',   code: 'CPV' } },
  { id: 'r32-14', date: 'Jul 3',  venue: 'Arlington',       a: { flag: '🇦🇺', name: 'Australia',    code: 'AUS' },      b: { flag: '🇪🇬', name: 'Egypt',        code: 'EGY' } },
  { id: 'r32-15', date: 'Jul 2',  venue: 'Vancouver',       a: { flag: '🇨🇭', name: 'Switzerland',  code: 'SUI' },      b: { flag: '🇩🇿', name: 'Algeria',      code: 'ALG' } },
  { id: 'r32-16', date: 'Jul 3',  venue: 'Kansas City',     a: { flag: '🇨🇴', name: 'Colombia',     code: 'COL' },      b: { flag: '🇬🇭', name: 'Ghana',        code: 'GHA' } },
];

export const R16 = [
  { id: 'r16-1', src: ['r32-1',  'r32-2'],  date: 'Jul 4', venue: 'Houston' },
  { id: 'r16-2', src: ['r32-3',  'r32-4'],  date: 'Jul 4', venue: 'Philadelphia' },
  { id: 'r16-3', src: ['r32-5',  'r32-6'],  date: 'Jul 5', venue: 'East Rutherford' },
  { id: 'r16-4', src: ['r32-7',  'r32-8'],  date: 'Jul 5', venue: 'Mexico City' },
  { id: 'r16-5', src: ['r32-9',  'r32-10'], date: 'Jul 6', venue: 'Dallas' },
  { id: 'r16-6', src: ['r32-11', 'r32-12'], date: 'Jul 6', venue: 'Seattle' },
  { id: 'r16-7', src: ['r32-13', 'r32-14'], date: 'Jul 7', venue: 'Atlanta' },
  { id: 'r16-8', src: ['r32-15', 'r32-16'], date: 'Jul 7', venue: 'Vancouver' },
];

export const QF = [
  { id: 'qf-1', src: ['r16-1', 'r16-2'], date: 'Jul 9',  venue: 'Boston' },
  { id: 'qf-2', src: ['r16-5', 'r16-6'], date: 'Jul 10', venue: 'Los Angeles' },
  { id: 'qf-3', src: ['r16-3', 'r16-4'], date: 'Jul 11', venue: 'Miami' },
  { id: 'qf-4', src: ['r16-7', 'r16-8'], date: 'Jul 12', venue: 'Kansas City' },
];

export const SF = [
  { id: 'sf-1', src: ['qf-1', 'qf-2'], date: 'Jul 14', venue: 'Dallas' },
  { id: 'sf-2', src: ['qf-3', 'qf-4'], date: 'Jul 15', venue: 'Atlanta' },
];

export const FINAL = [
  { id: 'final', src: ['sf-1', 'sf-2'], date: 'Jul 19', venue: 'MetLife Stadium' },
];

export const ROUNDS = [
  { key: '32',    label: 'Round of 32',    short: 'R32',    matches: R32 },
  { key: '16',    label: 'Round of 16',    short: 'R16',    matches: R16 },
  { key: 'qf',    label: 'Quarter-finals', short: 'QF',     matches: QF },
  { key: 'sf',    label: 'Semi-finals',    short: 'SF',     matches: SF },
  { key: 'final', label: 'Final',          short: 'Final',  matches: FINAL, isFinal: true },
];

export const TOTAL_MATCHES = ROUNDS.reduce((n, r) => n + r.matches.length, 0);
