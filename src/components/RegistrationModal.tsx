import Modal from './Modal';
import IndividualRegistration from '../registration/IndividualRegistration';
import TeamRegistration from '../registration/TeamRegistration';
import { useRegistrationModal } from '../context/RegistrationModalContext';

export default function RegistrationModal() {
  const { isOpen, tab, setTab, close } = useRegistrationModal();

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title="Secure your place"
      headerExtra={
        <div className="entry-tabs modal-entry-tabs">
          <button type="button" className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>
            Group Registration
          </button>
          <button type="button" className={tab === 'individual' ? 'active' : ''} onClick={() => setTab('individual')}>
            Individual entry
          </button>
        </div>
      }
    >
      {tab === 'team' ? <TeamRegistration /> : <IndividualRegistration />}
    </Modal>
  );
}
