import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EVENT, RACE_FORMATS,DEFAULT_ENTRY_FEE } from '../data/event';
import { GALLERY_IMAGES } from '../data/gallery';
import { useCountdown } from '../hooks/useCountdown';
import { fetchIndividualCategories } from '../api/individualApi';
import { fetchRelayCategories } from '../api/teamApi';
import type { BackendCategory } from '../api/individualApi';
import Reveal from '../components/Reveal';
import TrackRegistration from '../components/TrackRegistration';

export default function Home() {
  const { days, hours, minutes, seconds } = useCountdown(EVENT.isoDate);

  const [individualCategories, setIndividualCategories] = useState<BackendCategory[] | null>(null);
  const [relayCategories, setRelayCategories] = useState<BackendCategory[] | null>(null);

  useEffect(() => {
    fetchIndividualCategories().then(setIndividualCategories).catch(() => setIndividualCategories([]));
    fetchRelayCategories().then(setRelayCategories).catch(() => setRelayCategories([]));
  }, []);

  function feeFor(code: string): number {
    const source = code === 'relay' ? relayCategories : individualCategories;
    const category = source?.find((c) => c.code === code);
    const price = category ? Number(category.price) : NaN;
    return price > 0 ? price : DEFAULT_ENTRY_FEE;
  }

  return (
    <main>
      <div className="flagoff-bar">
        <div className="section-inner flagoff-bar-inner">
          <span className="flagoff-bar-label">Flag-off in</span>
          <div className="flagoff-bar-cells">
            <div className="flagoff-bar-cell">
              <span className="flagoff-bar-num">{days}</span>
              <span className="flagoff-bar-lbl">Days</span>
            </div>
            <span className="flagoff-bar-sep">:</span>
            <div className="flagoff-bar-cell">
              <span className="flagoff-bar-num">{hours}</span>
              <span className="flagoff-bar-lbl">Hrs</span>
            </div>
            <span className="flagoff-bar-sep">:</span>
            <div className="flagoff-bar-cell">
              <span className="flagoff-bar-num">{minutes}</span>
              <span className="flagoff-bar-lbl">Min</span>
            </div>
            <span className="flagoff-bar-sep">:</span>
            <div className="flagoff-bar-cell">
              <span className="flagoff-bar-num">{seconds}</span>
              <span className="flagoff-bar-lbl">Sec</span>
            </div>
          </div>
        </div>
      </div>

      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />

        <div className="hero-inner hero-grid">
          <div className="hero-main">
            <Reveal as="div">
              <div className="eyebrow eyebrow-lg">{EVENT.date} · {EVENT.venue}</div>
              <h1>{EVENT.motto}</h1>
              <p className="lede hero-lede">
                {EVENT.theme} — {EVENT.tagline} Join companies and institutions from across the Copperbelt and
                other provinces for a 10KM Corporate Relay, a 5KM Individual Race &amp; Walk, a 10KM Individual
                Race, a 21KM Individual Race &amp; Walk, a 100m CEO Race, a 100m Directors Race, or Kids
                Athletics.
              </p>
              <div className="hero-cta">
                <Link to="/register" className="btn-primary">
                  Register
                </Link>
                <Link to="/exhibitors" className="btn-vendor">
                  Exhibitor registration
                </Link>
              </div>
            </Reveal>

            <Reveal as="div" delay={120} className="pricing-grid">
              {RACE_FORMATS.map((d) => (
                <div className="pricing-grid-cell" key={d.categoryCode}>
                  <div className="pricing-grid-name">
                    {d.code} {d.label}
                  </div>
                  <div className="pricing-grid-fee">{`K${feeFor(d.categoryCode)}`}</div>
                </div>
              ))}
              {Array.from({ length: (4 - (RACE_FORMATS.length % 4)) % 4 }).map((_, i) => (
                <div className="pricing-grid-cell pricing-grid-cell-empty" key={`filler-${i}`} />
              ))}
            </Reveal>

          </div>

          <div className="hero-side">
            <Reveal as="div" delay={160} className="gallery-preview">
              <div className="gallery-preview-head">
                <span className="gallery-preview-label">2025 Gallery</span>
                <Link to="/gallery" className="gallery-preview-link">
                  View all →
                </Link>
              </div>
              <div className="gallery-preview-grid">
                {GALLERY_IMAGES.slice(0, 9).map((img) => (
                  <Link to="/gallery" key={img.id} className="gallery-preview-thumb">
                    <img src={img.thumb} alt={img.alt} loading="lazy" />
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* <section className="section compact" id="categories">
        <div className="section-inner">
          <Reveal as="div" className="section-head-row">
            <div>
              <div className="eyebrow">Race categories</div>
              <h2>Choose how you take part</h2>
            </div>
            <Link to="/categories" className="section-head-link">All categories →</Link>
          </Reveal>
          <div className="race-cards">
            {RACE_FORMATS.map((d, i) => (
              <Reveal as="div" key={d.categoryCode} delay={i * 70} className="race-card">
                <div className="race-card-dist">{d.code}</div>
                <div className="race-card-label">{d.label}</div>
                <p className="race-card-detail">{d.detail}</p>
                <div className="race-card-meta">
                  <span className="race-card-fee">{feeFor(d.categoryCode) ? `K${feeFor(d.categoryCode)}` : ''}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section> */}

      {/* <section className="section compact alt">
        <div className="section-inner">
          <Reveal as="div">
            <div className="eyebrow">Why join?</div>
            <h2>{EVENT.theme}</h2>
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
      </section> */}

      <section className="section compact">
        <div className="section-inner narrow">
          <Reveal as="div">
            <div className="eyebrow">Already registered?</div>
            <h2>Track your registration</h2>
          </Reveal>
          <TrackRegistration />
        </div>
      </section>
    </main>
  );
}
