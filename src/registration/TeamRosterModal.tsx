import { useEffect, useState } from 'react';
import type { Gender, RunnerRosterEntry } from '../types';
import Modal from '../components/Modal';
import type { BackendCategory } from '../api/individualApi';

function emptyEntry(): RunnerRosterEntry {
  return { fullName: '', gender: '', age: '', raceCategory: '' };
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

  // Resized from the current participant count each time the modal opens,
  // preserving any values already entered (by position) — so bumping the
  // headcount up or down adjusts the table instead of discarding work.
  useEffect(() => {
    if (!open) return;
    setRows(Array.from({ length: participantCount }, (_, i) => roster[i] ?? emptyEntry()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function updateRow<K extends keyof RunnerRosterEntry>(index: number, key: K, value: RunnerRosterEntry[K]) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  function handleSave() {
    onSave(rows);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Participant list" wide>
      <div className="panel-form">
        <p className="hint">
          List each of the {participantCount} {participantCount === 1 ? 'person' : 'people'} running — all optional, but it helps us plan the race.
        </p>

        <div className="bulk-table-wrap">
          <table className="bulk-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Full name</th>
                <th>Race Category</th>
                <th>Gender</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="bulk-table-num">{i + 1}</td>
                  <td>
                    <input value={row.fullName} onChange={(e) => updateRow(i, 'fullName', e.target.value)} />
                  </td>
                  <td>
                    <select value={row.raceCategory} onChange={(e) => updateRow(i, 'raceCategory', e.target.value)}>
                      <option value="">—</option>
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

        <button className="btn-primary btn-full" onClick={handleSave}>
          Save participant list
        </button>
      </div>
    </Modal>
  );
}
