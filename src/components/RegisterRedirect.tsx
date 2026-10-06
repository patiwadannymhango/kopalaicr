import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useRegistrationModal } from '../context/RegistrationModalContext';

/** /register no longer exists as a page — anything still linking to it
 * (old QR codes, social posts, flyers) lands on Home with the
 * registration modal already open instead of a blank route. */
export default function RegisterRedirect() {
  const { open } = useRegistrationModal();

  useEffect(() => {
    open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Navigate to="/" replace />;
}
