import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { EVENT } from '../data/event';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { isLoggedIn, team, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="brand">
            <img src="/favicon.svg" alt="" className="brand-badge" aria-hidden="true" />
            <span className="brand-title-lg">{EVENT.shortTitle}</span>
          </Link>
          <nav className="site-nav">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/categories">Categories</NavLink>
            <NavLink to="/sponsors">Sponsors</NavLink>
            {isLoggedIn && <NavLink to="/dashboard">{team?.teamName ?? 'My team'}</NavLink>}
          </nav>
          {isLoggedIn ? (
            <button type="button" className="btn-ghost btn-sm" onClick={handleLogout}>
              Log out
            </button>
          ) : (
            <Link to="/login" className="btn-ghost btn-sm">
              Team login
            </Link>
          )}
          <Link to="/register" className="btn-primary btn-sm">
            Register
          </Link>
        </div>
      </header>

      <Outlet />

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <img src="/favicon.svg" alt="" className="brand-badge" aria-hidden="true" />
              <div>
                <div className="brand-title">{EVENT.title}</div>
                <div className="brand-org">{EVENT.motto}</div>
              </div>
            </div>
            <div className="footer-cols">
              <div>
                <span className="footer-label">The race</span>
                <Link to="/categories">Race categories</Link>
                <Link to="/about">Event info</Link>
              </div>
              <div>
                <span className="footer-label">Register</span>
                <Link to="/register">Team / relay entry</Link>
                <Link to="/register">Individual entry</Link>
                <a href="/register#track">Track registration</a>
              </div>
              <div>
                <span className="footer-label">About</span>
                <Link to="/about">About the relay</Link>
                <Link to="/sponsors">Sponsors &amp; partners</Link>
              </div>
              <div>
                <span className="footer-label">Contact</span>
                <span className="footer-text">{EVENT.venue}</span>
                {EVENT.phone ? (
                  <a href={`https://wa.me/${EVENT.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer">
                    {EVENT.phone} (WhatsApp)
                  </a>
                ) : (
                  <span className="footer-text">Contact details coming soon</span>
                )}
              </div>
            </div>
          </div>
          <p className="footer-fine">
            © {new Date().getFullYear()} {EVENT.title}. Organised by {EVENT.organizer}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
