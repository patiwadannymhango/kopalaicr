export const EVENT = {
  title: 'KCM Kopala Inter Company Relay 2026',
  shortTitle: 'Kopala ICR 2026',
  motto: 'One Baton. One Team. One Goal.',
  theme: 'Celebrating Corporate Partnerships, Health and Wellness',
  tagline: 'By acting together, we can win.',
  date: 'Saturday, 3 October 2026',
  // The date is confirmed; the 06:00 flag-off is a placeholder pending an
  // official start-list from Zambia Athletics — same convention used on
  // the sibling Independence Run sites: leave a sensible early-morning
  // default rather than inventing a precise time nobody has confirmed.
  isoDate: '2026-10-03T06:00:00',
  venue: 'Nchanga Stadium, Chingola, Copperbelt Province',
  organizer: 'Zambia Athletics',
  // Published WhatsApp contact line from the live site — not invented.
  phone: '+260 964 576 875',
  // No public email published yet — leave blank rather than invent one.
  // The UI falls back to "Contact details coming soon" wherever this is empty.
  email: '',
};

export const RACE_FORMATS = [
  {
    code: '10KM',
    categoryCode: 'relay',
    label: 'Corporate Relay',
    detail: "8-runner teams · Men's, Women's & Mixed",
  },
  {
    code: '10KM',
    categoryCode: '10km-individual',
    label: 'Individual Race',
    detail: "Men's Open, Women's Open, Corporate, Masters",
  },
  {
    code: '5KM',
    categoryCode: '5km-fun-run',
    label: 'Fun Race & Walk',
    detail: 'Walk it, jog it, or run it — everyone welcome',
  },
];

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

/** Left blank until the organisers confirm official banking details — the
 * bank transfer step on the Register page shows "coming soon" while
 * these are empty rather than displaying a placeholder account number. */
export const BANK_DETAILS = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  branch: '',
};
