export type RaceCategory =
  | ''
  | '5km-individual'
  | '10km-individual'
  | '21km-individual'
  | '100m-ceo'
  | '100m-directors'
  | 'kids-athletics';

export const RACE_CATEGORIES: { value: RaceCategory; label: string; distance: string }[] = [
  { value: '5km-individual', label: '5KM Individual Race & Walk', distance: '5 KM' },
  { value: '10km-individual', label: '10KM Individual Race', distance: '10 KM' },
  { value: '21km-individual', label: '21KM Individual Race & Walk', distance: '21 KM' },
  { value: '100m-ceo', label: '100m CEO Race', distance: '100 M' },
  { value: '100m-directors', label: '100m Directors Race', distance: '100 M' },
  { value: 'kids-athletics', label: 'Kids Athletics', distance: 'Fun run' },
];

export type IndividualDivision = '' | 'mens-open' | 'womens-open' | 'corporate' | 'masters';

/** Only meaningful for the 5KM, 10KM and 21KM Individual races — the 100m
 * CEO and Directors races and Kids Athletics have no divisions, they're
 * open to whoever's eligible for that race. */
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
