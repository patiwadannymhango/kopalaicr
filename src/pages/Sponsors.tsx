import { SPONSOR_TIERS, EVENT } from '../data/event';
import Reveal from '../components/Reveal';
import PartnerLogos from '../components/PartnerLogos';

export default function Sponsors() {
  return (
    <main>
      <section className="page-hero">
        <div className="eyebrow">Partner with us</div>
        <h1>Sponsors</h1>
        <p className="lede">
          Sponsorship packages for {EVENT.shortTitle} range from race-day branding to title sponsorship.
          Partners confirmed closer to race day will be listed here.
        </p>
      </section>

      <section className="section">
        <div className="section-inner">
          <Reveal as="div" className="section-head-row">
            <div>
              <div className="eyebrow">Confirmed</div>
              <h2>Official partners</h2>
            </div>
          </Reveal>
          <PartnerLogos />
        </div>
      </section>

      <section className="section alt">
        <div className="section-inner">
          <Reveal as="div" className="section-head-row">
            <div>
              <div className="eyebrow">Open tiers</div>
              <h2>Sponsorship packages</h2>
            </div>
          </Reveal>
          <div className="sponsor-grid">
            {SPONSOR_TIERS.map((s, i) => (
              <Reveal as="div" key={s.name} delay={i * 60} className="sponsor-card tier-card">
                <div className="sponsor-name">{s.name}</div>
                <div className="sponsor-tier">{s.tier}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt" id="sponsor">
        <div className="section-inner narrow">
          <h2>Become a sponsor or volunteer</h2>
          <p>
            We're looking for partners across every tier above, plus volunteers for hydration points,
            marshalling and the finish line. Reach out and we'll share the full sponsorship pack.
          </p>
          {EVENT.phone ? (
            <a className="btn-primary" href={`https://wa.me/${EVENT.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer">
              Message us on WhatsApp
            </a>
          ) : (
            <p className="hint coming-soon">Contact details coming soon</p>
          )}
        </div>
      </section>

      <section className="section" id="contact">
        <div className="section-inner narrow">
          <h2>Contact the secretariat</h2>
          <p>{EVENT.venue}</p>
          <p>
            <strong>Email address:</strong> <a href={`mailto:${EVENT.email}`}>{EVENT.email}</a>
          </p>
          <p>
            <strong>Phone:</strong>{' '}
            <a href={`tel:${EVENT.contactPhone.replace(/[^\d+]/g, '')}`}>{EVENT.contactPhone}</a>
          </p>
          {EVENT.phone && (
            <p>
              <a href={`https://wa.me/${EVENT.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer">
                {EVENT.phone} (WhatsApp)
              </a>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
