/**
 * Payment initiation and status endpoints — shared by every entry type
 * (individual and team registrations both settle through the same
 * mobile money / card gateway on the backend), so this lives once here
 * instead of being duplicated per flow.
 */
import { apiFetch } from './http';

export interface InitiatePaymentParams {
  registrationId: string;
  paymentMethod: 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA' | 'CARD';
  phoneNumber?: string;
  city?: string;
  address?: string;
  zipCode?: string;
  backUrl?: string;
}

export interface InitiatePaymentResult {
  paymentId: string;
  status: string;
  /** Card only — where the payment gateway's hosted checkout sends the
   * browser. Empty when a local/console gateway is active. */
  redirectUrl: string;
}

export async function initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
  return apiFetch<InitiatePaymentResult>('/payments/initiate/', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export interface PaymentStatusResult {
  status: string;
  registrationStatus: string;
  /** Set only once the registration reaches CONFIRMED — this is where the
   * frontend picks up the reference, since it doesn't exist yet at
   * registration-creation time. */
  reference: string | null;
}

/** Polled by the "check your phone" / "confirming card payment" screen. */
export async function checkPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
  return apiFetch<PaymentStatusResult>(`/payments/${paymentId}/status/`);
}
