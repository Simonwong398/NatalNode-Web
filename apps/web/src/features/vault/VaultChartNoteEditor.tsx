import { CHART_NOTE_MAXIMUM_CHARACTERS } from './vault-management.js';

interface VaultChartNoteEditorProps {
  readonly noteId: string;
  readonly value: string;
  readonly error: string | null;
  readonly busy: boolean;
  readonly saving: boolean;
  readonly onChange: (value: string) => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
}

export default function VaultChartNoteEditor({
  noteId,
  value,
  error,
  busy,
  saving,
  onChange,
  onSave,
  onCancel
}: VaultChartNoteEditorProps) {
  return (
    <div>
      <label className="nn-type-label" htmlFor={`${noteId}-edit`}>
        Edit note
      </label>
      <textarea
        aria-describedby={error ? `${noteId}-edit-error` : undefined}
        aria-invalid={Boolean(error)}
        className="nn-field mt-2 min-h-28 resize-y"
        disabled={busy}
        id={`${noteId}-edit`}
        maxLength={CHART_NOTE_MAXIMUM_CHARACTERS}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      {error ? (
        <p
          className="nn-status nn-status--error mt-2"
          id={`${noteId}-edit-error`}
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          className="nn-button nn-button--secondary"
          disabled={busy}
          onClick={onSave}
          type="button"
        >
          {saving ? 'Saving…' : 'Save note'}
        </button>
        <button
          className="nn-button nn-button--quiet"
          disabled={busy}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
