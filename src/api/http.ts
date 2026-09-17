/**
 * ---------------------------------------------------------------------------
 * Shared fetch helper for the Kopala ICR backend. Every module in this
 * folder is written against real, versioned endpoints. There is no
 * authenticated flow in this app — every backend endpoint is public.
 * ---------------------------------------------------------------------------
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8004').replace(/\/$/, '');

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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
