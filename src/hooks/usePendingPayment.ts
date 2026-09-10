import { useEffect, useRef, useState } from 'react';
import type { PendingPayment } from '../types';
import { checkPaymentStatus } from '../api/paymentApi';

const POLL_INTERVAL_MS = 3000;
// Card confirmations (bank 3-D Secure step) tend to take longer than a
// mobile money PIN prompt, so give card a longer runway before timing out.
const TIMEOUT_MS: Record<'mobile-money' | 'card', number> = {
  'mobile-money': 90000,
  card: 150000,
};

export type PaymentOutcome = 'waiting' | 'failed' | 'timeout';

/**
 * Persists a pending mobile money / card payment to localStorage (so a
 * card payment surviving a full-page redirect to the gateway's hosted
 * checkout can resume the poll on return) and polls its status until it
 * succeeds, fails, or times out. Shared by both the individual and team
 * registration flows — the polling/timeout/resume behaviour is identical,
 * only the storage key and success callback differ.
 */
export function usePendingPayment(storageKey: string, onSuccess: (reference: string | null) => void) {
  const [pending, setPendingState] = useState<PendingPayment | null>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as PendingPayment) : null;
    } catch {
      return null;
    }
  });
  const [elapsed, setElapsed] = useState(0);
  const [outcome, setOutcome] = useState<PaymentOutcome>('waiting');
  const startRef = useRef(0);

  function setPending(next: PendingPayment | null) {
    setPendingState(next);
    setOutcome('waiting');
    setElapsed(0);
    try {
      if (next) localStorage.setItem(storageKey, JSON.stringify(next));
      else localStorage.removeItem(storageKey);
    } catch {
      // storage unavailable — the flow still works, it just won't survive
      // a full-page redirect.
    }
  }

  const timeoutMs = TIMEOUT_MS[pending?.method ?? 'mobile-money'];

  useEffect(() => {
    if (!pending || outcome !== 'waiting') return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout>;
    startRef.current = Date.now();

    const tickTimer = setInterval(() => {
      if (!cancelled) setElapsed(Date.now() - startRef.current);
    }, 1000);

    async function poll() {
      if (cancelled) return;

      try {
        const result = await checkPaymentStatus(pending!.paymentId);
        if (cancelled) return;

        if (result.status === 'SUCCESS') {
          onSuccess(result.reference);
          setPending(null);
          return;
        }
        if (result.status === 'FAILED' || result.status === 'CANCELLED') {
          setOutcome('failed');
          return;
        }
      } catch {
        // Transient network hiccup — keep polling rather than failing the
        // whole flow over one dropped request.
      }

      if (Date.now() - startRef.current >= timeoutMs) {
        setOutcome('timeout');
        return;
      }

      pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();

    return () => {
      cancelled = true;
      clearInterval(tickTimer);
      clearTimeout(pollTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, outcome, timeoutMs]);

  function retry() {
    setPending(null);
  }

  function keepWaiting() {
    setElapsed(0);
    setOutcome('waiting');
  }

  return { pending, setPending, elapsed, outcome, timeoutMs, retry, keepWaiting };
}
