import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { MobileMoneyProvider, PaymentInfo, RegistrationRecord, RunnerRosterEntry, TeamDetails } from '../types';
import { RELAY_CATEGORIES, RELAY_TEAM_SIZE } from '../types';
import { fetchRelayCategories, submitTeamRegistration } from '../api/teamApi';
import type { BackendCategory } from '../api/individualApi';
import { initiatePayment } from '../api/paymentApi';
import { usePendingPayment } from '../hooks/usePendingPayment';
import PaymentMethodPicker from '../components/PaymentMethodPicker';
import ProcessingPanel from '../components/ProcessingPanel';
import Spinner from '../components/Spinner';
import { downloadReceipt } from '../utils/receipt';

const initialDetails: TeamDetails = {
  teamName: '',
  companyOrInstitution: '',
  relayCategory: '',
  captainFirstName: '',
  captainLastName: '',
  captainEmail: '',
  captainPhone: '',
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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [payment, setPayment] = useState<PaymentInfo>(initialPayment);
  const [step, setStep] = useState<Step>('details');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<RegistrationRecord | null>(null);
  const [downloading, setDownloading] = useState(false);

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

  // The relay has a single per-team entry fee regardless of which
  // category (Men's/Women's/Mixed) the team races in, so the fee always
  // comes from the one 'relay' category — matching how Home and
  // Categories look it up.
  const selectedCategory = categories?.find((c) => c.code === 'relay');
  const fee = selectedCategory ? Number(selectedCategory.price) || null : null;

  function update<K extends keyof TeamDetails>(key: K, value: TeamDetails[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
  }

  function updateRunner(index: number, patch: Partial<RunnerRosterEntry>) {
    setDetails((d) => ({
      ...d,
      roster: d.roster.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    }));
  }

  function addRunner() {
    if (details.roster.length >= RELAY_TEAM_SIZE) return;
    setDetails((d) => ({ ...d, roster: [...d.roster, { fullName: '', gender: '' }] }));
  }

  function removeRunner(index: number) {
    setDetails((d) => ({ ...d, roster: d.roster.filter((_, i) => i !== index) }));
  }

  function handleDetailsContinue() {
    if (
      !details.teamName ||
      !details.companyOrInstitution ||
      !details.relayCategory ||
      !details.captainFirstName ||
      !details.captainLastName ||
      !details.captainEmail ||
      !details.captainPhone
    ) {
      setError('Please fill in the team name, company, category and captain details.');
      return;
    }
    if (password.length < 8) {
      setError('Please choose a password of at least 8 characters for your team account.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
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
      const registration = await submitTeamRegistration(details, password);

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
    setPassword('');
    setConfirmPassword('');
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
          <p className="hint">One entry fee covers the full {RELAY_TEAM_SIZE}-runner team.</p>

          <div className="grid-2">
            <Field label="Team name" required>
              <input value={details.teamName} onChange={(e) => update('teamName', e.target.value)} placeholder="e.g. Kansanshi Runners" />
            </Field>
            <Field label="Company / institution" required>
              <input value={details.companyOrInstitution} onChange={(e) => update('companyOrInstitution', e.target.value)} />
            </Field>
            <Field label="Relay category" required>
              <select value={details.relayCategory} onChange={(e) => update('relayCategory', e.target.value as TeamDetails['relayCategory'])}>
                <option value="">Select category</option>
                {RELAY_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {details.relayCategory && (
            <div className="fee-preview">
              <span>Entry fee — full team</span>
              {categories === null ? (
                <span className="fee-loading"><Spinner size={13} /> Fetching…</span>
              ) : (
                <strong>{fee ? `K${fee}` : ''}</strong>
              )}
            </div>
          )}

          <div className="grid-2">
            <Field label="Captain first name" required>
              <input value={details.captainFirstName} onChange={(e) => update('captainFirstName', e.target.value)} />
            </Field>
            <Field label="Captain last name" required>
              <input value={details.captainLastName} onChange={(e) => update('captainLastName', e.target.value)} />
            </Field>
            <Field label="Captain email" required>
              <input type="email" value={details.captainEmail} onChange={(e) => update('captainEmail', e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Captain phone" required>
              <input value={details.captainPhone} onChange={(e) => update('captainPhone', e.target.value)} placeholder="e.g. 097 000 0000" />
            </Field>
          </div>

          <p className="hint">
            Set a password to create your team's login — sign in anytime at <Link to="/login">/login</Link> with
            your captain email to manage your roster and check your account status.
          </p>
          <div className="grid-2">
            <Field label="Password" required>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm password" required>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
          </div>

          <div className="roster">
            <div className="roster-head">
              <span className="field-label">
                Runner roster <span className="optional">optional — add now or later</span>
              </span>
              <span className="roster-count">{details.roster.length} of {RELAY_TEAM_SIZE} included free</span>
            </div>
            <p className="hint">
              The first {RELAY_TEAM_SIZE} runners are covered by your entry fee. Need a bigger squad? Add extra
              runners anytime from your team dashboard after logging in — each one beyond {RELAY_TEAM_SIZE} incurs
              a small additional fee.
            </p>

            {details.roster.map((runner, i) => (
              <div className="roster-row" key={i}>
                <span className="roster-row-num">{i + 1}</span>
                <input
                  value={runner.fullName}
                  onChange={(e) => updateRunner(i, { fullName: e.target.value })}
                  placeholder="Runner full name"
                />
                <select value={runner.gender} onChange={(e) => updateRunner(i, { gender: e.target.value as RunnerRosterEntry['gender'] })}>
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <button type="button" className="roster-remove" onClick={() => removeRunner(i)} aria-label={`Remove runner ${i + 1}`}>
                  ×
                </button>
              </div>
            ))}

            {details.roster.length < RELAY_TEAM_SIZE && (
              <button type="button" className="btn-ghost btn-full" onClick={addRunner}>
                + Add runner
              </button>
            )}
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
            <span>Category</span>
            <strong>{selectedCategory?.name ?? RELAY_CATEGORIES.find((c) => c.value === details.relayCategory)?.label ?? '—'}</strong>
          </div>
          <div className="summary-row">
            <span>Entry fee — full team</span>
            <strong className="fee-highlight">{fee ? `K${fee.toFixed(2)}` : ''}</strong>
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
              ? `We've saved your team's registration. Complete the bank transfer using the details provided, and we'll confirm your entry by email once it's received at ${details.captainEmail}.`
              : `A confirmation has been sent to ${details.captainEmail}. Keep your reference safe — you'll need it to look up your entry later.`}
          </p>

          {record.reference && (
            <div className="reference-box">
              <span>Reference</span>
              <strong>{record.reference}</strong>
            </div>
          )}

          <p className="hint">
            Your team's login is ready — sign in anytime with {details.captainEmail} to manage your roster and
            add runners beyond the first {RELAY_TEAM_SIZE}.
          </p>

          <div className="actions actions-stack">
            <Link className="btn-primary btn-full" to="/dashboard">
              Go to team dashboard
            </Link>
            <button className="btn-ghost btn-full" onClick={handleDownload} disabled={downloading}>
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
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <span className="req">*</span>}
      </span>
      {children}
    </label>
  );
}
