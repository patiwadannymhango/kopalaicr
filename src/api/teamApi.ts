import type { TeamDetails } from '../types';
import { apiFetch } from './http';
import type { BackendCategory, SubmitRegistrationResult } from './individualApi';

/** Fetch every group/relay race category (5KM/10KM/21KM Corporate Relay,
 * 100M CEO/Directors, Kids Athletics) with its flat per-group entry fee. */
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
