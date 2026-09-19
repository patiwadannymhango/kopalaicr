import { useCallback, useEffect, useState } from 'react';
import { GALLERY_IMAGES } from '../data/gallery';
import Reveal from '../components/Reveal';

export default function Gallery() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const showPrev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + GALLERY_IMAGES.length) % GALLERY_IMAGES.length)),
    []
  );
  const showNext = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % GALLERY_IMAGES.length)),
    []
  );

  useEffect(() => {
    if (openIndex === null) return;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [openIndex, close, showPrev, showNext]);

  const active = openIndex !== null ? GALLERY_IMAGES[openIndex] : null;

  return (
    <main>
      <section className="page-hero">
        <div className="eyebrow">2025 race day</div>
        <h1>Gallery 2025</h1>
        <p className="lede">
          Moments from last year&rsquo;s Kopala Inter Company Relay — teams, runners and race-day energy
          at Nchanga Stadium. Tap any photo for a closer look.
        </p>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="gallery-grid">
            {GALLERY_IMAGES.map((img, i) => (
              <Reveal
                as="button"
                key={img.id}
                type="button"
                delay={Math.min(i * 40, 480)}
                className="gallery-tile"
                onClick={() => setOpenIndex(i)}
                aria-label={`Open photo ${i + 1} of ${GALLERY_IMAGES.length}`}
              >
                <img src={img.thumb} alt={img.alt} loading="lazy" />
                <span className="gallery-tile-overlay" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {active && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={close}>
          <button className="lightbox-close" onClick={close} aria-label="Close">
            ✕
          </button>
          <button
            className="lightbox-nav lightbox-prev"
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <img key={active.id} src={active.full} alt={active.alt} className="lightbox-img" onClick={(e) => e.stopPropagation()} />
          <button
            className="lightbox-nav lightbox-next"
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            aria-label="Next photo"
          >
            ›
          </button>
          <div className="lightbox-count">
            {openIndex! + 1} / {GALLERY_IMAGES.length}
          </div>
        </div>
      )}
    </main>
  );
}
