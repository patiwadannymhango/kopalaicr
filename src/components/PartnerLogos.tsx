import { PARTNER_LOGOS } from '../data/event';
import Reveal from './Reveal';

function LogoCard({ p, delay }: { p: (typeof PARTNER_LOGOS)[number]; delay: number }) {
  return (
    <Reveal
      as="div"
      key={p.name}
      delay={delay}
      className={`partner-logo-card${p.lightBg ? ' light-bg' : ''}${p.featured ? ' featured' : ''}`}
    >
      <img src={p.file} alt={p.name} loading="lazy" />
    </Reveal>
  );
}

export default function PartnerLogos({ compact = false }: { compact?: boolean }) {
  // In the slim header strip the "main sponsor" banner below would be too
  // tall, so the featured logo stays inline there (bigger + gold-bordered,
  // see App.css) instead of getting its own callout.
  if (compact) {
    return (
      <div className="partner-logo-grid compact">
        {PARTNER_LOGOS.map((p, i) => (
          <LogoCard key={p.name} p={p} delay={i * 50} />
        ))}
      </div>
    );
  }

  const featured = PARTNER_LOGOS.find((p) => p.featured);
  const rest = PARTNER_LOGOS.filter((p) => !p.featured);

  return (
    <div className="partner-logos">
      {featured && (
        <Reveal as="div" className="partner-featured-banner">
          <span className="partner-featured-label">Main Sponsor</span>
          <img src={featured.file} alt={featured.name} loading="lazy" />
        </Reveal>
      )}
      <div className="partner-logo-grid">
        {rest.map((p, i) => (
          <LogoCard key={p.name} p={p} delay={i * 50} />
        ))}
      </div>
    </div>
  );
}
