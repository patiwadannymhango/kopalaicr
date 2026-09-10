import type { IndividualDetails, RegistrationRecord, TeamDetails } from '../types';
import { RACE_CATEGORIES, INDIVIDUAL_DIVISIONS, RELAY_CATEGORIES } from '../types';

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  'pending-bank-transfer': 'Awaiting bank transfer',
  processing: 'Processing',
  failed: 'Failed',
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

/** A human name to show for a registration regardless of whether it's an
 * individual entrant or a team (identified by its captain). */
export function displayName(record: RegistrationRecord): string {
  if (record.entryType === 'team') {
    const d = record.details as TeamDetails;
    return `${d.teamName} — ${d.captainFirstName} ${d.captainLastName} (captain)`.trim();
  }
  const d = record.details as IndividualDetails;
  return d.fullName;
}

/** The race/category label to show for a registration, covering both the
 * individual race categories and the relay team categories. */
export function categoryLabel(record: RegistrationRecord): string {
  if (record.entryType === 'team') {
    const d = record.details as TeamDetails;
    const category = RELAY_CATEGORIES.find((c) => c.value === d.relayCategory);
    return category ? `10KM Corporate Relay — ${category.label}` : '10KM Corporate Relay';
  }
  const d = record.details as IndividualDetails;
  const category = RACE_CATEGORIES.find((c) => c.value === d.raceCategory);
  const division = INDIVIDUAL_DIVISIONS.find((v) => v.value === d.division);
  if (!category) return '';
  return division ? `${category.label} — ${division.label}` : category.label;
}
