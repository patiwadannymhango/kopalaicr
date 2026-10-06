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
import Field from '../components/Field';
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

const initialSubmittedBy: SubmittedBy = { fullName: '', email: '', phone: '' };

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
  const [submittedBy, setSubmittedBy] = useState<SubmittedBy>(initialSubmittedBy);
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

    if (!submittedBy.fullName || !submittedBy.email || !submittedBy.phone) {
      setError('Please fill in your own name, email and phone as the person submitting this group.');
      return;
    }
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
    setSubmittedBy(initialSubmittedBy);
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

        <div className="grid-2">
          <Field label="Your name" required>
            <input
              value={submittedBy.fullName}
              onChange={(e) => setSubmittedBy((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="Person submitting this group"
            />
          </Field>
          <Field label="Your email" required>
            <input
              type="email"
              value={submittedBy.email}
              onChange={(e) => setSubmittedBy((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Your phone" required>
            <input
              value={submittedBy.phone}
              onChange={(e) => setSubmittedBy((p) => ({ ...p, phone: e.target.value }))}
              placeholder="e.g. 097 000 0000"
            />
          </Field>
        </div>

        <h3 style={{ marginTop: 8, marginBottom: 4 }}>People ({rows.length})</h3>

        {rows.map((row, i) => (
          <div className="bulk-row" key={row.id}>
            <div className="bulk-row-head">
              <span className="bulk-row-num">Person {i + 1}</span>
              <span className="bulk-row-fee">
                {feeFor(row.raceCategory) != null ? `K${feeFor(row.raceCategory)}` : ''}
              </span>
              <button
                type="button"
                className="roster-remove"
                onClick={() => removeRow(row.id)}
                aria-label={`Remove person ${i + 1}`}
                disabled={rows.length === 1}
              >
                ×
              </button>
            </div>

            <div className="grid-2">
              <Field label="Full name" required>
                <input value={row.fullName} onChange={(e) => updateRow(row.id, 'fullName', e.target.value)} />
                {row.errors?.fullName && <span className="field-error">{row.errors.fullName}</span>}
              </Field>
              <Field label="Email" required>
                <input
                  type="email"
                  value={row.email}
                  onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                />
                {row.errors?.email && <span className="field-error">{row.errors.email}</span>}
              </Field>
              <Field label="Phone" required>
                <input value={row.phone} onChange={(e) => updateRow(row.id, 'phone', e.target.value)} />
                {row.errors?.phone && <span className="field-error">{row.errors.phone}</span>}
              </Field>
              <Field label="Race" required>
                <select
                  value={row.raceCategory}
                  onChange={(e) => updateRow(row.id, 'raceCategory', e.target.value as BulkMemberRow['raceCategory'])}
                >
                  <option value="">Select race</option>
                  {RACE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {row.errors?.raceCategory && <span className="field-error">{row.errors.raceCategory}</span>}
              </Field>
              <Field label="Gender">
                <select value={row.gender} onChange={(e) => updateRow(row.id, 'gender', e.target.value as Gender)}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </Field>
              <Field label="Age range">
                <select
                  value={row.ageRange}
                  onChange={(e) => updateRow(row.id, 'ageRange', e.target.value as BulkMemberRow['ageRange'])}
                >
                  <option value="">Select</option>
                  <option value="Under 18">Under 18</option>
                  <option value="18-29">18–29</option>
                  <option value="30-39">30–39</option>
                  <option value="40-49">40–49</option>
                  <option value="50-59">50–59</option>
                  <option value="60+">60+</option>
                </select>
              </Field>
              <Field label="Town / City">
                <input value={row.townOrCity} onChange={(e) => updateRow(row.id, 'townOrCity', e.target.value)} />
              </Field>
              <Field label="Club / institution">
                <input
                  value={row.clubOrInstitution}
                  onChange={(e) => updateRow(row.id, 'clubOrInstitution', e.target.value)}
                />
              </Field>
              <Field label="Emergency contact name">
                <input
                  value={row.emergencyContactName}
                  onChange={(e) => updateRow(row.id, 'emergencyContactName', e.target.value)}
                />
              </Field>
              <Field label="Emergency contact phone" required>
                <input
                  value={row.emergencyContactPhone}
                  onChange={(e) => updateRow(row.id, 'emergencyContactPhone', e.target.value)}
                />
                {row.errors?.emergencyContactPhone && (
                  <span className="field-error">{row.errors.emergencyContactPhone}</span>
                )}
              </Field>
            </div>
          </div>
        ))}

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
