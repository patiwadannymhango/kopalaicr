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

export const RELAY_TEAM_SIZE = 8;

export type VendorRequirement =
  | ''
  | 'exhibition-space'
  | 'vendor-stall'
  | 'food-beverage-stall'
  | 'corporate-activation'
  | 'branding-promotional'
  | 'other';

export const VENDOR_REQUIREMENTS: { value: VendorRequirement; label: string }[] = [
  { value: 'exhibition-space', label: 'Exhibition Space' },
  { value: 'vendor-stall', label: 'Exhibitor Stall' },
  { value: 'food-beverage-stall', label: 'Food & Beverage Stall' },
  { value: 'corporate-activation', label: 'Corporate Activation' },
  { value: 'branding-promotional', label: 'Branding / Promotional Space' },
  { value: 'other', label: 'Other' },
];

export type Gender = '' | 'male' | 'female';
export type AgeRange = '' | 'Under 18' | '18-29' | '30-39' | '40-49' | '50-59' | '60+';
export type PaymentMethod = 'mobile-money' | 'card' | 'bank-transfer';
export type MobileMoneyProvider = '' | 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA';
export type RegistrationStatus = 'confirmed' | 'pending-bank-transfer' | 'processing' | 'failed';
export type EntryType = 'individual' | 'individual-batch' | 'team' | 'vendor';
export type Step = 'details' | 'payment' | 'processing' | 'done';

export interface IndividualDetails {
  fullName: string;
  email: string;
  phone: string;
  gender: Gender;
  ageRange: AgeRange;
  country: string;
  raceCategory: RaceCategory;
  townOrCity: string;
  clubOrInstitution: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes: string;
  acceptedTerms: boolean;
}

/** One row of a group registration — same shape as IndividualDetails
 * minus acceptedTerms (collected once, at the batch level) plus a
 * client-side `id` for React list keys and an optional per-field
 * `errors` map (populated by an Excel upload parse, or by the create
 * endpoint's validation response). */
export interface BulkMemberRow {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: Gender;
  ageRange: AgeRange;
  country: string;
  raceCategory: RaceCategory;
  townOrCity: string;
  clubOrInstitution: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes: string;
  errors?: Record<string, string>;
}

export interface SubmittedBy {
  fullName: string;
  email: string;
  phone: string;
}

export interface IndividualBatchDetails {
  submittedBy: SubmittedBy;
  members: { fullName: string; raceCategory: RaceCategory }[];
  acceptedTerms: boolean;
}

export interface RunnerRosterEntry {
  fullName: string;
  gender: Gender;
  age: string;
  raceCategory: string; // backend Category code — which race this person runs, required
  raceCategoryName: string; // resolved display name, set alongside raceCategory when chosen
}

export interface TeamDetails {
  teamName: string;
  companyOrInstitution: string;
  captainFirstName: string;
  captainLastName: string;
  captainEmail: string;
  captainPhone: string;
  participantCount: string;
  roster: RunnerRosterEntry[];
  acceptedTerms: boolean;
}

export interface VendorDetails {
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  businessLocation: string;
  productsServices: string;
  category: string; // vendor category code
  /** Display name for `category` (e.g. "Exhibition Stall") — vendor
   * categories are entirely backend-driven, unlike RACE_CATEGORIES, so
   * there's no static list to resolve this from later. Set when the
   * category is chosen; ignored by the backend (extra JSON fields are
   * simply dropped by the serializer). */
  categoryName: string;
  requirement: VendorRequirement;
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
  details: IndividualDetails | IndividualBatchDetails | TeamDetails | VendorDetails;
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
