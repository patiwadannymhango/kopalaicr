import { useState } from 'react';
import { EVENT } from '../data/event';
import TeamRegistration from '../registration/TeamRegistration';
import IndividualRegistration from '../registration/IndividualRegistration';
import TrackRegistration from '../components/TrackRegistration';

type EntryTab = 'team' | 'individual';

export default function Register() {
  const [tab, setTab] = useState<EntryTab>('team');

  return (
    <main>
      <section className="page-hero">
        <div className="eyebrow">Register for {EVENT.shortTitle}</div>
        <h1>Secure your place</h1>
        <p className="lede">
          Field a company relay team, or register as an individual for the 10KM race, the 21KM race &amp;
          walk, the 100m CEO or Directors race, or Kids Athletics.
        </p>
      </section>

      <section className="section">
        <div className="section-inner narrow">
          <div className="entry-tabs">
            <button type="button" className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>
              Team / relay entry
            </button>
            <button type="button" className={tab === 'individual' ? 'active' : ''} onClick={() => setTab('individual')}>
              Individual entry
            </button>
          </div>

          {tab === 'team' ? <TeamRegistration /> : <IndividualRegistration />}
        </div>
      </section>

      <section className="section alt">
        <div className="section-inner narrow">
          <TrackRegistration />
        </div>
      </section>
    </main>
  );
}
