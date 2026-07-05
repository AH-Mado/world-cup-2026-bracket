// i18n dictionary + helpers. Two languages: 'en' (default) and 'ar'. Team
// names live in data.js as { en, ar } objects; everything else in the UI is
// looked up here by key. `{0}`, `{1}`, … are positional interpolation slots.

const LANG_KEY = 'wc2026-lang-v1';

const dict = {
  en: {
    // Header + hero
    refresh:            'Refresh',
    language:           'Language',
    hero_eyebrow:       'Knockout Stage',
    hero_h1:            'Pick your champion.',
    hero_sub:           'Tap a team to advance them. Locked cards show the real result — everything else is your call.',
    live_loading:       'Loading live data…',
    live_cached:        'Cached bracket',
    live_offline:       'Offline · cached bracket',
    live_refreshing:    'Refreshing…',
    live_status:        'Live · {0} · {1}',
    live_finished_n:    '{0} finished',
    live_live_n:        '{0} live',
    live_no_changes:    'no changes',

    // Champion + progress
    champion_label:     'Your Predicted Champion',
    progress_label:     'Your Progress',
    reset_btn:          'Reset',
    reset_confirm:      'Reset all your picks? Locked real-world results stay.',

    // Round tabs / labels
    round_32_label:     'Round of 32',   round_32_short:    'R32',
    round_16_label:     'Round of 16',   round_16_short:    'R16',
    round_qf_label:     'Quarter-finals',round_qf_short:    'QF',
    round_sf_label:     'Semi-finals',   round_sf_short:    'SF',
    round_final_label:  'Final',         round_final_short: 'Final',

    // Match card
    awaiting_winner:    'Awaiting winner',
    tbd:                '— TBD —',
    vs:                 'VS',
    live_badge:         'LIVE',
    full_time_locked:   'Full-time · locked',
    grand_final:        'The Grand Final',

    // Modal
    close_details:      'Close details',
    match_details:      'Match details',
    goal_scorers:       'Goal scorers',
    match_stats:        'Match stats',
    no_goals:           'No goals',
    full_time:          'Full-time',
    live_label:         'Live',
    modal_loading:      'Loading match details…',
    modal_error:        "Couldn't load match details.",
    modal_no_stats:     'No detailed stats published yet. Check back after kickoff.',
    goal_og:            'OG',
    goal_pen:           'pen',

    // Stats
    stat_possession:    'Possession',
    stat_shots:         'Shots',
    stat_on_target:     'On target',
    stat_corners:       'Corners',
    stat_offsides:      'Offsides',
    stat_fouls:         'Fouls',
    stat_yellow:        'Yellow cards',
    stat_red:           'Red cards',
    stat_saves:         'Saves',
  },
  ar: {
    refresh:            'تحديث',
    language:           'اللغة',
    hero_eyebrow:       'دور خروج المغلوب',
    hero_h1:            'اختر بطلك.',
    hero_sub:           'اضغط على الفريق لتأهيله. البطاقات المؤمّنة تعرض النتيجة الحقيقية — الباقي اختيارك.',
    live_loading:       'جاري تحميل البيانات المباشرة…',
    live_cached:        'شبكة محفوظة',
    live_offline:       'غير متصل · شبكة محفوظة',
    live_refreshing:    'جاري التحديث…',
    live_status:        'مباشر — {0} — {1}',
    live_finished_n:    '{0} منتهية',
    live_live_n:        '{0} مباشرة',
    live_no_changes:    'لا تغييرات',

    champion_label:     'بطلك المتوقع',
    progress_label:     'تقدمك',
    reset_btn:          'إعادة ضبط',
    reset_confirm:      'إعادة ضبط جميع اختياراتك؟ النتائج الحقيقية المغلقة تبقى.',

    round_32_label:     'دور الـ٣٢',     round_32_short:    'دور الـ٣٢',
    round_16_label:     'دور الـ١٦',     round_16_short:    'دور الـ١٦',
    round_qf_label:     'ربع النهائي',   round_qf_short:    'ربع النهائي',
    round_sf_label:     'نصف النهائي',   round_sf_short:    'نصف النهائي',
    round_final_label:  'النهائي',        round_final_short: 'النهائي',

    awaiting_winner:    'بانتظار الفائز',
    tbd:                '— قريباً —',
    vs:                 'ضد',
    live_badge:         'مباشر',
    full_time_locked:   'نهاية المباراة · مغلق',
    grand_final:        'المباراة النهائية',

    close_details:      'إغلاق التفاصيل',
    match_details:      'تفاصيل المباراة',
    goal_scorers:       'الأهداف',
    match_stats:        'إحصائيات المباراة',
    no_goals:           'لا أهداف',
    full_time:          'نهاية المباراة',
    live_label:         'مباشر',
    modal_loading:      'جاري تحميل تفاصيل المباراة…',
    modal_error:        'تعذر تحميل تفاصيل المباراة.',
    modal_no_stats:     'لم تُنشر إحصائيات مفصلة بعد. عُد بعد بداية المباراة.',
    goal_og:            'خطأ',
    goal_pen:           'ركلة',

    stat_possession:    'الاستحواذ',
    stat_shots:         'التسديدات',
    stat_on_target:     'على المرمى',
    stat_corners:       'الركنيات',
    stat_offsides:      'التسللات',
    stat_fouls:         'الأخطاء',
    stat_yellow:        'البطاقات الصفراء',
    stat_red:           'البطاقات الحمراء',
    stat_saves:         'التصديات',
  },
};

export let lang = localStorage.getItem(LANG_KEY) || 'en';

export function setLang(next) {
  if (next !== 'en' && next !== 'ar') return;
  lang = next;
  localStorage.setItem(LANG_KEY, next);
  document.documentElement.setAttribute('lang', next);
  // dir flips the whole document — flex row reverses, `inset-inline-*` mirrors,
  // `text-align: start/end` mirrors. Everything else falls out of that.
  document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');
}

export function toggleLang() {
  setLang(lang === 'en' ? 'ar' : 'en');
}

export function t(key, ...args) {
  let s = (dict[lang] && dict[lang][key]) || dict.en[key] || key;
  args.forEach((a, i) => { s = s.split(`{${i}}`).join(a); });
  return s;
}

// Team names ship as { en, ar } objects in data.js. Fall back to English if
// the current lang is missing a translation (shouldn't happen, but safe).
export function teamName(team) {
  if (!team || team.name == null) return '';
  if (typeof team.name === 'string') return team.name;
  return team.name[lang] || team.name.en || '';
}

// ESPN's scoreboard payload always uses English display names, so team-name
// matching in live.js must resolve to the English form regardless of the
// current UI language.
export function englishName(team) {
  if (!team || team.name == null) return '';
  if (typeof team.name === 'string') return team.name;
  return team.name.en || '';
}

// data.js seeds each match with a hard-coded English placeholder date like
// "Jul 5" — those get overwritten by ESPN sync eventually, but before the
// sync (or for later rounds ESPN hasn't published yet) they'd otherwise
// render in English mid-Arabic-UI. Turn them into day-first, zero-padded,
// Arabic-Indic dates that match the fmtDate output shape.
// No-op for English mode and for strings that don't match the seed format
// (e.g. dates that fmtDate already localized).
const AR_MONTHS = {
  Jan: 'يناير', Feb: 'فبراير', Mar: 'مارس', Apr: 'أبريل',
  May: 'مايو',  Jun: 'يونيو',  Jul: 'يوليو', Aug: 'أغسطس',
  Sep: 'سبتمبر', Oct: 'أكتوبر', Nov: 'نوفمبر', Dec: 'ديسمبر'
};
const AR_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
const toArDigits = s => String(s).replace(/\d/g, d => AR_DIGITS[+d]);

export function localizeFallbackDate(str) {
  if (lang !== 'ar' || !str) return str;
  const m = str.match(/^([A-Za-z]{3})\s+(\d{1,2})$/);
  if (!m) return str;
  const monthAr = AR_MONTHS[m[1]];
  if (!monthAr) return str;
  const day = m[2].length === 1 ? '0' + m[2] : m[2];
  return `${toArDigits(day)} ${monthAr}`;
}

// Populate static [data-i18n] elements and update the toggle button's label.
// Called once on boot and again whenever the language changes.
export function applyI18n() {
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    // Format: "attrName:key" or comma-separated pairs
    const spec = el.getAttribute('data-i18n-attr');
    spec.split(',').forEach(pair => {
      const [attr, key] = pair.split(':').map(s => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
  const label = document.getElementById('langLabel');
  if (label) label.textContent = lang === 'en' ? 'EN' : 'ع';
}
