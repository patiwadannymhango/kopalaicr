import type { PaymentInfo } from '../types';
import { EVENT, BANK_DETAILS } from '../data/event';
import { MtnLogo, AirtelLogo, ZamtelLogo, VisaLogo, MastercardLogo, AmexLogo, BankLogo } from './PaymentLogos';

const PROVIDERS = [
  { value: 'MTN_MONEY' as const, label: 'MTN', Logo: MtnLogo },
  { value: 'AIRTEL_MONEY' as const, label: 'Airtel', Logo: AirtelLogo },
  { value: 'ZAMTEL_KWACHA' as const, label: 'Zamtel', Logo: ZamtelLogo },
];

const bankDetailsReady = Object.values(BANK_DETAILS).every((v) => v.trim());

/**
 * The payment-method fields shared by every checkout flow (individual and
 * team registration both use it) — mobile money, card, or bank transfer.
 * Takes the current PaymentInfo and reports patches back, so the caller
 * owns the actual state and submit logic.
 */
export default function PaymentMethodPicker({
  payment,
  onChange,
}: {
  payment: PaymentInfo;
  onChange: (patch: Partial<PaymentInfo>) => void;
}) {
  return (
    <>
      <div className="field">
        <span className="field-label">Payment method</span>
        <div className="segmented segmented-3">
          <button
            type="button"
            className={payment.method === 'mobile-money' ? 'active' : ''}
            onClick={() => onChange({ method: 'mobile-money' })}
          >
            Mobile money
          </button>
          <button
            type="button"
            className={payment.method === 'card' ? 'active' : ''}
            onClick={() => onChange({ method: 'card' })}
          >
            Card
          </button>
          <button
            type="button"
            className={payment.method === 'bank-transfer' ? 'active' : ''}
            onClick={() => onChange({ method: 'bank-transfer' })}
          >
            Bank transfer
          </button>
        </div>
      </div>

      {payment.method === 'mobile-money' && (
        <>
          <div className="field">
            <span className="field-label">Network</span>
            <div className="provider-row">
              {PROVIDERS.map(({ value, label, Logo }) => (
                <button
                  key={value}
                  type="button"
                  className={`provider-tile${payment.provider === value ? ' active' : ''}`}
                  onClick={() => onChange({ provider: value })}
                >
                  <Logo size={26} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="payment-phone">
              Mobile money number<span className="req">*</span>
            </label>
            <input
              id="payment-phone"
              type="tel"
              placeholder="e.g. 0977 123 456"
              value={payment.phoneNumber || ''}
              onChange={(e) => onChange({ phoneNumber: e.target.value })}
            />
            <span className="field-hint">A prompt to approve the payment will be sent to this number.</span>
          </div>
        </>
      )}

      {payment.method === 'card' && (
        <>
          <div className="bank-details-header">
            <div className="card-brand-row">
              <VisaLogo size={30} />
              <MastercardLogo size={30} />
              <AmexLogo size={30} />
            </div>
          </div>
          <p className="hint">
            You'll be taken to a secure checkout page to enter your card details — we never see or store your
            card number.
          </p>

          <div className="field">
            <label className="field-label" htmlFor="card-city">
              City<span className="req">*</span>
            </label>
            <input
              id="card-city"
              type="text"
              placeholder="e.g. Chingola"
              value={payment.city || ''}
              onChange={(e) => onChange({ city: e.target.value })}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="card-address">
              Billing address<span className="req">*</span>
            </label>
            <input
              id="card-address"
              type="text"
              placeholder="Street address"
              value={payment.address || ''}
              onChange={(e) => onChange({ address: e.target.value })}
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="card-zip">
              Postal code<span className="req">*</span>
            </label>
            <input
              id="card-zip"
              type="text"
              placeholder="Postal / zip code"
              value={payment.zipCode || ''}
              onChange={(e) => onChange({ zipCode: e.target.value })}
            />
          </div>
        </>
      )}

      {payment.method === 'bank-transfer' && (
        <>
          <div className="bank-details-header">
            <BankLogo size={26} />
            <span>Bank transfer</span>
          </div>
          {bankDetailsReady ? (
            <div className="summary-row-block">
              <div className="summary-row"><span>Bank</span><strong>{BANK_DETAILS.bankName}</strong></div>
              <div className="summary-row"><span>Account name</span><strong>{BANK_DETAILS.accountName}</strong></div>
              <div className="summary-row"><span>Account number</span><strong>{BANK_DETAILS.accountNumber}</strong></div>
              <div className="summary-row"><span>Branch</span><strong>{BANK_DETAILS.branch}</strong></div>
            </div>
          ) : (
            <p className="hint coming-soon">Bank account details coming soon — check back closer to race day.</p>
          )}
          <p className="hint">
            After completing the transfer, send your proof of payment to us on WhatsApp
            {EVENT.phone ? (
              <>
                {' '}
                at <strong>{EVENT.phone}</strong>
              </>
            ) : null}
            . We'll confirm your entry by email once it's received — your reference will show as{' '}
            <em>awaiting bank transfer</em> until then.
          </p>
        </>
      )}
    </>
  );
}
