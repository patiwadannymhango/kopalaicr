import { PARTNER_LOGOS } from '../data/event';
import Reveal from './Reveal';

export default function PartnerLogos({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`partner-logo-grid${compact ? ' compact' : ''}`}>
      {PARTNER_LOGOS.map((p, i) => (
        <Reveal
          as="div"
          key={p.name}
          delay={i * 50}
          className={`partner-logo-card${p.lightBg ? ' light-bg' : ''}`}
        >
          <img src={p.file} alt={p.name} loading="lazy" />
        </Reveal>
      ))}
    </div>
  );
}
