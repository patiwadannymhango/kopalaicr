import type { TeamDetails } from '../types';
import { apiFetch } from './http';
import type { BackendCategory, SubmitRegistrationResult } from './individualApi';

/** Fetch every race a group can enter: the same categories/prices
 * Individual entry offers (one flat fee covers the whole declared
 * headcount) plus the one team-only category, 10KM Corporate Relay. */
export async function fetchRelayCategories(): Promise<BackendCategory[]> {
  return apiFetch<BackendCategory[]>('/registrations/team/categories/');
}

/** Step 1 of checkout: creates the team registration (captain, company,
 * roster) — no payment yet. */
export async function submitTeamRegistration(details: TeamDetails): Promise<SubmitRegistrationResult> {
  return apiFetch<SubmitRegistrationResult>('/registrations/team/', {
    method: 'POST',
    body: JSON.stringify({
      ...details,
      // The roster is an optional, pre-sized-to-headcount table — drop any
      // row nobody filled in, and send age as a number (or omit it) rather
      // than the empty-string the number input holds when left blank,
      // which the backend's IntegerField would reject outright.
      roster: details.roster
        .filter((r) => r.fullName.trim())
        .map((r) => ({
          fullName: r.fullName,
          gender: r.gender,
          age: r.age ? Number(r.age) : null,
          raceCategory: r.raceCategory,
        })),
    }),
  });
}
