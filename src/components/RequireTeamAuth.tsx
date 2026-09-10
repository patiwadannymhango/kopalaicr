import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

/** Gates the team dashboard behind a valid session — while the initial
 * token check is in flight it shows a spinner rather than bouncing
 * straight to /login, so a returning captain with a stored token doesn't
 * see a flash of the login page before it resolves. */
export default function RequireTeamAuth() {
  const { loading, isLoggedIn } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="section">
        <div className="section-inner narrow center-text">
          <p className="hint">
            <Spinner size={14} /> Checking your session…
          </p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
