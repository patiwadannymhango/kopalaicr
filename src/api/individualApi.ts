import type { IndividualDetails } from '../types';
import { apiFetch } from './http';

export interface BackendCategory {
  id: string;
  name: string;
  code: string;
  price: string | number;
  currency: string;
}

/** Fetch every individual race category with its fee — used by the Home
 * and Categories pages, and the fee preview on the Register page. */
export async function fetchIndividualCategories(): Promise<BackendCategory[]> {
  return apiFetch<BackendCategory[]>('/registrations/individual/categories/');
}

export interface SubmitRegistrationResult {
  registrationId: string;
  /** Not assigned yet — the backend only generates a reference once the
   * registration is confirmed (i.e. after payment succeeds, or a bank
   * transfer is manually reconciled). */
  reference: string | null;
  amount: number | null;
  currency: string;
}

/** Step 1 of checkout: creates the registration on the backend (no
 * payment yet). */
export async function submitIndividualRegistration(details: IndividualDetails): Promise<SubmitRegistrationResult> {
  return apiFetch<SubmitRegistrationResult>('/registrations/individual/', {
    method: 'POST',
    body: JSON.stringify(details),
  });
}
