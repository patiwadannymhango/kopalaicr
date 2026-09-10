/**
 * ---------------------------------------------------------------------------
 * Shared fetch helper for the (not yet built) Kopala ICR backend. Every
 * module in this folder is written against real, versioned endpoints —
 * there is nothing to mock or fake here. Until the backend exists these
 * calls simply fail against VITE_API_BASE_URL, which is expected: wiring
 * the real API in later is a matter of standing up the backend, not
 * touching this frontend code.
 * ---------------------------------------------------------------------------
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8004').replace(/\/$/, '');

const AUTH_TOKEN_KEY = 'kicr-team-token';

/** Only team/company accounts authenticate in this app (individual and
 * vendor-style flows don't), so a single stored token is enough — no
 * per-role namespacing needed. */
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // storage unavailable — the session just won't survive a reload.
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.detail || Object.values(body)[0]?.toString() || message;
    } catch {
      // response wasn't JSON — fall back to the generic message above
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
