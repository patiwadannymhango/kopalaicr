import { NavLink, Outlet, Link } from 'react-router-dom';
import { EVENT } from '../data/event';
import PartnerLogos from './PartnerLogos';
import WhatsAppButton from './WhatsAppButton';

export default function Layout() {
  return (
    <div className="site">
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="brand">
            <img src="/logo.png" alt="" className="brand-badge" aria-hidden="true" />
            <span className="brand-title-lg">{EVENT.shortTitle}</span>
          </Link>
          <nav className="site-nav">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/categories">Categories</NavLink>
            <NavLink to="/sponsors">Sponsors</NavLink>
            <NavLink to="/exhibitors">Exhibitors</NavLink>
            <NavLink to="/gallery">Gallery 2025</NavLink>
          </nav>
          <div className="site-header-actions">
            <Link to="/register" className="btn-primary btn-sm">
              Register
            </Link>
            <Link to="/exhibitors" className="btn-vendor btn-sm">
              Exhibitor registration
            </Link>
          </div>
        </div>
      </header>

      <div className="partner-strip">
        <div className="section-inner">
          <PartnerLogos compact />
        </div>
      </div>

      <Outlet />

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <img src="/logo.png" alt="" className="brand-badge" aria-hidden="true" />
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
                <Link to="/exhibitors">Exhibitor entry</Link>
                <a href="/register#track">Track registration</a>
              </div>
              <div>
                <span className="footer-label">About</span>
                <Link to="/about">About the relay</Link>
                <Link to="/sponsors">Sponsors &amp; partners</Link>
                <Link to="/gallery">Gallery 2025</Link>
              </div>
              <div>
                <span className="footer-label">Contact</span>
                <span className="footer-text">{EVENT.venue}</span>
                <a href={`mailto:${EVENT.email}`}>{EVENT.email}</a>
                <a href={`tel:${EVENT.contactPhone.replace(/[^\d+]/g, '')}`}>{EVENT.contactPhone}</a>
                <a href={`https://wa.me/${EVENT.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer">
                  {EVENT.phone} (WhatsApp)
                </a>
              </div>
            </div>
          </div>
          <p className="footer-fine">
            © {new Date().getFullYear()} {EVENT.title}. Organised by {EVENT.organizer}. All rights reserved.
          </p>
        </div>
      </footer>

      <WhatsAppButton />
    </div>
  );
}
