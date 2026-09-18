import { useEffect, useRef, useState } from 'react';
import type { MobileMoneyProvider, PaymentInfo, RegistrationRecord, VendorDetails } from '../types';
import { VENDOR_REQUIREMENTS } from '../types';
import { DEFAULT_ENTRY_FEE } from '../data/event';
import { fetchVendorCategories, submitVendorRegistration } from '../api/vendorApi';
import type { BackendCategory } from '../api/individualApi';
import { initiatePayment } from '../api/paymentApi';
import { usePendingPayment } from '../hooks/usePendingPayment';
import PaymentMethodPicker from '../components/PaymentMethodPicker';
import ProcessingPanel from '../components/ProcessingPanel';
import Spinner from '../components/Spinner';
import Field from '../components/Field';
import { downloadReceipt } from '../utils/receipt';

const initialDetails: VendorDetails = {
  businessName: '',
  contactPerson: '',
  phone: '',
  email: '',
  businessLocation: '',
  productsServices: '',
  category: '',
  categoryName: '',
  requirement: '',
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

export default function VendorRegistration() {
  const [categories, setCategories] = useState<BackendCategory[] | null>(null);
  const [details, setDetails] = useState<VendorDetails>(initialDetails);
  const [payment, setPayment] = useState<PaymentInfo>(initialPayment);
  const [step, setStep] = useState<Step>('details');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<RegistrationRecord | null>(null);
  const [downloading, setDownloading] = useState(false);
  // Only matters transiently between the details and payment steps of a
  // single visit — a ref rather than state since nothing ever renders it.
  const registrationIdRef = useRef('');

  const { pending, setPending, elapsed, outcome, timeoutMs, retry, keepWaiting } = usePendingPayment(
    'kicr-vendor-pending',
    (reference) => {
      setRecord({
        reference,
        entryType: 'vendor',
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
    fetchVendorCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  // Resume the "processing" step if a card payment redirected the browser
  // away to the gateway's hosted checkout and back.
  useEffect(() => {
    if (pending) setStep('processing');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCategory = categories?.find((c) => c.code === details.category);
  const fee = details.category ? Number(selectedCategory?.price) || 0 : null;
  const isFree = details.category ? fee === 0 : false;

  function update<K extends keyof VendorDetails>(key: K, value: VendorDetails[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
  }

  function handleCategoryChange(code: string) {
    const category = categories?.find((c) => c.code === code);
    setDetails((d) => ({ ...d, category: code, categoryName: category?.name ?? '' }));
  }

  async function handleDetailsContinue() {
    setError('');
    if (
      !details.businessName ||
      !details.contactPerson ||
      !details.phone ||
      !details.email ||
      !details.category
    ) {
      setError('Please fill in business name, contact person, phone, email and category.');
      return;
    }
    if (!details.acceptedTerms) {
      setError('Please accept the event terms and indemnity to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const registration = await submitVendorRegistration(details);

      if (registration.status === 'CONFIRMED') {
        // Free category (e.g. Official Sponsor) — the backend confirms on
        // creation, nothing to pay.
        setRecord({
          reference: registration.reference,
          entryType: 'vendor',
          details,
          payment,
          status: 'confirmed',
          submittedAt: new Date().toISOString(),
          amount: registration.amount,
          currency: registration.currency,
        });
        setStep('done');
        return;
      }

      setPayment((p) => ({ ...p, phoneNumber: p.phoneNumber || details.phone }));
      registrationIdRef.current = registration.registrationId;
      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong submitting your registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
    if (!registrationIdRef.current) {
      setError('Something went wrong — please go back and re-enter your details.');
      return;
    }

    setSubmitting(true);
    try {
      if (payment.method === 'bank-transfer') {
        setRecord({
          reference: null,
          entryType: 'vendor',
          details,
          payment,
          status: 'pending-bank-transfer',
          submittedAt: new Date().toISOString(),
          amount: fee,
          currency: selectedCategory?.currency ?? 'ZMW',
        });
        setStep('done');
        return;
      }

      if (payment.method === 'card') {
        const backUrl = `${window.location.origin}${import.meta.env.BASE_URL}vendors`;
        const pay = await initiatePayment({
          registrationId: registrationIdRef.current,
          paymentMethod: 'CARD',
          city: payment.city,
          address: payment.address,
          zipCode: payment.zipCode,
          backUrl,
        });
        setPending({
          paymentId: pay.paymentId,
          registrationId: registrationIdRef.current,
          reference: null,
          email: details.email,
          amount: fee,
          currency: selectedCategory?.currency ?? 'ZMW',
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
          registrationId: registrationIdRef.current,
          paymentMethod: payment.provider as 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA',
          phoneNumber: payment.phoneNumber,
        });
        setPending({
          paymentId: pay.paymentId,
          registrationId: registrationIdRef.current,
          reference: null,
          email: details.email,
          amount: fee,
          currency: selectedCategory?.currency ?? 'ZMW',
          method: 'mobile-money',
          phoneNumber: payment.phoneNumber || '',
          provider: payment.provider as MobileMoneyProvider,
        });
        setStep('processing');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong submitting payment. Please try again.');
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
    registrationIdRef.current = '';
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
          <span className="label">Business details</span>
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
          <p className="hint">Tell us about your business, then choose a category.</p>

          <div className="grid-2">
            <Field label="Business / company name" required>
              <input value={details.businessName} onChange={(e) => update('businessName', e.target.value)} />
            </Field>
            <Field label="Contact person" required>
              <input value={details.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} placeholder="e.g. Jane Mwansa" />
            </Field>
            <Field label="Phone" required>
              <input value={details.phone} onChange={(e) => update('phone', e.target.value)} placeholder="e.g. 097 000 0000" />
            </Field>
            <Field label="Email" required>
              <input type="email" value={details.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Business location">
              <input value={details.businessLocation} onChange={(e) => update('businessLocation', e.target.value)} placeholder="e.g. Chingola" />
            </Field>
            <Field label="Category" required>
              <select value={details.category} onChange={(e) => handleCategoryChange(e.target.value)}>
                <option value="">Select category</option>
                {categories?.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} — {Number(c.price) > 0 ? `K${Number(c.price).toLocaleString()}` : 'FREE'}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Products / services">
            <textarea rows={3} value={details.productsServices} onChange={(e) => update('productsServices', e.target.value)} />
          </Field>

          <Field label="Exhibition / activation requirement">
            <select value={details.requirement} onChange={(e) => update('requirement', e.target.value as VendorDetails['requirement'])}>
              <option value="">Select requirement</option>
              {VENDOR_REQUIREMENTS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </Field>

          {details.category && (
            <div className="fee-preview">
              <span>Amount payable for {details.categoryName}</span>
              {categories === null ? (
                <span className="fee-loading"><Spinner size={13} /> Fetching…</span>
              ) : (
                <strong>{isFree ? 'FREE' : `K${fee}`}</strong>
              )}
            </div>
          )}

          <label className="checkbox-row">
            <input type="checkbox" checked={details.acceptedTerms} onChange={(e) => update('acceptedTerms', e.target.checked)} />
            I confirm the details are correct and accept the event terms and indemnity.
          </label>

          {error && <p className="error">{error}</p>}

          <button className="btn-primary btn-full" onClick={handleDetailsContinue} disabled={submitting || !categories}>
            {submitting ? (
              <span className="btn-loading">
                <Spinner size={14} /> Submitting…
              </span>
            ) : isFree ? (
              'Register — free'
            ) : (
              'Continue to payment'
            )}
          </button>
        </>
      )}

      {step === 'payment' && (
        <>
          <div className="summary-row">
            <span>Category</span>
            <strong>{details.categoryName || '—'}</strong>
          </div>
          <div className="summary-row">
            <span>Amount payable</span>
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
                `Pay by card — K${(fee ?? 0).toFixed(2)}`
              ) : payment.method === 'bank-transfer' ? (
                "Register — I'll pay by bank transfer"
              ) : (
                `Send payment prompt — K${(fee ?? 0).toFixed(2)}`
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
