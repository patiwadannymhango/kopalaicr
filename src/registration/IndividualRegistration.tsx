import { useEffect, useState } from 'react';
import type { IndividualDetails, MobileMoneyProvider, PaymentInfo, RegistrationRecord } from '../types';
import { RACE_CATEGORIES, INDIVIDUAL_DIVISIONS } from '../types';
import { DEFAULT_ENTRY_FEE } from '../data/event';
import { fetchIndividualCategories, submitIndividualRegistration } from '../api/individualApi';
import type { BackendCategory } from '../api/individualApi';
import { initiatePayment } from '../api/paymentApi';
import { usePendingPayment } from '../hooks/usePendingPayment';
import PaymentMethodPicker from '../components/PaymentMethodPicker';
import ProcessingPanel from '../components/ProcessingPanel';
import Spinner from '../components/Spinner';
import Field from '../components/Field';
import { downloadReceipt } from '../utils/receipt';
import type { RaceCategory } from '../types';

/** Races with divisions (Men's Open, Women's Open, Corporate, Masters) —
 * the 100m CEO/Directors races and Kids Athletics have none. */
const DIVISION_RACE_CATEGORIES: RaceCategory[] = ['5km-individual', '10km-individual', '21km-individual'];

const initialDetails: IndividualDetails = {
  fullName: '',
  email: '',
  phone: '',
  gender: '',
  ageRange: '',
  country: 'Zambia',
  tShirtSize: '',
  raceCategory: '',
  division: '',
  townOrCity: '',
  clubOrInstitution: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  medicalNotes: '',
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

export default function IndividualRegistration() {
  const [categories, setCategories] = useState<BackendCategory[] | null>(null);
  const [details, setDetails] = useState<IndividualDetails>(initialDetails);
  const [payment, setPayment] = useState<PaymentInfo>(initialPayment);
  const [step, setStep] = useState<Step>('details');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<RegistrationRecord | null>(null);
  const [downloading, setDownloading] = useState(false);

  const { pending, setPending, elapsed, outcome, timeoutMs, retry, keepWaiting } = usePendingPayment(
    'kicr-individual-pending',
    (reference) => {
      setRecord({
        reference,
        entryType: 'individual',
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
    fetchIndividualCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Resume the "processing" step if a card payment redirected the browser
  // away to the gateway's hosted checkout and back.
  useEffect(() => {
    if (pending) setStep('processing');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCategory = categories?.find((c) => c.code === details.raceCategory);
  const selectedCategoryLabel = selectedCategory?.name ?? RACE_CATEGORIES.find((c) => c.value === details.raceCategory)?.label ?? '';
  const fee = details.raceCategory ? Number(selectedCategory?.price) || DEFAULT_ENTRY_FEE : null;

  function update<K extends keyof IndividualDetails>(key: K, value: IndividualDetails[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
  }

  function handleDetailsContinue() {
    if (!details.fullName || !details.email || !details.phone || !details.raceCategory) {
      setError('Please fill in name, email, phone and race category.');
      return;
    }
    if (DIVISION_RACE_CATEGORIES.includes(details.raceCategory) && !details.division) {
      setError('Please choose a division for your race.');
      return;
    }
    if (!details.emergencyContactPhone) {
      setError('Emergency contact phone is required.');
      return;
    }
    if (!details.acceptedTerms) {
      setError('Please accept the event terms and indemnity to continue.');
      return;
    }
    setError('');
    setPayment((p) => ({ ...p, phoneNumber: p.phoneNumber || details.phone }));
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
      const registration = await submitIndividualRegistration(details);

      if (payment.method === 'bank-transfer') {
        setRecord({
          reference: registration.reference,
          entryType: 'individual',
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
          email: details.email,
          amount: registration.amount,
          currency: registration.currency,
          method: 'card',
          phoneNumber: '',
          provider: '',
        });
        setStep('processing');
        if (pay.redirectUrl) {
          // Leaving the SPA entirely for the payment gateway's hosted,
          // PCI-compliant checkout page — registration state (incl. the
          // pending payment) is already persisted to localStorage by the
          // time this navigation happens, so the app resumes on return.
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
          email: details.email,
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
          <span className="label">Details</span>
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
          <p className="hint">Tell us who's running — your details, then payment.</p>

          <div className="grid-2">
            <Field label="Full name" required>
              <input value={details.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="e.g. Thandiwe Banda" />
            </Field>
            <Field label="Email" required>
              <input type="email" value={details.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Phone" required>
              <input value={details.phone} onChange={(e) => update('phone', e.target.value)} placeholder="e.g. 097 000 0000" />
            </Field>
            <Field label="Town / City">
              <input value={details.townOrCity} onChange={(e) => update('townOrCity', e.target.value)} placeholder="e.g. Chingola" />
            </Field>
            <Field label="Gender">
              <select value={details.gender} onChange={(e) => update('gender', e.target.value as IndividualDetails['gender'])}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Age range">
              <select value={details.ageRange} onChange={(e) => update('ageRange', e.target.value as IndividualDetails['ageRange'])}>
                <option value="">Select</option>
                <option value="Under 18">Under 18</option>
                <option value="18-29">18–29</option>
                <option value="30-39">30–39</option>
                <option value="40-49">40–49</option>
                <option value="50-59">50–59</option>
                <option value="60+">60+</option>
              </select>
            </Field>
            <Field label="T-shirt size">
              <select value={details.tShirtSize} onChange={(e) => update('tShirtSize', e.target.value as IndividualDetails['tShirtSize'])}>
                <option value="">Select</option>
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'].map((sz) => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </Field>
            <Field label="Race" required>
              <select
                value={details.raceCategory}
                onChange={(e) => update('raceCategory', e.target.value as IndividualDetails['raceCategory'])}
              >
                <option value="">Select your race</option>
                {RACE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label} — {c.distance}</option>
                ))}
              </select>
            </Field>
            {DIVISION_RACE_CATEGORIES.includes(details.raceCategory) && (
              <Field label="Division" required>
                <select value={details.division} onChange={(e) => update('division', e.target.value as IndividualDetails['division'])}>
                  <option value="">Select division</option>
                  {INDIVIDUAL_DIVISIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {details.raceCategory && (
            <div className="fee-preview">
              <span>Entry fee for {selectedCategoryLabel}</span>
              {categories === null ? (
                <span className="fee-loading"><Spinner size={13} /> Fetching…</span>
              ) : (
                <strong>{`K${fee}`}</strong>
              )}
            </div>
          )}

          <div className="grid-2">
            <Field label="Club / institution (optional)">
              <input value={details.clubOrInstitution} onChange={(e) => update('clubOrInstitution', e.target.value)} />
            </Field>
            <Field label="Emergency contact name (optional)">
              <input value={details.emergencyContactName} onChange={(e) => update('emergencyContactName', e.target.value)} />
            </Field>
            <Field label="Emergency contact phone" required>
              <input value={details.emergencyContactPhone} onChange={(e) => update('emergencyContactPhone', e.target.value)} />
            </Field>
          </div>

          <Field label="Medical notes (optional)">
            <textarea rows={3} value={details.medicalNotes} onChange={(e) => update('medicalNotes', e.target.value)} />
          </Field>

          <label className="checkbox-row">
            <input type="checkbox" checked={details.acceptedTerms} onChange={(e) => update('acceptedTerms', e.target.checked)} />
            I confirm the details are correct and accept the event terms and indemnity.
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
            <span>Race</span>
            <strong>{selectedCategoryLabel || '—'}</strong>
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
                'Register — I\'ll pay by bank transfer'
              ) : fee ? (
                `Send payment prompt — K${fee.toFixed(2)}`
              ) : (
                'Confirm registration'
              )}
            </button>
            <button className="btn-text" onClick={() => setStep('details')} disabled={submitting}>
              Back to details
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
              ? `We've saved your registration. Complete the bank transfer using the details provided, and we'll confirm your entry by email once it's received at ${details.email}.`
              : `A confirmation has been sent to ${details.email}. Keep your reference safe — you'll need it to look up your entry later.`}
          </p>

          {record.reference && (
            <div className="reference-box">
              <span>Reference</span>
              <strong>{record.reference}</strong>
            </div>
          )}

          <div className="actions actions-stack">
            <button className="btn-ghost btn-full" onClick={handleDownload} disabled={downloading}>
              {downloading ? (
                <span className="btn-loading">
                  <Spinner size={14} /> Preparing receipt…
                </span>
              ) : (
                'Download receipt'
              )}
            </button>
            <button className="btn-primary btn-full" onClick={handleStartOver}>
              Register another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
