import type { IndividualBatchDetails, IndividualDetails, RegistrationRecord, TeamDetails, VendorDetails } from '../types';
import { RACE_CATEGORIES } from '../types';

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
  if (record.entryType === 'vendor') {
    const d = record.details as VendorDetails;
    return `${d.businessName} — ${d.contactPerson}`.trim();
  }
  if (record.entryType === 'individual-batch') {
    const d = record.details as IndividualBatchDetails;
    return `${d.submittedBy.fullName} — group of ${d.members.length}`;
  }
  const d = record.details as IndividualDetails;
  return d.fullName;
}

/** The category label to show for a registration, covering the individual
 * race categories, the relay team categories, and vendor categories. */
export function categoryLabel(record: RegistrationRecord): string {
  if (record.entryType === 'team') {
    const d = record.details as TeamDetails;
    return d.raceCategoryName || '';
  }
  if (record.entryType === 'vendor') {
    const d = record.details as VendorDetails;
    return d.categoryName || d.category;
  }
  if (record.entryType === 'individual-batch') {
    const d = record.details as IndividualBatchDetails;
    return `Group registration (${d.members.length} ${d.members.length === 1 ? 'person' : 'people'})`;
  }
  const d = record.details as IndividualDetails;
  const category = RACE_CATEGORIES.find((c) => c.value === d.raceCategory);
  return category ? category.label : '';
}
