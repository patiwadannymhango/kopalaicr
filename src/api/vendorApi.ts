import type { VendorDetails } from '../types';
import { apiFetch } from './http';
import type { BackendCategory } from './individualApi';

/** Fetch every vendor/exhibitor category with its fee — a free category
 * (e.g. Official Sponsor) has price 0 and confirms with no payment step. */
export async function fetchVendorCategories(): Promise<BackendCategory[]> {
  return apiFetch<BackendCategory[]>('/registrations/vendor/categories/');
}

export interface SubmitVendorRegistrationResult {
  registrationId: string;
  /** Not assigned yet unless the category was free — see
   * SubmitRegistrationResult's comment in individualApi.ts. */
  reference: string | null;
  amount: number | null;
  currency: string;
  /** "CONFIRMED" for a free category (no payment needed) — the caller
   * should skip straight to the done step when it sees this rather than
   * "PENDING_PAYMENT". */
  status: string;
}

/** Step 1 of checkout: creates the vendor registration (no payment yet,
 * unless the category is free). */
export async function submitVendorRegistration(details: VendorDetails): Promise<SubmitVendorRegistrationResult> {
  return apiFetch<SubmitVendorRegistrationResult>('/registrations/vendor/', {
    method: 'POST',
    body: JSON.stringify(details),
  });
}
