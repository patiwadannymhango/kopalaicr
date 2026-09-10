import type { TeamDetails } from '../types';
import { apiFetch, setAuthToken } from './http';
import type { BackendCategory, SubmitRegistrationResult } from './individualApi';

/** Fetch the 10KM Corporate Relay categories (Men's/Women's/Mixed Team)
 * with the per-team entry fee — one fee covers the full 8-runner team. */
export async function fetchRelayCategories(): Promise<BackendCategory[]> {
  return apiFetch<BackendCategory[]>('/registrations/team/categories/');
}

export interface SubmitTeamRegistrationResult extends SubmitRegistrationResult {
  /** The captain's login account is created in the same call (using the
   * password collected alongside the team details), so this comes back
   * already signed in — no separate login step right after registering. */
  authToken: string;
}

/** Step 1 of checkout: creates the team registration (captain, company,
 * roster) AND the captain's login account in one call — no payment yet.
 * `password` is what the captain will use at /login later to manage the
 * roster (add runners beyond the free allowance, check payment status). */
export async function submitTeamRegistration(
  details: TeamDetails,
  password: string
): Promise<SubmitTeamRegistrationResult> {
  const result = await apiFetch<SubmitTeamRegistrationResult>('/registrations/team/', {
    method: 'POST',
    body: JSON.stringify({ ...details, password }),
  });
  setAuthToken(result.authToken);
  return result;
}
