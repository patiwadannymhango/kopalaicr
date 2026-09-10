import { Link } from 'react-router-dom';
import { EVENT, OBJECTIVES } from '../data/event';
import Reveal from '../components/Reveal';

export default function About() {
  return (
    <main>
      <section className="page-hero">
        <div className="eyebrow">About the event</div>
        <h1>{EVENT.title}</h1>
        <p className="lede">
          A corporate athletics event bringing together participants from every sector of the economy —
          starting and finishing at {EVENT.venue} on {EVENT.date}.
        </p>
      </section>

      <section className="section">
        <div className="section-inner narrow">
          <Reveal as="div">
            <p className="lede">
              The {EVENT.shortTitle} is organised by {EVENT.organizer} under the theme "{EVENT.theme}" —{' '}
              {EVENT.tagline} Companies and institutions field 8-runner relay teams to race the baton over
              10KM, individuals compete solo over 10KM or take on the 5KM Fun Race &amp; Walk with friends,
              family and colleagues.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="section-inner narrow">
          <Reveal as="div" className="quick-facts">
            <div><strong>Date</strong>{EVENT.date}</div>
            <div><strong>Venue</strong>{EVENT.venue}</div>
            <div><strong>Organiser</strong>{EVENT.organizer}</div>
            <div><strong>Format</strong>10KM Corporate Relay (8-runner teams), 10KM Individual Race, and the 5KM Fun Race &amp; Walk</div>
          </Reveal>
        </div>
      </section>

      <section className="section alt">
        <div className="section-inner">
          <Reveal as="div">
            <div className="eyebrow">Our objectives</div>
            <h2>What the relay stands for</h2>
          </Reveal>
          <div className="why-grid">
            {OBJECTIVES.map((o, i) => (
              <Reveal as="div" key={o.title} delay={i * 60} className="why-card">
                <div className="why-card-icon" aria-hidden="true">{o.icon}</div>
                <h3>{o.title}</h3>
                <p>{o.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <h2>Ready to join?</h2>
        <p>Enter a company team, race as an individual, or bring the family to the 5KM.</p>
        <Link to="/register" className="btn-cta-light">
          Register now
        </Link>
      </section>
    </main>
  );
}
