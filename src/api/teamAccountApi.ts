import type { RunnerRosterEntry, TeamAccount } from '../types';
import { apiFetch } from './http';

/** The logged-in captain's own team account — roster, category, and
 * whether the base entry fee (covering the free runner allowance) has
 * been paid. Requires an auth token; apiFetch attaches it automatically
 * when one is stored. */
export async function fetchMyTeamAccount(): Promise<TeamAccount> {
  return apiFetch<TeamAccount>('/team/me/');
}

/** The per-runner fee charged for anyone added beyond the free
 * allowance covered by the team's entry fee. */
export async function fetchExtraRunnerFee(): Promise<number | null> {
  const result = await apiFetch<{ price: string | number }>('/registrations/team/extra-runner-fee/');
  const price = Number(result.price);
  return price > 0 ? price : null;
}

export interface AddRunnerResult {
  runnerId: string;
  /** True once this runner is confirmed on the roster — immediately for
   * anyone within the free allowance, or after the extra-runner fee
   * payment succeeds. */
  confirmed: boolean;
  /** True when this runner still needs the extra-runner fee paid before
   * they're confirmed — the caller should follow up with
   * initiatePayment({ registrationId: runnerId, ... }) from paymentApi. */
  paymentRequired: boolean;
  amount: number | null;
  currency: string;
}

/** Adds one runner to the logged-in team's roster. The backend decides
 * whether this seat is free (still within the team's covered allowance)
 * or chargeable (an extra seat beyond it) and reports back which. */
export async function addRunnerToRoster(runner: RunnerRosterEntry): Promise<AddRunnerResult> {
  return apiFetch<AddRunnerResult>('/team/me/roster/', {
    method: 'POST',
    body: JSON.stringify(runner),
  });
}
