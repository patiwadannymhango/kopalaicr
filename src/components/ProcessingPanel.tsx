import type { PendingPayment } from '../types';
import type { PaymentOutcome } from '../hooks/usePendingPayment';
import { PROVIDER_LOGO, PROVIDER_LABEL, CardLogo } from './PaymentLogos';
import Spinner from './Spinner';

/**
 * Renders the "check your phone" / "confirming card payment" / failed /
 * timeout states for a pending payment — driven entirely by
 * usePendingPayment's state, so both the individual and team registration
 * flows render identical, tested processing UI instead of each
 * hand-rolling their own.
 */
export default function ProcessingPanel({
  pending,
  elapsed,
  outcome,
  timeoutMs,
  onTryAgain,
  onKeepWaiting,
}: {
  pending: PendingPayment;
  elapsed: number;
  outcome: PaymentOutcome;
  timeoutMs: number;
  onTryAgain: () => void;
  onKeepWaiting: () => void;
}) {
  if (outcome === 'failed') {
    return (
      <div className="panel-form center">
        <div className="check-badge failed">✕</div>
        <h2>Payment not completed</h2>
        <p className="hint">
          {pending.method === 'card'
            ? "The card payment wasn't approved, or it was declined by your bank. No money has been taken — you can try again."
            : "The payment wasn't approved on your phone, or it was declined. No money has been taken — you can try again."}
        </p>
        <button className="btn-primary btn-full" onClick={onTryAgain}>
          Try again
        </button>
      </div>
    );
  }

  if (outcome === 'timeout') {
    return (
      <div className="panel-form center">
        <div className="check-badge pending">⏳</div>
        <h2>Still waiting</h2>
        <p className="hint">
          This is taking longer than expected. Once it goes through, you'll get a registration reference —
          you can look it up anytime from "Track my registration", or keep waiting here.
        </p>
        <div className="actions actions-stack">
          <button className="btn-primary btn-full" onClick={onKeepWaiting}>
            Keep waiting
          </button>
          <button className="btn-text" onClick={onTryAgain}>
            Try a different method
          </button>
        </div>
      </div>
    );
  }

  const Logo = pending.method === 'card' ? CardLogo : PROVIDER_LOGO[pending.provider];
  const seconds = Math.floor(elapsed / 1000);
  const progressPct = Math.min(100, (elapsed / timeoutMs) * 100);

  return (
    <div className="panel-form center">
      <div className="processing-icon">{Logo ? <Logo size={40} /> : <Spinner size={28} />}</div>
      <h2>{pending.method === 'card' ? 'Confirming your card payment' : 'Check your phone'}</h2>
      <p className="hint">
        {pending.method === 'card' ? (
          <>
            Your bank is confirming the card payment of{' '}
            <strong>
              {pending.currency} {(pending.amount ?? 0).toFixed(2)}
            </strong>
            . This page will update automatically once it's done — no need to refresh.
          </>
        ) : (
          <>
            We've sent a payment prompt to <strong>{pending.phoneNumber}</strong> via{' '}
            {PROVIDER_LABEL[pending.provider] || 'mobile money'}. Enter your PIN on your phone to approve the
            payment of{' '}
            <strong>
              {pending.currency} {(pending.amount ?? 0).toFixed(2)}
            </strong>
            .
          </>
        )}
      </p>

      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="hint small">
        <Spinner size={12} /> Waiting for confirmation… {seconds}s
      </p>
    </div>
  );
}
