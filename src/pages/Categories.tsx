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

  const rows = [
    {
      key: 'relay',
      name: '10KM Corporate Relay',
      detail: `Teams of ${RELAY_TEAM_SIZE} runners share the baton over the full 10KM course — one entry fee covers the whole team.`,
      tags: RELAY_CATEGORIES.map((c) => c.label),
      fee: feeFor(relayCategories, 'relay'),
    },
    {
      key: '5km',
      name: '5KM Individual Race & Walk',
      detail: 'Race it or walk it over 5KM — an easier distance for first-timers and casual runners.',
      tags: INDIVIDUAL_DIVISIONS.map((d) => d.label),
      fee: feeFor(individualCategories, '5km-individual'),
    },
    {
      key: '10km',
      name: '10KM Individual Race',
      detail: 'Race the 10KM course solo — for competitive and recreational runners alike.',
      tags: INDIVIDUAL_DIVISIONS.map((d) => d.label),
      fee: feeFor(individualCategories, '10km-individual'),
    },
    {
      key: '21km',
      name: '21KM Individual Race & Walk',
      detail: 'Take on the half-marathon distance — race it competitively or walk it at your own pace.',
      tags: INDIVIDUAL_DIVISIONS.map((d) => d.label),
      fee: feeFor(individualCategories, '21km-individual'),
    },
    {
      key: 'ceo',
      name: '100m CEO Race',
      detail: 'A fast, fun sprint reserved for company chief executives — bragging rights on the line.',
      tags: [] as string[],
      fee: feeFor(individualCategories, '100m-ceo'),
    },
    {
      key: 'directors',
      name: '100m Directors Race',
      detail: 'A fast, fun sprint for company directors and senior leadership.',
      tags: [] as string[],
      fee: feeFor(individualCategories, '100m-directors'),
    },
    {
      key: 'kids',
      name: 'Kids Athletics',
      detail: 'Fun athletics activities for children — open to families joining us on race day.',
      tags: [] as string[],
      fee: feeFor(individualCategories, 'kids-athletics'),
    },
  ];

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
            <Reveal as="div" className="pricing-table-wrap">
              <table className="pricing-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="pricing-table-divisions-col">Divisions</th>
                    <th className="pricing-table-fee-col">Entry fee</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key}>
                      <td>
                        <div className="pricing-table-name">{r.name}</div>
                        <div className="pricing-table-detail">{r.detail}</div>
                      </td>
                      <td className="pricing-table-divisions-col">
                        {r.tags.length ? (
                          <ul className="tag-list">
                            {r.tags.map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="pricing-table-dash">—</span>
                        )}
                      </td>
                      <td className="pricing-table-fee-col">
                        <span className="pricing-table-fee">{`K${r.fee}`}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
