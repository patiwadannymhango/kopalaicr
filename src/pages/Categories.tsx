import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RELAY_CATEGORIES, INDIVIDUAL_DIVISIONS, RELAY_TEAM_SIZE } from '../types';
import { INCLUSIONS, DEFAULT_ENTRY_FEE } from '../data/event';
import { fetchIndividualCategories } from '../api/individualApi';
import { fetchRelayCategories } from '../api/teamApi';
import type { BackendCategory } from '../api/individualApi';
import Reveal from '../components/Reveal';
import Spinner from '../components/Spinner';

export default function Categories() {
  const [individualCategories, setIndividualCategories] = useState<BackendCategory[] | null>(null);
  const [relayCategories, setRelayCategories] = useState<BackendCategory[] | null>(null);

  useEffect(() => {
    fetchIndividualCategories().then(setIndividualCategories).catch(() => setIndividualCategories([]));
    fetchRelayCategories().then(setRelayCategories).catch(() => setRelayCategories([]));
  }, []);

  const loading = !individualCategories || !relayCategories;

  function feeFor(source: BackendCategory[] | null, code: string): number {
    const category = source?.find((c) => c.code === code);
    const price = category ? Number(category.price) : NaN;
    return price > 0 ? price : DEFAULT_ENTRY_FEE;
  }

  const relayFee = feeFor(relayCategories, 'relay');
  const fiveKmFee = feeFor(individualCategories, '5km-individual');
  const individualFee = feeFor(individualCategories, '10km-individual');
  const halfMarathonFee = feeFor(individualCategories, '21km-individual');
  const ceoRaceFee = feeFor(individualCategories, '100m-ceo');
  const directorsRaceFee = feeFor(individualCategories, '100m-directors');
  const kidsFee = feeFor(individualCategories, 'kids-athletics');

  return (
    <main>
      <section className="page-hero">
        <div className="eyebrow">Race categories</div>
        <h1>Pick how you take part</h1>
        <p className="lede">
          Field a company team, race solo over 5KM, 10KM or 21KM, take on a 100m CEO or Directors sprint, or
          bring the kids along for Kids Athletics.
        </p>
      </section>

      <section className="section">
        <div className="section-inner">
          {loading ? (
            <p className="hint"><Spinner size={13} /> Loading fees…</p>
          ) : (
            <Reveal as="div" className="category-cards">
              <div className="category-card">
                <div className="category-card-head">
                  <h2>10KM Corporate Relay</h2>
                  <span className="race-row-fee">{`K${relayFee}`}</span>
                </div>
                <p>
                  Companies and institutions field teams of {RELAY_TEAM_SIZE} runners who share the baton
                  over the full 10KM course. One entry fee covers the whole team.
                </p>
                <ul className="tag-list">
                  {RELAY_CATEGORIES.map((c) => (
                    <li key={c.value}>{c.label}</li>
                  ))}
                </ul>
              </div>

              <div className="category-card">
                <div className="category-card-head">
                  <h2>5KM Individual Race &amp; Walk</h2>
                  <span className="race-row-fee">{`K${fiveKmFee}`}</span>
                </div>
                <p>Race it or walk it over 5KM — an easier distance for first-timers and casual runners.</p>
                <ul className="tag-list">
                  {INDIVIDUAL_DIVISIONS.map((d) => (
                    <li key={d.value}>{d.label}</li>
                  ))}
                </ul>
              </div>

              <div className="category-card">
                <div className="category-card-head">
                  <h2>10KM Individual Race</h2>
                  <span className="race-row-fee">{`K${individualFee}`}</span>
                </div>
                <p>Race the 10KM course solo — for competitive and recreational runners alike.</p>
                <ul className="tag-list">
                  {INDIVIDUAL_DIVISIONS.map((d) => (
                    <li key={d.value}>{d.label}</li>
                  ))}
                </ul>
              </div>

              <div className="category-card">
                <div className="category-card-head">
                  <h2>21KM Individual Race &amp; Walk</h2>
                  <span className="race-row-fee">{`K${halfMarathonFee}`}</span>
                </div>
                <p>Take on the half-marathon distance — race it competitively or walk it at your own pace.</p>
                <ul className="tag-list">
                  {INDIVIDUAL_DIVISIONS.map((d) => (
                    <li key={d.value}>{d.label}</li>
                  ))}
                </ul>
              </div>

              <div className="category-card">
                <div className="category-card-head">
                  <h2>100m CEO Race</h2>
                  <span className="race-row-fee">{`K${ceoRaceFee}`}</span>
                </div>
                <p>A fast, fun sprint reserved for company chief executives — bragging rights on the line.</p>
              </div>

              <div className="category-card">
                <div className="category-card-head">
                  <h2>100m Directors Race</h2>
                  <span className="race-row-fee">{`K${directorsRaceFee}`}</span>
                </div>
                <p>A fast, fun sprint for company directors and senior leadership.</p>
              </div>

              <div className="category-card">
                <div className="category-card-head">
                  <h2>Kids Athletics</h2>
                  <span className="race-row-fee">{`K${kidsFee}`}</span>
                </div>
                <p>Fun athletics activities for children — open to families joining us on race day.</p>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="section-inner narrow">
          <div className="eyebrow">Every entry includes</div>
          <h2>What you get on race day</h2>
          <ul className="package-grid">
            {INCLUSIONS.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="cta-band">
        <h2>Ready when you are</h2>
        <p>Choose a category and complete your registration in minutes.</p>
        <Link to="/register" className="btn-cta-light">
          Register now
        </Link>
      </section>
    </main>
  );
}
