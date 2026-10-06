import { useEffect } from 'react';
import type { ReactNode } from 'react';

// Modals can nest (e.g. the bulk-upload modal inside the registration
// modal) — this tracks every currently-open modal so only the top one
// responds to Escape, and body scroll only unlocks once all of them
// have closed, instead of each instance stepping on the others.
const openModals: Array<() => void> = [];

export default function Modal({
  open,
  onClose,
  title,
  children,
  headerExtra,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  headerExtra?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    openModals.push(onClose);
    document.body.style.overflow = 'hidden';
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && openModals[openModals.length - 1] === onClose) onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => {
      const idx = openModals.lastIndexOf(onClose);
      if (idx !== -1) openModals.splice(idx, 1);
      document.removeEventListener('keydown', handleKey);
      if (openModals.length === 0) document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={wide ? 'modal-panel modal-panel-wide' : 'modal-panel'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        {headerExtra}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
