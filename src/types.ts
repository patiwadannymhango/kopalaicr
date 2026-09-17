export type RaceCategory = '' | '10km-individual' | '5km-fun-run';

export const RACE_CATEGORIES: { value: RaceCategory; label: string; distance: string }[] = [
  { value: '10km-individual', label: '10KM Individual Race', distance: '10 KM' },
  { value: '5km-fun-run', label: '5KM Fun Race & Walk', distance: '5 KM' },
];

export type IndividualDivision = '' | 'mens-open' | 'womens-open' | 'corporate' | 'masters';

/** Only meaningful for the 10KM Individual Race — the 5KM Fun Race & Walk
 * has no divisions, it's open to everyone. */
export const INDIVIDUAL_DIVISIONS: { value: IndividualDivision; label: string }[] = [
  { value: 'mens-open', label: "Men's Open" },
  { value: 'womens-open', label: "Women's Open" },
  { value: 'corporate', label: 'Corporate' },
  { value: 'masters', label: 'Masters' },
];

export type RelayCategory = '' | 'mens-team' | 'womens-team' | 'mixed-team';

export const RELAY_CATEGORIES: { value: RelayCategory; label: string }[] = [
  { value: 'mens-team', label: "Men's Team" },
  { value: 'womens-team', label: "Women's Team" },
  { value: 'mixed-team', label: 'Mixed Team' },
];

export const RELAY_TEAM_SIZE = 8;

export type Gender = '' | 'male' | 'female';
export type AgeRange = '' | 'Under 18' | '18-29' | '30-39' | '40-49' | '50-59' | '60+';
export type TShirtSize = '' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL' | '4XL' | '5XL';
export type PaymentMethod = 'mobile-money' | 'card' | 'bank-transfer';
export type MobileMoneyProvider = '' | 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA';
export type RegistrationStatus = 'confirmed' | 'pending-bank-transfer' | 'processing' | 'failed';
export type EntryType = 'individual' | 'team';
export type Step = 'details' | 'payment' | 'processing' | 'done';

export interface IndividualDetails {
  fullName: string;
  email: string;
  phone: string;
  gender: Gender;
  ageRange: AgeRange;
  country: string;
  tShirtSize: TShirtSize;
  raceCategory: RaceCategory;
  division: IndividualDivision;
  townOrCity: string;
  clubOrInstitution: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes: string;
  acceptedTerms: boolean;
}

export interface RunnerRosterEntry {
  fullName: string;
  gender: Gender;
}

export interface TeamDetails {
  teamName: string;
  companyOrInstitution: string;
  relayCategory: RelayCategory;
  captainFirstName: string;
  captainLastName: string;
  captainEmail: string;
  captainPhone: string;
  roster: RunnerRosterEntry[];
  acceptedTerms: boolean;
}

export interface PaymentInfo {
  method: PaymentMethod;
  provider?: MobileMoneyProvider;
  phoneNumber?: string;
  city?: string;
  address?: string;
  zipCode?: string;
}

export interface RegistrationRecord {
  /** Assigned by the backend only once the registration is confirmed —
   * null while still pending payment or bank transfer. */
  reference: string | null;
  entryType: EntryType;
  details: IndividualDetails | TeamDetails;
  payment: PaymentInfo;
  status: RegistrationStatus;
  submittedAt: string;
  amount?: number | null;
  currency?: string;
}

/** A mobile money or card payment that's been sent to the payment gateway
 * and is waiting on an outcome. For card payments the browser navigates
 * away to the gateway's hosted checkout and back, so this is persisted to
 * localStorage by whichever flow owns it and resumed on return. */
export interface PendingPayment {
  paymentId: string;
  registrationId: string;
  /** Not assigned yet at this point in the flow — see RegistrationRecord. */
  reference: string | null;
  email: string;
  amount: number | null;
  currency: string;
  method: 'mobile-money' | 'card';
  phoneNumber: string;
  provider: MobileMoneyProvider;
}
