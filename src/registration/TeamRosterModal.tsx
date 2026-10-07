import { useEffect, useState } from 'react';
import type { Gender, RunnerRosterEntry } from '../types';
import Modal from '../components/Modal';
import type { BackendCategory } from '../api/individualApi';

function emptyEntry(): RunnerRosterEntry {
  return { fullName: '', gender: '', age: '', raceCategory: '', raceCategoryName: '' };
}

export default function TeamRosterModal({
  open,
  onClose,
  participantCount,
  roster,
  categories,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  participantCount: number;
  roster: RunnerRosterEntry[];
  categories: BackendCategory[] | null;
  onSave: (roster: RunnerRosterEntry[]) => void;
}) {
  const [rows, setRows] = useState<RunnerRosterEntry[]>([]);
  const [error, setError] = useState('');

  // Resized from the current participant count each time the modal opens,
  // preserving any values already entered (by position) — so bumping the
  // headcount up or down adjusts the table instead of discarding work.
  useEffect(() => {
    if (!open) return;
    setRows(Array.from({ length: participantCount }, (_, i) => roster[i] ?? emptyEntry()));
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function updateRow<K extends keyof RunnerRosterEntry>(index: number, key: K, value: RunnerRosterEntry[K]) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  function updateRaceCategory(index: number, code: string) {
    const category = categories?.find((c) => c.code === code);
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, raceCategory: code, raceCategoryName: category?.name ?? '' } : r))
    );
  }

  function handleSave() {
    const incomplete = rows.some((r) => !r.fullName.trim() || !r.raceCategory);
    if (incomplete) {
      setError('Every person needs a full name and a race category.');
      return;
    }
    setError('');
    onSave(rows);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Participant list" wide>
      <div className="panel-form">
        <p className="hint">
          List each of the {participantCount} {participantCount === 1 ? 'person' : 'people'} running — full name and race category are required for everyone.
        </p>

        <div className="bulk-table-wrap">
          <table className="bulk-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Full name *</th>
                <th>Race Category *</th>
                <th>Gender</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="bulk-table-num">{i + 1}</td>
                  <td>
                    <input
                      className={!row.fullName.trim() && error ? 'has-error' : ''}
                      value={row.fullName}
                      onChange={(e) => updateRow(i, 'fullName', e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className={!row.raceCategory && error ? 'has-error' : ''}
                      value={row.raceCategory}
                      onChange={(e) => updateRaceCategory(i, e.target.value)}
                    >
                      <option value="">Select race</option>
                      {categories?.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select value={row.gender} onChange={(e) => updateRow(i, 'gender', e.target.value as Gender)}>
                      <option value="">—</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={row.age}
                      onChange={(e) => updateRow(i, 'age', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn-primary btn-full" onClick={handleSave}>
          Save participant list
        </button>
      </div>
    </Modal>
  );
}
