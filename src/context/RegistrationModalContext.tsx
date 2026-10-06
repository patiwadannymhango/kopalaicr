import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type EntryTab = 'team' | 'individual';

interface RegistrationModalContextValue {
  isOpen: boolean;
  tab: EntryTab;
  setTab: (tab: EntryTab) => void;
  open: (tab?: EntryTab) => void;
  close: () => void;
}

const RegistrationModalContext = createContext<RegistrationModalContextValue | null>(null);

export function RegistrationModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<EntryTab>('team');

  function open(nextTab?: EntryTab) {
    if (nextTab) setTab(nextTab);
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  return (
    <RegistrationModalContext.Provider value={{ isOpen, tab, setTab, open, close }}>
      {children}
    </RegistrationModalContext.Provider>
  );
}

export function useRegistrationModal() {
  const ctx = useContext(RegistrationModalContext);
  if (!ctx) throw new Error('useRegistrationModal must be used within RegistrationModalProvider');
  return ctx;
}
