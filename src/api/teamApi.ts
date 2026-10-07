import type { TeamDetails } from '../types';
import { apiFetch } from './http';
import type { BackendCategory, SubmitRegistrationResult } from './individualApi';

/** Fetch every race a group can enter: the same categories/prices
 * Individual entry offers (each participant's own race drives their own
 * share of the group's total) plus the one team-only category, 10KM
 * Corporate Relay. */
export async function fetchRelayCategories(): Promise<BackendCategory[]> {
  return apiFetch<BackendCategory[]>('/registrations/team/categories/');
}

/** Step 1 of checkout: creates the team registration (captain, company,
 * roster) — no payment yet. Every roster row is required (full name +
 * race category) by this point, validated before this is ever called. */
export async function submitTeamRegistration(details: TeamDetails): Promise<SubmitRegistrationResult> {
  return apiFetch<SubmitRegistrationResult>('/registrations/team/', {
    method: 'POST',
    body: JSON.stringify({
      ...details,
      // Send age as a number (or omit it) rather than the empty-string
      // the number input holds when left blank, which the backend's
      // IntegerField would reject outright.
      roster: details.roster.map((r) => ({
        fullName: r.fullName,
        gender: r.gender,
        age: r.age ? Number(r.age) : null,
        raceCategory: r.raceCategory,
      })),
    }),
  });
}
