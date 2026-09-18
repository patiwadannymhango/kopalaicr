import { EVENT } from '../data/event';
import type { IndividualDetails, RegistrationRecord, TeamDetails, VendorDetails } from '../types';
import { categoryLabel, statusLabel } from './registrationDisplay';

const COPPER: [number, number, number] = [217, 119, 47];
const INK: [number, number, number] = [26, 20, 15];
const MUTED: [number, number, number] = [110, 101, 92];
const LINE: [number, number, number] = [225, 218, 210];

const GENDER_LABEL: Record<string, string> = { male: 'Male', female: 'Female' };
const AGE_LABEL: Record<string, string> = {
  'Under 18': 'Under 18',
  '18-29': '18–29',
  '30-39': '30–39',
  '40-49': '40–49',
  '50-59': '50–59',
  '60+': '60+',
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

/** Builds the ordered list of label/value rows to print, skipping anything
 * blank so a thinner record (e.g. from the "track registration" lookup,
 * which the backend only partially populates) still renders a clean
 * receipt instead of a page full of empty fields. */
function buildRows(record: RegistrationRecord): [string, string][] {
  const { payment } = record;
  const rows: [string, string][] = [];

  const add = (label: string, value: string | undefined | null) => {
    if (value && value.trim()) rows.push([label, value]);
  };

  const entryTypeLabel =
    record.entryType === 'team'
      ? '10KM Corporate Relay (team)'
      : record.entryType === 'vendor'
        ? 'Vendor / exhibitor entry'
        : 'Individual entry';

  add('Reference', record.reference);
  add('Entry type', entryTypeLabel);
  add('Status', statusLabel(record.status));
  add('Submitted', fmtDate(record.submittedAt));
  add('Category', categoryLabel(record));

  if (record.entryType === 'team') {
    const d = record.details as TeamDetails;
    add('Team name', d.teamName);
    add('Company / institution', d.companyOrInstitution);
    add('Captain', `${d.captainFirstName} ${d.captainLastName}`.trim());
    add('Captain email', d.captainEmail);
    add('Captain phone', d.captainPhone);
    if (d.roster.length) add('Runners submitted', `${d.roster.length}`);
  } else if (record.entryType === 'vendor') {
    const d = record.details as VendorDetails;
    add('Business name', d.businessName);
    add('Contact person', d.contactPerson);
    add('Email', d.email);
    add('Phone', d.phone);
    add('Business location', d.businessLocation);
    add('Products / services', d.productsServices);
  } else {
    const d = record.details as IndividualDetails;
    add('Full name', d.fullName);
    add('Email', d.email);
    add('Phone', d.phone);
    add('Gender', GENDER_LABEL[d.gender] ?? '');
    add('Age range', AGE_LABEL[d.ageRange] ?? '');
    add('T-shirt size', d.tShirtSize);
    add('Club / institution', d.clubOrInstitution);
    add('Emergency contact', d.emergencyContactName);
    add('Emergency phone', d.emergencyContactPhone);
  }

  if (record.amount != null) add('Amount paid', `${record.currency ?? 'K'} ${record.amount.toFixed(2)}`);
  add(
    'Payment method',
    payment.method === 'card' ? 'Card' : payment.method === 'mobile-money' ? 'Mobile money' : 'Bank transfer'
  );
  if (payment.method === 'mobile-money') add('Mobile money provider', payment.provider?.replace('_', ' ') ?? '');

  return rows;
}

/** Generates and downloads a receipt PDF for a registration, entirely
 * client-side from data already in local state / the API response — no
 * backend receipt endpoint exists or is needed. jsPDF is dynamically
 * imported so its ~200KB doesn't sit in the main bundle for every visitor
 * who never registers. */
export async function downloadReceipt(record: RegistrationRecord): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 56;
  let y = 64;

  doc.setFillColor(...COPPER);
  doc.rect(0, 0, pageWidth, 8, 'F');

  doc.setTextColor(...COPPER);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(EVENT.title, margin, y);

  doc.setTextColor(...MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 18;
  doc.text(`${EVENT.date} · ${EVENT.venue}`, margin, y);

  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  y += 34;
  doc.text('Registration receipt', margin, y);

  y += 10;
  doc.setDrawColor(...LINE);
  doc.line(margin, y, pageWidth - margin, y);

  const rows = buildRows(record);
  y += 28;
  const labelWidth = 150;

  for (const [label, value] of rows) {
    if (y > 760) {
      doc.addPage();
      y = 64;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(label, margin, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    const valueLines = doc.splitTextToSize(value, pageWidth - margin - (margin + labelWidth));
    doc.text(valueLines, margin + labelWidth, y);
    y += 18 * valueLines.length;

    doc.setDrawColor(...LINE);
    doc.line(margin, y - 8, pageWidth - margin, y - 8);
  }

  y += 24;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    'This receipt is generated from your registration details and serves as proof of entry. Keep your reference number handy on race day.',
    margin,
    y,
    { maxWidth: pageWidth - margin * 2 }
  );
  const contactLine = [EVENT.email, EVENT.phone].filter(Boolean).join('  ·  ');
  if (contactLine) {
    y += 28;
    doc.text(contactLine, margin, y);
  }

  doc.save(`${EVENT.shortTitle.replace(/\s+/g, '-')}-Receipt-${record.reference || 'registration'}.pdf`);
}
