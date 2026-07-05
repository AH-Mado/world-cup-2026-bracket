// Static bracket data. `locked`/`score` on R32 matches capture pre-tournament
// results that shipped in the initial deploy; ESPN live sync will overwrite
// these as newer results come in (see live.js#applyLiveData).
//
// Team names are { en, ar } — resolved at render time via i18n.js#teamName.
// ESPN name-matching always uses the `en` form.

const T = {
  RSA: { flag: '🇿🇦', code: 'RSA', name: { en: 'South Africa',    ar: 'جنوب أفريقيا' } },
  CAN: { flag: '🇨🇦', code: 'CAN', name: { en: 'Canada',          ar: 'كندا' } },
  NED: { flag: '🇳🇱', code: 'NED', name: { en: 'Netherlands',     ar: 'هولندا' } },
  MAR: { flag: '🇲🇦', code: 'MAR', name: { en: 'Morocco',         ar: 'المغرب' } },
  GER: { flag: '🇩🇪', code: 'GER', name: { en: 'Germany',         ar: 'ألمانيا' } },
  PAR: { flag: '🇵🇾', code: 'PAR', name: { en: 'Paraguay',        ar: 'باراغواي' } },
  FRA: { flag: '🇫🇷', code: 'FRA', name: { en: 'France',          ar: 'فرنسا' } },
  SWE: { flag: '🇸🇪', code: 'SWE', name: { en: 'Sweden',          ar: 'السويد' } },
  BRA: { flag: '🇧🇷', code: 'BRA', name: { en: 'Brazil',          ar: 'البرازيل' } },
  JPN: { flag: '🇯🇵', code: 'JPN', name: { en: 'Japan',           ar: 'اليابان' } },
  CIV: { flag: '🇨🇮', code: 'CIV', name: { en: 'Ivory Coast',     ar: 'ساحل العاج' } },
  NOR: { flag: '🇳🇴', code: 'NOR', name: { en: 'Norway',          ar: 'النرويج' } },
  MEX: { flag: '🇲🇽', code: 'MEX', name: { en: 'Mexico',          ar: 'المكسيك' } },
  ECU: { flag: '🇪🇨', code: 'ECU', name: { en: 'Ecuador',         ar: 'الإكوادور' } },
  ENG: { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', code: 'ENG', name: { en: 'England',         ar: 'إنجلترا' } },
  COD: { flag: '🇨🇩', code: 'COD', name: { en: 'DR Congo',        ar: 'الكونغو الديمقراطية' } },
  POR: { flag: '🇵🇹', code: 'POR', name: { en: 'Portugal',        ar: 'البرتغال' } },
  CRO: { flag: '🇭🇷', code: 'CRO', name: { en: 'Croatia',         ar: 'كرواتيا' } },
  ESP: { flag: '🇪🇸', code: 'ESP', name: { en: 'Spain',           ar: 'إسبانيا' } },
  AUT: { flag: '🇦🇹', code: 'AUT', name: { en: 'Austria',         ar: 'النمسا' } },
  USA: { flag: '🇺🇸', code: 'USA', name: { en: 'USA',             ar: 'الولايات المتحدة' } },
  BIH: { flag: '🇧🇦', code: 'BIH', name: { en: 'Bosnia & H.',     ar: 'البوسنة والهرسك' } },
  BEL: { flag: '🇧🇪', code: 'BEL', name: { en: 'Belgium',         ar: 'بلجيكا' } },
  SEN: { flag: '🇸🇳', code: 'SEN', name: { en: 'Senegal',         ar: 'السنغال' } },
  ARG: { flag: '🇦🇷', code: 'ARG', name: { en: 'Argentina',       ar: 'الأرجنتين' } },
  CPV: { flag: '🇨🇻', code: 'CPV', name: { en: 'Cabo Verde',      ar: 'الرأس الأخضر' } },
  AUS: { flag: '🇦🇺', code: 'AUS', name: { en: 'Australia',       ar: 'أستراليا' } },
  EGY: { flag: '🇪🇬', code: 'EGY', name: { en: 'Egypt',           ar: 'مصر' } },
  SUI: { flag: '🇨🇭', code: 'SUI', name: { en: 'Switzerland',     ar: 'سويسرا' } },
  ALG: { flag: '🇩🇿', code: 'ALG', name: { en: 'Algeria',         ar: 'الجزائر' } },
  COL: { flag: '🇨🇴', code: 'COL', name: { en: 'Colombia',        ar: 'كولومبيا' } },
  GHA: { flag: '🇬🇭', code: 'GHA', name: { en: 'Ghana',           ar: 'غانا' } },
};

export const R32 = [
  { id: 'r32-1',  date: 'Jun 28', venue: 'Toronto',         a: T.RSA, b: T.CAN, locked: 'b', score: '0–1' },
  { id: 'r32-2',  date: 'Jun 29', venue: 'Monterrey',       a: T.NED, b: T.MAR },
  { id: 'r32-3',  date: 'Jun 28', venue: 'Philadelphia',    a: T.GER, b: T.PAR, locked: 'b', score: '1–1 (3–4p)' },
  { id: 'r32-4',  date: 'Jun 30', venue: 'East Rutherford', a: T.FRA, b: T.SWE },
  { id: 'r32-5',  date: 'Jun 28', venue: 'Dallas',          a: T.BRA, b: T.JPN, locked: 'a', score: '2–1' },
  { id: 'r32-6',  date: 'Jun 30', venue: 'Arlington',       a: T.CIV, b: T.NOR },
  { id: 'r32-7',  date: 'Jun 30', venue: 'Mexico City',     a: T.MEX, b: T.ECU },
  { id: 'r32-8',  date: 'Jul 1',  venue: 'Atlanta',         a: T.ENG, b: T.COD },
  { id: 'r32-9',  date: 'Jul 2',  venue: 'Toronto',         a: T.POR, b: T.CRO },
  { id: 'r32-10', date: 'Jul 2',  venue: 'Los Angeles',     a: T.ESP, b: T.AUT },
  { id: 'r32-11', date: 'Jul 1',  venue: 'Santa Clara',     a: T.USA, b: T.BIH },
  { id: 'r32-12', date: 'Jul 1',  venue: 'Seattle',         a: T.BEL, b: T.SEN },
  { id: 'r32-13', date: 'Jul 3',  venue: 'Miami',           a: T.ARG, b: T.CPV },
  { id: 'r32-14', date: 'Jul 3',  venue: 'Arlington',       a: T.AUS, b: T.EGY },
  { id: 'r32-15', date: 'Jul 2',  venue: 'Vancouver',       a: T.SUI, b: T.ALG },
  { id: 'r32-16', date: 'Jul 3',  venue: 'Kansas City',     a: T.COL, b: T.GHA },
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
  { key: '32',    matches: R32 },
  { key: '16',    matches: R16 },
  { key: 'qf',    matches: QF },
  { key: 'sf',    matches: SF },
  { key: 'final', matches: FINAL, isFinal: true },
];

export const TOTAL_MATCHES = ROUNDS.reduce((n, r) => n + r.matches.length, 0);
