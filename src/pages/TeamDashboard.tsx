import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RELAY_CATEGORIES } from '../types';
import type { Gender, MobileMoneyProvider, PaymentInfo, RunnerRosterEntry } from '../types';
import { addRunnerToRoster, fetchExtraRunnerFee } from '../api/teamAccountApi';
import { initiatePayment } from '../api/paymentApi';
import { usePendingPayment } from '../hooks/usePendingPayment';
import PaymentMethodPicker from '../components/PaymentMethodPicker';
import ProcessingPanel from '../components/ProcessingPanel';
import Spinner from '../components/Spinner';

const GENDER_LABEL: Record<string, string> = { male: 'Male', female: 'Female' };

type AddStep = 'closed' | 'form' | 'payment' | 'processing';

const initialPayment: PaymentInfo = {
  method: 'mobile-money',
  provider: '',
  phoneNumber: '',
  city: '',
  address: '',
  zipCode: '',
};

const emptyRunner: RunnerRosterEntry = { fullName: '', gender: '' };

export default function TeamDashboard() {
  const { team, logout, refreshTeam } = useAuth();
  const navigate = useNavigate();

  const [addStep, setAddStep] = useState<AddStep>('closed');
  const [newRunner, setNewRunner] = useState<RunnerRosterEntry>(emptyRunner);
  const [payment, setPayment] = useState<PaymentInfo>(initialPayment);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [extraFee, setExtraFee] = useState<number | null | undefined>(undefined);
  const [pendingRunnerId, setPendingRunnerId] = useState('');

  const { pending, setPending, elapsed, outcome, timeoutMs, retry, keepWaiting } = usePendingPayment(
    'kicr-dashboard-runner-pending',
    () => {
      refreshTeam();
      setAddStep('closed');
      setNewRunner(emptyRunner);
    }
  );

  useEffect(() => {
    if (pending) setAddStep('processing');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!team) return null;

  const isOverAllowance = team.roster.length >= team.freeRunnerLimit;
  const accountUnpaid = team.accountStatus !== 'paid';

  function openAddForm() {
    setError('');
    setNewRunner(emptyRunner);
    setAddStep('form');
    if (isOverAllowance && extraFee === undefined) {
      fetchExtraRunnerFee()
        .then(setExtraFee)
        .catch(() => setExtraFee(null));
    }
  }

  function closeAdd() {
    setAddStep('closed');
    setError('');
    setNewRunner(emptyRunner);
  }

  async function handleAddSubmit() {
    if (!newRunner.fullName.trim()) {
      setError("Please enter the runner's full name.");
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await addRunnerToRoster(newRunner);
      if (result.confirmed) {
        await refreshTeam();
        closeAdd();
      } else if (result.paymentRequired) {
        setPendingRunnerId(result.runnerId);
        if (result.amount != null) setExtraFee(result.amount);
        setAddStep('payment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add this runner. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaySubmit() {
    if (!team) return;
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
      if (payment.method === 'bank-transfer') {
        // The runner already exists on the roster with paid:false —
        // nothing to submit to a gateway here. The captain sends proof of
        // payment over WhatsApp and the backend confirms it manually,
        // same as the base team entry fee — refreshing just picks up the
        // "Payment pending" badge already reflected on the roster.
        await refreshTeam();
        closeAdd();
        return;
      }

      if (payment.method === 'card') {
        const backUrl = `${window.location.origin}${import.meta.env.BASE_URL}dashboard`;
        const pay = await initiatePayment({
          registrationId: pendingRunnerId,
          paymentMethod: 'CARD',
          city: payment.city,
          address: payment.address,
          zipCode: payment.zipCode,
          backUrl,
        });
        setPending({
          paymentId: pay.paymentId,
          registrationId: pendingRunnerId,
          reference: null,
          email: team.captainEmail,
          amount: extraFee ?? null,
          currency: 'ZMW',
          method: 'card',
          phoneNumber: '',
          provider: '',
        });
        setAddStep('processing');
        if (pay.redirectUrl) {
          window.location.href = pay.redirectUrl;
          return;
        }
      } else {
        const pay = await initiatePayment({
          registrationId: pendingRunnerId,
          paymentMethod: payment.provider as 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ZAMTEL_KWACHA',
          phoneNumber: payment.phoneNumber,
        });
        setPending({
          paymentId: pay.paymentId,
          registrationId: pendingRunnerId,
          reference: null,
          email: team.captainEmail,
          amount: extraFee ?? null,
          currency: 'ZMW',
          method: 'mobile-money',
          phoneNumber: payment.phoneNumber || '',
          provider: payment.provider as MobileMoneyProvider,
        });
        setAddStep('processing');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong submitting payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleTryAgain() {
    retry();
    setAddStep('payment');
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <main>
      <section className="page-hero">
        <div className="eyebrow">Team dashboard</div>
        <h1>{team.teamName}</h1>
        <p className="lede">{team.companyOrInstitution}</p>
      </section>

      <section className="section">
        <div className="section-inner narrow">
          <div className="card">
            <div className="summary-row">
              <span>Category</span>
              <strong>{RELAY_CATEGORIES.find((c) => c.value === team.relayCategory)?.label ?? '—'}</strong>
            </div>
            <div className="summary-row">
              <span>Reference</span>
              <strong>{team.reference ?? '—'}</strong>
            </div>
            <div className="summary-row">
              <span>Account status</span>
              <strong>
                <span className={team.accountStatus === 'paid' ? 'status-pill confirmed' : 'status-pill reserved'}>
                  {team.accountStatus === 'paid' ? 'Paid account' : 'Not paid'}
                </span>
              </strong>
            </div>
            {accountUnpaid && (
              <p className="hint coming-soon">
                Your team's entry fee hasn't been confirmed yet, so new runners can't be added until it is.
                Bank transfers are confirmed by email once received; mobile money and card payments confirm
                automatically.
              </p>
            )}
            <button type="button" className="btn-text" onClick={handleLogout}>
              Log out
            </button>
          </div>

          <div className="card">
            <div className="roster-head">
              <h2>Roster</h2>
              <span className="roster-count">
                {team.roster.length} added · first {team.freeRunnerLimit} included in your entry fee
              </span>
            </div>

            {team.roster.length === 0 ? (
              <p className="hint">No runners on the roster yet — add your first one below.</p>
            ) : (
              <div className="roster-table">
                <div className="roster-table-row roster-table-head">
                  <span>#</span>
                  <span>Name</span>
                  <span>Gender</span>
                  <span>Status</span>
                </div>
                {team.roster.map((runner, i) => (
                  <div className="roster-table-row" key={runner.id}>
                    <span>{i + 1}</span>
                    <span>{runner.fullName}</span>
                    <span>{GENDER_LABEL[runner.gender] ?? '—'}</span>
                    <span>
                      {runner.covered ? (
                        <span className="status-pill confirmed">Included</span>
                      ) : runner.paid ? (
                        <span className="status-pill confirmed">Paid</span>
                      ) : (
                        <span className="status-pill reserved">Payment pending</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {addStep === 'closed' && (
              <button
                type="button"
                className="btn-ghost btn-full"
                onClick={openAddForm}
                disabled={accountUnpaid}
                title={accountUnpaid ? 'Pay your team entry fee to add runners' : undefined}
              >
                + Add runner{isOverAllowance ? ' — extra fee applies' : ''}
              </button>
            )}

            {addStep === 'form' && (
              <div className="panel-form">
                {isOverAllowance && (
                  <div className="fee-preview">
                    <span>This runner is beyond your free allowance</span>
                    {extraFee === undefined ? (
                      <span className="fee-loading">
                        <Spinner size={13} /> Fetching…
                      </span>
                    ) : (
                      <strong>{extraFee ? `K${extraFee}` : ''}</strong>
                    )}
                  </div>
                )}
                <div className="grid-2">
                  <label className="field">
                    <span className="field-label">
                      Full name<span className="req">*</span>
                    </span>
                    <input
                      value={newRunner.fullName}
                      onChange={(e) => setNewRunner((r) => ({ ...r, fullName: e.target.value }))}
                      placeholder="Runner full name"
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">Gender</span>
                    <select
                      value={newRunner.gender}
                      onChange={(e) => setNewRunner((r) => ({ ...r, gender: e.target.value as Gender }))}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </label>
                </div>

                {error && <p className="error">{error}</p>}

                <div className="actions actions-stack">
                  <button className="btn-primary" onClick={handleAddSubmit} disabled={submitting}>
                    {submitting ? (
                      <span className="btn-loading">
                        <Spinner size={14} /> Adding…
                      </span>
                    ) : isOverAllowance ? (
                      'Continue to payment'
                    ) : (
                      'Add runner — included'
                    )}
                  </button>
                  <button className="btn-text" onClick={closeAdd} disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {addStep === 'payment' && (
              <div className="panel-form">
                <div className="summary-row">
                  <span>Runner</span>
                  <strong>{newRunner.fullName}</strong>
                </div>
                <div className="summary-row">
                  <span>Extra-runner fee</span>
                  <strong className="fee-highlight">{extraFee ? `K${extraFee.toFixed(2)}` : ''}</strong>
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
                      extraFee ? `Pay by card — K${extraFee.toFixed(2)}` : 'Continue to card checkout'
                    ) : payment.method === 'bank-transfer' ? (
                      "I'll pay by bank transfer"
                    ) : extraFee ? (
                      `Send payment prompt — K${extraFee.toFixed(2)}`
                    ) : (
                      'Confirm'
                    )}
                  </button>
                  <button className="btn-text" onClick={closeAdd} disabled={submitting}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {addStep === 'processing' && pending && (
              <ProcessingPanel
                pending={pending}
                elapsed={elapsed}
                outcome={outcome}
                timeoutMs={timeoutMs}
                onTryAgain={handleTryAgain}
                onKeepWaiting={keepWaiting}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
