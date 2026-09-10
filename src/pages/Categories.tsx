import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RELAY_CATEGORIES, INDIVIDUAL_DIVISIONS, RELAY_TEAM_SIZE } from '../types';
import { INCLUSIONS } from '../data/event';
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

  function feeFor(source: BackendCategory[] | null, code: string): number | null {
    const category = source?.find((c) => c.code === code);
    if (!category) return null;
    const price = Number(category.price);
    return price > 0 ? price : null;
  }

  const relayFee = feeFor(relayCategories, 'relay');
  const individualFee = feeFor(individualCategories, '10km-individual');
  const funRunFee = feeFor(individualCategories, '5km-fun-run');

  return (
    <main>
      <section className="page-hero">
        <div className="eyebrow">Race categories</div>
        <h1>Pick how you take part</h1>
        <p className="lede">
          Field a company team, race solo over 10KM, or bring everyone along for the 5KM Fun Race &amp; Walk.
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
                  <span className="race-row-fee">{relayFee ? `K${relayFee}` : ''}</span>
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
                  <h2>10KM Individual Race</h2>
                  <span className="race-row-fee">{individualFee ? `K${individualFee}` : ''}</span>
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
                  <h2>5KM Fun Race &amp; Walk</h2>
                  <span className="race-row-fee">{funRunFee ? `K${funRunFee}` : ''}</span>
                </div>
                <p>
                  Walk it, jog it, or run it. Open to families, friends, corporate employees, students and
                  the wider community — promoting healthy living for everyone.
                </p>
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
