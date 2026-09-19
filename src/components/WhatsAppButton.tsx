import { useEffect, useState } from 'react';
import { EVENT } from '../data/event';

// Below this scroll distance, the hero's own content can sit in the same
// bottom-right corner the button floats in (see App.css .whatsapp-fab) —
// staying hidden until the visitor scrolls past it avoids the button
// covering hero text on short/mobile viewports.
const SHOW_AFTER_SCROLL_PX = 160;

/**
 * Floating glowing WhatsApp button, fixed bottom-right on every page.
 * Hidden entirely when no phone number is published (matches the
 * EVENT.phone-guarded WhatsApp links elsewhere — Layout footer, Sponsors).
 */
export default function WhatsAppButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_SCROLL_PX);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!EVENT.phone) return null;

  return (
    <a
      className={`whatsapp-fab${visible ? ' whatsapp-fab-visible' : ''}`}
      href={`https://wa.me/${EVENT.phone.replace(/[^\d]/g, '')}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <span className="whatsapp-fab-ring" aria-hidden="true" />
      <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <path
          fill="#fff"
          d="M16 4C9.4 4 4 9.4 4 16c0 2.2.6 4.3 1.7 6.1L4 28l6.1-1.6c1.7.9 3.7 1.4 5.9 1.4 6.6 0 12-5.4 12-12S22.6 4 16 4Zm0 21.8c-1.9 0-3.7-.5-5.3-1.4l-.4-.2-3.8 1 1-3.7-.2-.4C6.5 19.5 6 17.8 6 16c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 9.8-10 9.8Z"
        />
        <path
          fill="#fff"
          d="M21.6 18.5c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-2-1.8-2.3-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1.1 2.8 1.2 3c.1.2 2.2 3.4 5.4 4.7.7.3 1.3.5 1.8.7.7.2 1.4.2 1.9.1.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.2-.6-.4Z"
        />
      </svg>
    </a>
  );
}
