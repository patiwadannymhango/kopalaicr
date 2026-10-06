import type { BulkMemberRow, IndividualDetails, SubmittedBy } from '../types';
import { apiFetch, API_BASE_URL } from './http';

export interface BackendCategory {
  id: string;
  name: string;
  code: string;
  price: string | number;
  currency: string;
}

/** Fetch every individual race category with its fee — used by the Home
 * and Categories pages, and the fee preview on the Register page. */
export async function fetchIndividualCategories(): Promise<BackendCategory[]> {
  return apiFetch<BackendCategory[]>('/registrations/individual/categories/');
}

export interface SubmitRegistrationResult {
  registrationId: string;
  /** Not assigned yet — the backend only generates a reference once the
   * registration is confirmed (i.e. after payment succeeds, or a bank
   * transfer is manually reconciled). */
  reference: string | null;
  amount: number | null;
  currency: string;
}

/** Step 1 of checkout: creates the registration on the backend (no
 * payment yet). */
export async function submitIndividualRegistration(details: IndividualDetails): Promise<SubmitRegistrationResult> {
  return apiFetch<SubmitRegistrationResult>('/registrations/individual/', {
    method: 'POST',
    body: JSON.stringify(details),
  });
}

function rowToPayload(row: BulkMemberRow) {
  return {
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    gender: row.gender,
    ageRange: row.ageRange,
    country: row.country,
    raceCategory: row.raceCategory,
    townOrCity: row.townOrCity,
    clubOrInstitution: row.clubOrInstitution,
    emergencyContactName: row.emergencyContactName,
    emergencyContactPhone: row.emergencyContactPhone,
    medicalNotes: row.medicalNotes,
  };
}

/** Step 1 of checkout for a group of people at once — returns the exact
 * same shape as submitIndividualRegistration above, so the rest of the
 * payment flow (initiate/poll/confirm) works against it unchanged. */
export async function submitBulkIndividualRegistration(
  submittedBy: SubmittedBy,
  rows: BulkMemberRow[]
): Promise<SubmitRegistrationResult> {
  return apiFetch<SubmitRegistrationResult>('/registrations/individual/batch/', {
    method: 'POST',
    body: JSON.stringify({
      submittedByName: submittedBy.fullName,
      submittedByEmail: submittedBy.email,
      submittedByPhone: submittedBy.phone,
      acceptedTerms: true,
      rows: rows.map(rowToPayload),
    }),
  });
}

export interface ParsedBulkRow {
  row: number;
  values: {
    fullName: string;
    email: string;
    phone: string;
    gender: string;
    ageRange: string;
    country: string;
    raceCategory: string;
    townOrCity: string;
    clubOrInstitution: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    medicalNotes: string;
  };
  errors: Record<string, string[]> | null;
}

/** Parses an uploaded CSV/XLSX into the same row shape the bulk table
 * edits directly — a best-effort preview; everything is re-validated
 * again at actual submit time regardless. Bypasses apiFetch since a
 * multipart upload can't set Content-Type: application/json. */
export async function parseBulkIndividualUpload(file: File): Promise<{ rows: ParsedBulkRow[] }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/v1/registrations/individual/batch/parse/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = `Upload failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // response wasn't JSON — fall back to the generic message above
    }
    throw new Error(message);
  }

  return response.json();
}

/** Downloads the .xlsx template for the group-registration upload. */
export async function downloadBulkIndividualTemplate(): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/v1/registrations/individual/batch/template/`);
  if (!response.ok) throw new Error('Could not download the template.');
  return response.blob();
}
