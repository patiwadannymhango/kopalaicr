import { useEffect, useState } from 'react';
import type { MobileMoneyProvider, PaymentInfo, RegistrationRecord, TeamDetails } from '../types';
import { DEFAULT_ENTRY_FEE } from '../data/event';
import { fetchRelayCategories, submitTeamRegistration } from '../api/teamApi';
import type { BackendCategory } from '../api/individualApi';
import { initiatePayment } from '../api/paymentApi';
import { usePendingPayment } from '../hooks/usePendingPayment';
import PaymentMethodPicker from '../components/PaymentMethodPicker';
import ProcessingPanel from '../components/ProcessingPanel';
import Spinner from '../components/Spinner';
import Field from '../components/Field';
import { downloadReceipt } from '../utils/receipt';
import TeamRosterModal from './TeamRosterModal';

const initialDetails: TeamDetails = {
  teamName: '',
  companyOrInstitution: '',
  captainFirstName: '',
  captainLastName: '',
  captainEmail: '',
  captainPhone: '',
  participantCount: '',
  roster: [],
  acceptedTerms: false,
};

const initialPayment: PaymentInfo = {
  method: 'mobile-money',
  provider: '',
  phoneNumber: '',
  city: '',
  address: '',
  zipCode: '',
};

type Step = 'details' | 'payment' | 'processing' | 'done';

export default function TeamRegistration() {
  const [categories, setCategories] = useState<BackendCategory[] | null>(null);
  const [details, setDetails] = useState<TeamDetails>(initialDetails);
  const [payment, setPayment] = useState<PaymentInfo>(initialPayment);
  const [step, setStep] = useState<Step>('details');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<RegistrationRecord | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [rosterModalOpen, setRosterModalOpen] = useState(false);

  const { pending, setPending, elapsed, outcome, timeoutMs, retry, keepWaiting } = usePendingPayment(
    'kicr-team-pending',
    (reference) => {
      setRecord({
        reference,
        entryType: 'team',
        details,
        payment,
        status: 'confirmed',
        submittedAt: new Date().toISOString(),
        amount: pending?.amount ?? null,
        currency: pending?.currency ?? 'ZMW',
      });
      setStep('done');
    }
  );

  useEffect(() => {
    fetchRelayCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (pending) setStep('processing');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const participantCountNum = Number(details.participantCount);
  const hasValidParticipantCount = Number.isInteger(participantCountNum) && participantCountNum >= 1;

  // No single group-wide category anymore — every participant picks their
  // own race in the roster table, and the group's fee is the sum of each
  // of their own category prices (same model as Individual's "register
  // multiple people" flow).
  const rosterComplete =
    details.roster.length === participantCountNum &&
    details.roster.every((r) => r.fullName.trim() && r.raceCategory);
  const fee = rosterComplete
    ? details.roster.reduce((sum, r) => {
        const category = categories?.find((c) => c.code === r.raceCategory);
        return sum + (Number(category?.price) || 0);
      }, 0)
    : null;

  function update<K extends keyof TeamDetails>(key: K, value: TeamDetails[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
  }

  function handleDetailsContinue() {
    if (!details.teamName || !details.companyOrInstitution || !hasValidParticipantCount) {
      setError('Please fill in the organization and number of participants.');
      return;
    }
    if (!rosterComplete) {
      setError('Please add the participant list — every person needs a full name and race category.');
      return;
    }
    if (!details.acceptedTerms) {
      setError('Please accept the event terms and indemnity to continue.');
      return;
    }
    setError('');
    setPayment((p) => ({ ...p, phoneNumber: p.phoneNumber || details.captainPhone }));
    setStep('payment');
  }

  async function handlePaySubmit() {
    setError('');
    if (payment.method === 'mobile-money' && !payment.provider) {
      setError('Please choose MTN, Airtel or Zamtel to receive the payment prompt.');
      return;
    }
    if (payment.method === 'mobile-money' && !(payment.phoneNumber || '').trim()) {
      setError('Please enter the phone number that will receive the payment prompt.');
      return;
    }
    if (
      payment.method === 'card' &&
      (!(payment.city || '').trim() || !(payment.address || '').trim() || !(payment.zipCode || '').trim())
    ) {
      setError('Please fill in your billing city, address and postal code.');
      return;
    }

    setSubmitting(true);
    try {
      const registration = await submitTeamRegistration(details);

      if (payment.method === 'bank-transfer') {
        setRecord({
          reference: registration.reference,
          entryType: 'team',
          details,
          payment,
          status: 'pending-bank-transfer',
          submittedAt: new Date().toISOString(),
          amount: registration.amount,
          currency: registration.currency,
        });
        setStep('done');
        return;
      }

      if (payment.method === 'card') {
        const backUrl = `${window.location.origin}${import.meta.env.BASE_URL}register`;
        const pay = await initiatePayment({
          registrationId: registration.registrationId,
          paymentMethod: 'CARD',
          city: payment.city,
          address: payment.address,
          zipCode: payment.zipCode,
          backUrl,
        });
        setPending({
          paymentId: pay.paymentId,
          registrationId: registration.registrationId,
          reference: registration.reference,
          email: details.captainEmail,
          amount: registration.amount,
          currency: registration.currency,
          method: 'card',
          phoneNumber: '',
          provider: '',
        });
        setStep('processing');
        if (pay.redirectUrl) {
          window.location.href = pay.redirectUrl;
          return;
        }
      } else {
        const pay = await initiatePayment({
          registrationId: registration.registrationId,
          paymentMethod: payment.provider as 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA',
          phoneNumber: payment.phoneNumber,
        });
        setPending({
          paymentId: pay.paymentId,
          registrationId: registration.registrationId,
          reference: registration.reference,
          email: details.captainEmail,
          amount: registration.amount,
          currency: registration.currency,
          method: 'mobile-money',
          phoneNumber: payment.phoneNumber || '',
          provider: payment.provider as MobileMoneyProvider,
        });
        setStep('processing');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong submitting your registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleTryAgain() {
    retry();
    setStep('payment');
  }

  function handleStartOver() {
    setDetails(initialDetails);
    setPayment(initialPayment);
    setStep('details');
    setRecord(null);
  }

  async function handleDownload() {
    if (!record) return;
    setDownloading(true);
    try {
      await downloadReceipt(record);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="panel-form">
      <ol className="progress-steps">
        <li className={step === 'details' ? 'active' : 'complete'}>
          <span className="dot">{step === 'details' ? '1' : '✓'}</span>
          <span className="label">Team details</span>
        </li>
        <li className={step === 'payment' || step === 'processing' ? 'active' : step === 'done' ? 'complete' : ''}>
          <span className="dot">{step === 'done' ? '✓' : '2'}</span>
          <span className="label">Payment</span>
        </li>
        <li className={step === 'done' ? 'active' : ''}>
          <span className="dot">3</span>
          <span className="label">Done</span>
        </li>
      </ol>

      {step === 'details' && (
        <>
          <div className="grid-2">
            <Field label="Organization | Club" required>
              <input
                value={details.teamName}
                onChange={(e) =>
                  setDetails((d) => ({ ...d, teamName: e.target.value, companyOrInstitution: e.target.value }))
                }
                placeholder="e.g. Kansanshi Runners"
              />
            </Field>
            <Field label="Number of participants" required>
              <input
                type="number"
                min={1}
                value={details.participantCount}
                onChange={(e) => update('participantCount', e.target.value)}
                placeholder="e.g. 8"
              />
            </Field>
          </div>

          <button
            type="button"
            className="btn-ghost"
            disabled={!hasValidParticipantCount}
            title={hasValidParticipantCount ? undefined : 'Enter the number of participants first'}
            onClick={() => setRosterModalOpen(true)}
          >
            {details.roster.length > 0 ? `Edit participant list (${details.roster.length})` : 'Add participant list'}
          </button>

          {rosterComplete && (
            <div className="fee-preview">
              <span>Entry fee for {details.roster.length} {details.roster.length === 1 ? 'person' : 'people'}</span>
              {categories === null ? (
                <span className="fee-loading"><Spinner size={13} /> Fetching…</span>
              ) : (
                <strong>{`K${fee}`}</strong>
              )}
            </div>
          )}

          <div className="grid-2">
            <Field label="Team Lead first name">
              <input value={details.captainFirstName} onChange={(e) => update('captainFirstName', e.target.value)} />
            </Field>
            <Field label="Team Lead last name">
              <input value={details.captainLastName} onChange={(e) => update('captainLastName', e.target.value)} />
            </Field>
            <Field label="Team Lead email">
              <input type="email" value={details.captainEmail} onChange={(e) => update('captainEmail', e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Team Lead phone">
              <input value={details.captainPhone} onChange={(e) => update('captainPhone', e.target.value)} placeholder="e.g. 097 000 0000" />
            </Field>
          </div>

          <label className="checkbox-row">
            <input type="checkbox" checked={details.acceptedTerms} onChange={(e) => update('acceptedTerms', e.target.checked)} />
            I confirm the team details are correct and accept the event terms and indemnity on behalf of the team.
          </label>

          {error && <p className="error">{error}</p>}

          <button className="btn-primary btn-full" onClick={handleDetailsContinue}>
            {fee ? `Continue to payment — K${fee.toFixed(2)}` : 'Continue to payment'}
          </button>
        </>
      )}

      {step === 'payment' && (
        <>
          <div className="summary-row">
            <span>Participants</span>
            <strong>{details.roster.length}</strong>
          </div>
          <div className="summary-row">
            <span>Entry fee</span>
            <strong className="fee-highlight">{`K${(fee ?? DEFAULT_ENTRY_FEE).toFixed(2)}`}</strong>
          </div>

          <PaymentMethodPicker payment={payment} onChange={(patch) => setPayment((p) => ({ ...p, ...patch }))} />

          {error && <p className="error">{error}</p>}

          <div className="actions actions-stack">
            <button className="btn-primary" onClick={handlePaySubmit} disabled={submitting}>
              {submitting ? (
                <span className="btn-loading">
                  <Spinner size={14} />{' '}
                  {payment.method === 'card' ? 'Redirecting to checkout…' : payment.method === 'bank-transfer' ? 'Saving…' : 'Sending prompt…'}
                </span>
              ) : payment.method === 'card' ? (
                fee ? `Pay by card — K${fee.toFixed(2)}` : 'Continue to card checkout'
              ) : payment.method === 'bank-transfer' ? (
                'Register — we\'ll pay by bank transfer'
              ) : fee ? (
                `Send payment prompt — K${fee.toFixed(2)}`
              ) : (
                'Confirm registration'
              )}
            </button>
            <button className="btn-text" onClick={() => setStep('details')} disabled={submitting}>
              Back to team details
            </button>
          </div>
        </>
      )}

      {step === 'processing' && pending && (
        <ProcessingPanel
          pending={pending}
          elapsed={elapsed}
          outcome={outcome}
          timeoutMs={timeoutMs}
          onTryAgain={handleTryAgain}
          onKeepWaiting={keepWaiting}
        />
      )}

      {step === 'done' && record && (
        <div className="panel-form center">
          <div className="check-badge">{record.status === 'pending-bank-transfer' ? '⏳' : '✓'}</div>
          <h2>{record.status === 'pending-bank-transfer' ? 'Registration submitted' : 'Registration confirmed'}</h2>
          <p className="hint">
            {record.status === 'pending-bank-transfer'
              ? details.captainEmail
                ? `We've saved your team's registration. Complete the bank transfer using the details provided, and we'll confirm your entry by email once it's received at ${details.captainEmail}.`
                : "We've saved your team's registration. Complete the bank transfer using the details provided, and we'll confirm your entry once it's received."
              : details.captainEmail
                ? `A confirmation has been sent to ${details.captainEmail}. Keep your reference safe — you'll need it to look up your entry later.`
                : "Keep your reference safe — you'll need it to look up your entry later."}
          </p>

          {record.reference && (
            <div className="reference-box">
              <span>Reference</span>
              <strong>{record.reference}</strong>
            </div>
          )}

          <div className="actions actions-stack">
            <button className="btn-primary btn-full" onClick={handleDownload} disabled={downloading}>
              {downloading ? (
                <span className="btn-loading">
                  <Spinner size={14} /> Preparing receipt…
                </span>
              ) : (
                'Download receipt'
              )}
            </button>
            <button className="btn-text" onClick={handleStartOver}>
              Register another team
            </button>
          </div>
        </div>
      )}

      <TeamRosterModal
        open={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        participantCount={hasValidParticipantCount ? participantCountNum : 0}
        roster={details.roster}
        categories={categories}
        onSave={(roster) => setDetails((d) => ({ ...d, roster }))}
      />
    </div>
  );
}
