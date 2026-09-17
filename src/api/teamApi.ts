import type { TeamDetails } from '../types';
import { apiFetch } from './http';
import type { BackendCategory, SubmitRegistrationResult } from './individualApi';

/** Fetch the 10KM Corporate Relay categories (Men's/Women's/Mixed Team)
 * with the per-team entry fee — one fee covers the full 8-runner team. */
export async function fetchRelayCategories(): Promise<BackendCategory[]> {
  return apiFetch<BackendCategory[]>('/registrations/team/categories/');
}

/** Step 1 of checkout: creates the team registration (captain, company,
 * roster) — no payment yet. */
export async function submitTeamRegistration(details: TeamDetails): Promise<SubmitRegistrationResult> {
  return apiFetch<SubmitRegistrationResult>('/registrations/team/', {
    method: 'POST',
    body: JSON.stringify(details),
  });
}
