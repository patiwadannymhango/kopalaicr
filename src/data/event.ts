export const EVENT = {
  title: 'KCM Kopala Inter Company Relay 2026',
  shortTitle: 'The KCM Kopala ICR 2026',
  motto: 'One Baton. One Team. One Goal.',
  theme: 'Celebrating Corporate Partnerships, Health and Wellness',
  tagline: 'By acting together, we can win.',
  date: 'Saturday, 17 October 2026',
  // The date is confirmed; the 06:00 flag-off is a placeholder pending an
  // official start-list from Zambia Athletics — same convention used on
  // the sibling Independence Run sites: leave a sensible early-morning
  // default rather than inventing a precise time nobody has confirmed.
  isoDate: '2026-10-17T06:00:00',
  venue: 'Nchanga Stadium, Chingola, Copperbelt Province',
  organizer: 'Zambia Athletics',
  // Published WhatsApp contact line.
  phone: '+260 977 719 828',
  // General contact number (calls, not WhatsApp) and email, from the
  // official event advert/jingle script.
  contactPhone: '+260 77 660 8981',
  email: 'intercompanyrelay@gmail.com',
};

export const RACE_FORMATS = [
  {
    code: '10KM',
    categoryCode: 'relay',
    label: 'Corporate Relay',
    detail: "8-runner teams · Men's, Women's & Mixed",
  },
  {
    code: '5KM',
    categoryCode: '5km-individual',
    label: 'Individual Race & Walk',
    detail: 'Race it or walk it — same divisions as the 10KM & 21KM',
  },
  {
    code: '10KM',
    categoryCode: '10km-individual',
    label: 'Individual Race',
    detail: "Men's Open, Women's Open, Corporate, Masters",
  },
  {
    code: '21KM',
    categoryCode: '21km-individual',
    label: 'Individual Race & Walk',
    detail: 'Race it or walk it — same divisions as the 10KM',
  },
  {
    code: '100M',
    categoryCode: '100m-ceo',
    label: 'CEO Race',
    detail: 'A fun sprint reserved for company chief executives',
  },
  {
    code: '100M',
    categoryCode: '100m-directors',
    label: 'Directors Race',
    detail: 'A fun sprint for company directors and senior leadership',
  },
  {
    code: 'KIDS',
    categoryCode: 'kids-athletics',
    label: 'Kids Athletics',
    detail: 'Fun athletics activities for children on race day',
  },
];

/** Flat placeholder entry fee (in Kwacha) shown across the site until the
 * backend is live and returns real per-category pricing. Every fee display
 * falls back to this value whenever the fetched category is missing or has
 * no price — remove the fallback once real pricing is wired up. */
export const DEFAULT_ENTRY_FEE = 2;

export const OBJECTIVES = [
  { icon: '🤝', title: 'Corporate Partnerships', desc: 'Bringing companies and institutions together across every sector of the economy.' },
  { icon: '💪', title: 'Employee Wellness', desc: 'Encouraging healthier, more active workplaces across the Copperbelt.' },
  { icon: '🏃', title: 'Team Building', desc: 'Eight runners, one baton — building trust and camaraderie on the road.' },
  { icon: '❤️', title: 'Healthy Living', desc: 'Promoting fitness and wellbeing for participants of every age and ability.' },
  { icon: '🌍', title: 'Community Engagement', desc: 'Opening the race to families, students and the wider Chingola community.' },
  { icon: '🔗', title: 'Corporate Networking', desc: 'Connecting leaders and teams from different companies on race day.' },
  { icon: '🥇', title: 'Athletics Development', desc: 'Supporting competitive athletics under Zambia Athletics in the Copperbelt.' },
];

export const INCLUSIONS = [
  'Official race bib',
  'Finisher medal',
  'Refreshments',
  'Medical support',
  'Timed race results',
  'Participation certificate',
];

/** No sponsors have signed on publicly yet — the real site shows tier
 * categories rather than logos, so this does the same instead of
 * inventing company names. Once real sponsors are confirmed, give each
 * tier a `sponsors: string[]`. */
export const SPONSOR_TIERS = [
  { name: 'Platinum Sponsor', tier: 'Presenting partner' },
  { name: 'Gold Sponsor', tier: 'Major partner' },
  { name: 'Silver Sponsor', tier: 'Supporting partner' },
  { name: 'Bronze Sponsor', tier: 'Contributing partner' },
  { name: 'Official Partner', tier: 'Event partner' },
  { name: 'Media Partner', tier: 'Coverage partner' },
  { name: 'Medical Partner', tier: 'Safety partner' },
  { name: 'Hydration Partner', tier: 'Wellness partner' },
];

/** Confirmed official partners/organisers — distinct from SPONSOR_TIERS
 * above (which are still-unconfirmed paid sponsorship slots). Logo files
 * live in public/logos/, pre-trimmed and compressed. */
export const PARTNER_LOGOS = [
  // lightBg: its brown/navy wordmark is too low-contrast on the site's
  // dark cards, so it gets a white chip instead of the usual dark one.
  // featured: KCM is the event's main/title sponsor — its card renders
  // larger than the rest with a "Main Sponsor" badge (see PartnerLogos).
  { name: 'Konkola Copper Mines Plc', file: '/logos/kcm.png', lightBg: true, featured: true },
  { name: 'Zambia Athletics', file: '/logos/za.png' },
  { name: 'Ministry of Youth, Sport & Arts', file: '/logos/mysa.png' },
  { name: 'National Sports Council of Zambia', file: '/logos/nscz.png' },
  { name: 'FIT Sports Drink', file: '/logos/fit.png' },
  { name: 'Vatra Mineral Water', file: '/logos/vatra.png' },
];

/** Left blank until the organisers confirm official banking details — the
 * bank transfer step on the Register page shows "coming soon" while
 * these are empty rather than displaying a placeholder account number. */
export const BANK_DETAILS = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  branch: '',
};
