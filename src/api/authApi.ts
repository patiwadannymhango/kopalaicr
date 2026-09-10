import { apiFetch, clearAuthToken, setAuthToken } from './http';

export interface LoginResult {
  authToken: string;
}

/** Logs a team/company in with the captain email and password set during
 * team registration. On success the token is stored immediately so the
 * caller can just redirect — no separate "now save the token" step. */
export async function loginTeamAccount(email: string, password: string): Promise<LoginResult> {
  const result = await apiFetch<LoginResult>('/auth/team/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(result.authToken);
  return result;
}

/** Client-side only — there's no server session to invalidate beyond the
 * bearer token, so this just forgets it locally. */
export function logoutTeamAccount(): void {
  clearAuthToken();
}
