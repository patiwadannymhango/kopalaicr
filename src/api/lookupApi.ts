import type { RegistrationRecord } from '../types';
import { apiFetch } from './http';

/** Looks up a registration (individual or team) by reference or email —
 * used by "Track your registration". */
export async function searchRegistration(query: string): Promise<RegistrationRecord | null> {
  try {
    return await apiFetch<RegistrationRecord>(`/registrations/lookup/?q=${encodeURIComponent(query)}`);
  } catch {
    return null;
  }
}
