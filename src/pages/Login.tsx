import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: string } | null)?.from || '/dashboard';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your captain email and password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <section className="page-hero">
        <div className="eyebrow">Team login</div>
        <h1>Manage your team</h1>
        <p className="lede">
          Sign in with your captain email and password to check your account status and add runners to your
          roster.
        </p>
      </section>

      <section className="section">
        <div className="section-inner narrow">
          <form className="panel-form" onSubmit={handleSubmit}>
            <Field label="Captain email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>

            {error && <p className="error">{error}</p>}

            <button className="btn-primary btn-full" type="submit" disabled={submitting}>
              {submitting ? (
                <span className="btn-loading">
                  <Spinner size={14} /> Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
            <p className="hint auth-note">
              No account yet? <Link to="/register">Register your team</Link> to create one — a login is set up
              automatically as part of team registration.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
