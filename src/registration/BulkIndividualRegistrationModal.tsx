import { useEffect, useRef, useState } from 'react';
import type { BulkMemberRow, Gender, SubmittedBy } from '../types';
import { RACE_CATEGORIES } from '../types';
import { DEFAULT_ENTRY_FEE } from '../data/event';
import {
  downloadBulkIndividualTemplate,
  fetchIndividualCategories,
  parseBulkIndividualUpload,
  submitBulkIndividualRegistration,
} from '../api/individualApi';
import type { BackendCategory, SubmitRegistrationResult } from '../api/individualApi';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';

function makeId() {
  return Math.random().toString(36).slice(2);
}

function emptyRow(): BulkMemberRow {
  return {
    id: makeId(),
    fullName: '',
    email: '',
    phone: '',
    gender: '',
    ageRange: '',
    country: 'Zambia',
    raceCategory: '',
    townOrCity: '',
    clubOrInstitution: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalNotes: '',
  };
}

export default function BulkIndividualRegistrationModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: SubmitRegistrationResult, submittedBy: SubmittedBy, rows: BulkMemberRow[]) => void;
}) {
  const [categories, setCategories] = useState<BackendCategory[] | null>(null);
  const [rows, setRows] = useState<BulkMemberRow[]>([emptyRow()]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) fetchIndividualCategories().then(setCategories).catch(() => setCategories([]));
  }, [open]);

  // Unlike the single-person form, a row here can hold a `raceCategory`
  // value that was never actually chosen from the <select> — an upload
  // can parse in an unrecognized category code that failed validation.
  // Only show/count a fee once it's a real, known category; an
  // unmatched code shows no fee rather than silently falling back to
  // DEFAULT_ENTRY_FEE, which would be misleading for a row that isn't
  // actually payable yet.
  function feeFor(code: string): number | null {
    if (!code || !categories) return null;
    const category = categories.find((c) => c.code === code);
    if (!category) return null;
    const price = Number(category.price);
    return price > 0 ? price : DEFAULT_ENTRY_FEE;
  }

  const total = rows.reduce((sum, row) => sum + (feeFor(row.raceCategory) ?? 0), 0);

  function updateRow<K extends keyof BulkMemberRow>(id: string, key: K, value: BulkMemberRow[K]) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value, errors: undefined } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  async function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const result = await parseBulkIndividualUpload(file);
      const parsedRows: BulkMemberRow[] = result.rows.map((r) => ({
        id: makeId(),
        fullName: r.values.fullName,
        email: r.values.email,
        phone: r.values.phone,
        gender: (r.values.gender as Gender) || '',
        ageRange: r.values.ageRange as BulkMemberRow['ageRange'],
        country: r.values.country,
        raceCategory: r.values.raceCategory as BulkMemberRow['raceCategory'],
        townOrCity: r.values.townOrCity,
        clubOrInstitution: r.values.clubOrInstitution,
        emergencyContactName: r.values.emergencyContactName,
        emergencyContactPhone: r.values.emergencyContactPhone,
        medicalNotes: r.values.medicalNotes,
        errors: r.errors
          ? Object.fromEntries(Object.entries(r.errors).map(([k, v]) => [k, v[0]]))
          : undefined,
      }));

      // Uploaded rows are appended to whatever's already here rather than
      // replacing it, so nothing already typed in is silently discarded.
      setRows((prev) => {
        const hasOnlyBlankFirstRow = prev.length === 1 && !prev[0].fullName && !prev[0].email;
        return hasOnlyBlankFirstRow ? parsedRows : [...prev, ...parsedRows];
      });

      const errorCount = result.rows.filter((r) => r.errors).length;
      if (errorCount > 0) {
        setError(`${errorCount} row(s) from the file need fixing — see the highlighted fields below.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that file.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDownloadTemplate() {
    try {
      const blob = await downloadBulkIndividualTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'kopala-icr-group-registration-template.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not download the template — please try again.');
    }
  }

  async function handleSubmit() {
    setError('');

    const incomplete = rows.some(
      (r) => !r.fullName || !r.email || !r.phone || !r.raceCategory || !r.emergencyContactPhone
    );
    if (incomplete) {
      setError('Every person needs a name, email, phone, race and emergency contact phone.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the event terms and indemnity to continue.');
      return;
    }

    // No separate "submitted by" contact is collected — the first person
    // in the table doubles as the group's billing/notification contact
    // (confirmation summary, card billing details if that method is
    // chosen). They're always filled in by the point this validates.
    const submittedBy: SubmittedBy = {
      fullName: rows[0].fullName,
      email: rows[0].email,
      phone: rows[0].phone,
    };

    setSubmitting(true);
    try {
      const result = await submitBulkIndividualRegistration(submittedBy, rows);
      onSuccess(result, submittedBy, rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong submitting the group. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setRows([emptyRow()]);
    setAcceptedTerms(false);
    setError('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Register multiple people" wide>
      <div className="panel-form">
        <p className="hint">
          Add everyone in your group below — type them in, or upload a spreadsheet — then pay once for the
          whole group.
        </p>

        <div className="bulk-toolbar">
          <button type="button" className="btn-ghost" onClick={handleUploadClick} disabled={uploading}>
            {uploading ? (
              <span className="btn-loading"><Spinner size={14} /> Reading file…</span>
            ) : (
              'Upload spreadsheet'
            )}
          </button>
          <button type="button" className="btn-text" onClick={handleDownloadTemplate}>
            Download template
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <h3 style={{ marginTop: 8, marginBottom: 4 }}>People ({rows.length})</h3>
        <p className="hint" style={{ marginTop: 0 }}>
          The first person listed is treated as the group's contact — confirmation and billing go to them.
        </p>

        <div className="bulk-table-wrap">
          <table className="bulk-table">
            <thead>
              <tr>
                <th className="bulk-col-num">#</th>
                <th className="bulk-col-primary">Full name *</th>
                <th className="bulk-col-primary">Email *</th>
                <th className="bulk-col-primary">Phone *</th>
                <th className="bulk-col-race">Race *</th>
                <th>Gender</th>
                <th>Age range</th>
                <th>Country</th>
                <th>Town / City</th>
                <th className="bulk-col-minor">Club / institution</th>
                <th className="bulk-col-minor">Emergency contact name</th>
                <th className="bulk-col-minor">Emergency contact phone *</th>
                <th className="bulk-col-minor">Medical notes</th>
                <th>Fee</th>
                <th className="bulk-col-remove" aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id}>
                  <td className="bulk-table-num">{i + 1}</td>
                  <td>
                    <input
                      className={`bulk-col-primary ${row.errors?.fullName ? 'has-error' : ''}`.trim()}
                      title={row.errors?.fullName}
                      value={row.fullName}
                      onChange={(e) => updateRow(row.id, 'fullName', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="email"
                      className={`bulk-col-primary ${row.errors?.email ? 'has-error' : ''}`.trim()}
                      title={row.errors?.email}
                      value={row.email}
                      onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className={`bulk-col-primary ${row.errors?.phone ? 'has-error' : ''}`.trim()}
                      title={row.errors?.phone}
                      value={row.phone}
                      onChange={(e) => updateRow(row.id, 'phone', e.target.value)}
                    />
                  </td>
                  <td>
                    <select
                      className={`bulk-col-race ${row.errors?.raceCategory ? 'has-error' : ''}`.trim()}
                      title={row.errors?.raceCategory}
                      value={row.raceCategory}
                      onChange={(e) => updateRow(row.id, 'raceCategory', e.target.value as BulkMemberRow['raceCategory'])}
                    >
                      <option value="">Select race</option>
                      {RACE_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select value={row.gender} onChange={(e) => updateRow(row.id, 'gender', e.target.value as Gender)}>
                      <option value="">—</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.ageRange}
                      onChange={(e) => updateRow(row.id, 'ageRange', e.target.value as BulkMemberRow['ageRange'])}
                    >
                      <option value="">—</option>
                      <option value="Under 18">Under 18</option>
                      <option value="18-29">18–29</option>
                      <option value="30-39">30–39</option>
                      <option value="40-49">40–49</option>
                      <option value="50-59">50–59</option>
                      <option value="60+">60+</option>
                    </select>
                  </td>
                  <td>
                    <input value={row.country} onChange={(e) => updateRow(row.id, 'country', e.target.value)} />
                  </td>
                  <td>
                    <input value={row.townOrCity} onChange={(e) => updateRow(row.id, 'townOrCity', e.target.value)} />
                  </td>
                  <td>
                    <input
                      className="bulk-col-minor"
                      value={row.clubOrInstitution}
                      onChange={(e) => updateRow(row.id, 'clubOrInstitution', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="bulk-col-minor"
                      value={row.emergencyContactName}
                      onChange={(e) => updateRow(row.id, 'emergencyContactName', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className={`bulk-col-minor ${row.errors?.emergencyContactPhone ? 'has-error' : ''}`.trim()}
                      title={row.errors?.emergencyContactPhone}
                      value={row.emergencyContactPhone}
                      onChange={(e) => updateRow(row.id, 'emergencyContactPhone', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="bulk-col-minor"
                      value={row.medicalNotes}
                      onChange={(e) => updateRow(row.id, 'medicalNotes', e.target.value)}
                    />
                  </td>
                  <td className="bulk-table-fee">
                    {feeFor(row.raceCategory) != null ? `K${feeFor(row.raceCategory)}` : '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="roster-remove"
                      onClick={() => removeRow(row.id)}
                      aria-label={`Remove person ${i + 1}`}
                      disabled={rows.length === 1}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.some((r) => r.errors) && (
          <ul className="bulk-error-list">
            {rows.map((row, i) =>
              row.errors
                ? Object.entries(row.errors).map(([field, message]) => (
                    <li key={`${row.id}-${field}`} className="field-error">
                      Row {i + 1}: {message}
                    </li>
                  ))
                : null
            )}
          </ul>
        )}

        <button type="button" className="btn-ghost btn-full" onClick={addRow}>
          + Add another person
        </button>

        <div className="bulk-total">
          <span>Total for {rows.length} {rows.length === 1 ? 'person' : 'people'}</span>
          <strong>K{total.toFixed(2)}</strong>
        </div>

        <label className="checkbox-row">
          <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
          I confirm these details are correct and accept the event terms and indemnity on behalf of the group.
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn-primary btn-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <span className="btn-loading"><Spinner size={14} /> Submitting…</span>
          ) : (
            `Continue to payment — K${total.toFixed(2)}`
          )}
        </button>
      </div>
    </Modal>
  );
}
