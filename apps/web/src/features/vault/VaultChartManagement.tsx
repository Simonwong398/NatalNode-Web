import type { ReactNode, SyntheticEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import type {
  ChartNoteRecord,
  GetVaultChartApiResponse,
  UpdateVaultChartMetadataApiRequest,
  VaultChartCategory,
  VaultChartRecord
} from '@natalnode/contracts';
import {
  CHART_NOTE_MAXIMUM_CHARACTERS,
  createChartNote,
  deleteChartNote,
  deleteVaultChart,
  listChartNotes,
  normalizeDisplayName,
  normalizeNoteContent,
  updateChartNote,
  updateVaultChartMetadata,
  validateDisplayName,
  validateNoteContent,
  VAULT_CHART_CATEGORIES,
  DISPLAY_NAME_MAXIMUM_CHARACTERS
} from './vault-management';

const SIGN_IN_PATH = '/auth/sign-in';

type MetadataStatus = 'idle' | 'saving' | 'success' | 'error';
type NotesStatus = 'loading' | 'loaded' | 'error';
type NoteAction =
  | null
  | { readonly type: 'create' }
  | { readonly type: 'edit'; readonly noteId: string }
  | { readonly type: 'delete'; readonly noteId: string };

export interface VaultChartManagementProps {
  readonly chart: GetVaultChartApiResponse['chart'];
  readonly children: ReactNode;
  readonly onChartUpdated: (chart: VaultChartRecord) => void;
  readonly onDeleted: () => void;
}

function categoryLabel(category: VaultChartCategory): string {
  return category.charAt(0) + category.slice(1).toLowerCase();
}

function redirectToSignIn(): void {
  window.location.replace(SIGN_IN_PATH);
}

function isSameChartMetadata(
  chart: VaultChartRecord,
  displayName: string,
  category: VaultChartCategory
): boolean {
  return normalizeDisplayName(displayName) === chart.displayName && category === chart.category;
}

function noteTimestampLabel(note: ChartNoteRecord): string {
  return note.updatedAt === note.createdAt
    ? `Created ${note.createdAt}`
    : `Updated ${note.updatedAt}`;
}

export default function VaultChartManagement({
  chart,
  children,
  onChartUpdated,
  onDeleted
}: VaultChartManagementProps) {
  const [displayName, setDisplayName] = useState(chart.displayName);
  const [category, setCategory] = useState<VaultChartCategory>(chart.category);
  const [metadataStatus, setMetadataStatus] = useState<MetadataStatus>('idle');
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [notes, setNotes] = useState<readonly ChartNoteRecord[]>([]);
  const [notesStatus, setNotesStatus] = useState<NotesStatus>('loading');
  const [notesError, setNotesError] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteDraftError, setNoteDraftError] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingError, setEditingError] = useState<string | null>(null);
  const [noteAction, setNoteAction] = useState<NoteAction>(null);
  const [noteActionError, setNoteActionError] = useState<string | null>(null);
  const [notesFeedback, setNotesFeedback] = useState<string | null>(null);
  const [chartDeleteStatus, setChartDeleteStatus] = useState<'idle' | 'deleting' | 'error'>('idle');
  const [chartDeleteError, setChartDeleteError] = useState<string | null>(null);
  const metadataStatusRef = useRef<HTMLParagraphElement>(null);
  const notesStatusRef = useRef<HTMLParagraphElement>(null);
  const noteDraftRef = useRef<HTMLTextAreaElement>(null);
  const metadataTitleId = useId();
  const nameId = useId();
  const nameErrorId = useId();
  const categoryId = useId();
  const notesTitleId = useId();
  const noteDraftId = useId();
  const noteDraftErrorId = useId();
  const deleteTitleId = useId();

  useEffect(() => {
    setDisplayName(chart.displayName);
    setCategory(chart.category);
    setMetadataStatus('idle');
    setMetadataError(null);
  }, [chart.chartId]);

  useEffect(() => {
    const abortController = new AbortController();

    setNotesStatus('loading');
    setNotesError(null);
    setNotesFeedback(null);
    setEditingNoteId(null);
    setNoteAction(null);

    async function loadNotes(): Promise<void> {
      const result = await listChartNotes(chart.chartId, abortController.signal);

      if (abortController.signal.aborted) {
        return;
      }

      if (result.status === 'success') {
        setNotes(result.notes);
        setNotesStatus('loaded');
        return;
      }

      if (result.status === 'unauthorized') {
        redirectToSignIn();
        return;
      }

      setNotesStatus('error');
      setNotesError(
        result.status === 'not-found'
          ? 'This saved chart is no longer available.'
          : "We couldn't load notes for this chart. Please try again."
      );
    }

    void loadNotes();

    return () => abortController.abort();
  }, [chart.chartId]);

  useEffect(() => {
    if (metadataStatus === 'success' || metadataStatus === 'error') {
      metadataStatusRef.current?.focus();
    }
  }, [metadataStatus]);

  useEffect(() => {
    if (notesFeedback !== null) {
      notesStatusRef.current?.focus();
    }
  }, [notesFeedback]);

  const hasMetadataChanges = !isSameChartMetadata(chart, displayName, category);
  const metadataBusy = metadataStatus === 'saving';

  const handleMetadataSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const displayNameError = validateDisplayName(displayName);

    if (displayNameError !== null) {
      setMetadataError(displayNameError);
      setMetadataStatus('error');
      return;
    }

    if (!hasMetadataChanges || metadataBusy) {
      return;
    }

    const normalizedDisplayName = normalizeDisplayName(displayName);
    const request: UpdateVaultChartMetadataApiRequest = {
      ...(normalizedDisplayName !== chart.displayName
        ? { displayName: normalizedDisplayName }
        : {}),
      ...(category !== chart.category ? { category } : {})
    };

    if (Object.keys(request).length === 0) {
      return;
    }

    setMetadataStatus('saving');
    setMetadataError(null);

    const result = await updateVaultChartMetadata(chart.chartId, request);

    if (result.status === 'success') {
      setDisplayName(result.chart.displayName);
      setCategory(result.chart.category);
      setMetadataStatus('success');
      setMetadataError(null);
      onChartUpdated(result.chart);
      return;
    }

    if (result.status === 'unauthorized') {
      redirectToSignIn();
      return;
    }

    setMetadataStatus('error');
    setMetadataError(
      result.status === 'not-found'
        ? 'This saved chart is no longer available.'
        : result.status === 'invalid-request'
          ? 'Check the chart name and category, then try again.'
          : "We couldn't save these changes. Please try again."
    );
  };

  const handleMetadataCancel = () => {
    setDisplayName(chart.displayName);
    setCategory(chart.category);
    setMetadataStatus('idle');
    setMetadataError(null);
  };

  const handleCreateNote = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const contentError = validateNoteContent(noteDraft);

    if (contentError !== null) {
      setNoteDraftError(contentError);
      setNotesFeedback(null);
      return;
    }

    if (noteAction !== null) {
      return;
    }

    setNoteAction({ type: 'create' });
    setNoteDraftError(null);
    setNoteActionError(null);
    setNotesFeedback(null);

    const result = await createChartNote(chart.chartId, normalizeNoteContent(noteDraft));

    if (result.status === 'success') {
      setNotes((currentNotes) => [...currentNotes, result.note]);
      setNoteDraft('');
      setNoteAction(null);
      setNotesFeedback('Note added.');
      noteDraftRef.current?.focus();
      return;
    }

    if (result.status === 'unauthorized') {
      redirectToSignIn();
      return;
    }

    setNoteAction(null);
    setNoteActionError(
      result.status === 'not-found'
        ? 'This saved chart is no longer available.'
        : result.status === 'invalid-request'
          ? 'Check the note text, then try again.'
          : "We couldn't add the note. Please try again."
    );
  };

  const startEditingNote = (note: ChartNoteRecord) => {
    setEditingNoteId(note.noteId);
    setEditingContent(note.content);
    setEditingError(null);
    setNoteActionError(null);
    setNotesFeedback(null);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingContent('');
    setEditingError(null);
    setNoteActionError(null);
  };

  const handleEditNote = async (noteId: string) => {
    const contentError = validateNoteContent(editingContent);

    if (contentError !== null) {
      setEditingError(contentError);
      setNotesFeedback(null);
      return;
    }

    if (noteAction !== null) {
      return;
    }

    setNoteAction({ type: 'edit', noteId });
    setEditingError(null);
    setNoteActionError(null);
    setNotesFeedback(null);

    const result = await updateChartNote(
      chart.chartId,
      noteId,
      normalizeNoteContent(editingContent)
    );

    if (result.status === 'success') {
      setNotes((currentNotes) =>
        currentNotes.map((note) => (note.noteId === noteId ? result.note : note))
      );
      setEditingNoteId(null);
      setEditingContent('');
      setNoteAction(null);
      setNotesFeedback('Note updated.');
      return;
    }

    if (result.status === 'unauthorized') {
      redirectToSignIn();
      return;
    }

    setNoteAction(null);
    setNoteActionError(
      result.status === 'not-found'
        ? 'This note is no longer available.'
        : result.status === 'invalid-request'
          ? 'Check the note text, then try again.'
          : "We couldn't update the note. Please try again."
    );
  };

  const handleDeleteNote = async (note: ChartNoteRecord) => {
    if (!window.confirm('Delete this note?')) {
      return;
    }

    if (noteAction !== null) {
      return;
    }

    setNoteAction({ type: 'delete', noteId: note.noteId });
    setNoteActionError(null);
    setNotesFeedback(null);

    const result = await deleteChartNote(chart.chartId, note.noteId);

    if (result.status === 'success') {
      setNotes((currentNotes) =>
        currentNotes.filter((currentNote) => currentNote.noteId !== note.noteId)
      );
      setNoteAction(null);
      setNotesFeedback('Note deleted.');
      return;
    }

    if (result.status === 'unauthorized') {
      redirectToSignIn();
      return;
    }

    setNoteAction(null);
    setNoteActionError(
      result.status === 'not-found'
        ? 'This note is no longer available.'
        : "We couldn't delete the note. Please try again."
    );
  };

  const handleDeleteChart = async () => {
    if (
      !window.confirm(
        'Delete this saved chart? The saved chart and all associated notes will be removed.'
      )
    ) {
      return;
    }

    if (chartDeleteStatus === 'deleting') {
      return;
    }

    setChartDeleteStatus('deleting');
    setChartDeleteError(null);

    const result = await deleteVaultChart(chart.chartId);

    if (result.status === 'success') {
      onDeleted();
      return;
    }

    if (result.status === 'unauthorized') {
      redirectToSignIn();
      return;
    }

    setChartDeleteStatus('error');
    setChartDeleteError(
      result.status === 'not-found'
        ? 'This saved chart is no longer available.'
        : "We couldn't delete this chart. Please try again."
    );
  };

  return (
    <div>
      <header className="nn-surface nn-surface--elevated mb-6 p-5 sm:p-6">
        <p className="nn-badge">{chart.category}</p>
        <h2 className="nn-type-card-title mt-4 break-words">{chart.displayName}</h2>
        <time className="nn-type-metadata mt-4 block" dateTime={chart.createdAt}>
          Saved {chart.createdAt}
        </time>

        <form
          aria-labelledby={metadataTitleId}
          className="mt-6 border-t border-[color:var(--nn-border-subtle)] pt-5"
          noValidate
          onSubmit={handleMetadataSubmit}
        >
          <h3 className="nn-type-section-title" id={metadataTitleId}>
            Edit metadata
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div>
              <label className="nn-type-label" htmlFor={nameId}>
                Chart name
              </label>
              <input
                aria-describedby={metadataError ? nameErrorId : undefined}
                aria-invalid={Boolean(metadataError)}
                className="nn-field mt-2"
                disabled={metadataBusy}
                id={nameId}
                maxLength={DISPLAY_NAME_MAXIMUM_CHARACTERS}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setMetadataError(null);
                  setMetadataStatus('idle');
                }}
                required
                type="text"
                value={displayName}
              />
              {metadataError ? (
                <p
                  className="nn-status nn-status--error mt-2"
                  id={nameErrorId}
                  ref={metadataStatusRef}
                  role="alert"
                  tabIndex={-1}
                >
                  {metadataError}
                </p>
              ) : null}
            </div>

            <div>
              <label className="nn-type-label" htmlFor={categoryId}>
                Category
              </label>
              <select
                className="nn-field mt-2 appearance-auto"
                disabled={metadataBusy}
                id={categoryId}
                onChange={(event) => {
                  const nextCategory = event.target.value;

                  if (VAULT_CHART_CATEGORIES.includes(nextCategory as VaultChartCategory)) {
                    setCategory(nextCategory as VaultChartCategory);
                    setMetadataError(null);
                    setMetadataStatus('idle');
                  }
                }}
                value={category}
              >
                {VAULT_CHART_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {categoryLabel(option)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="nn-button nn-button--secondary"
              disabled={metadataBusy || !hasMetadataChanges}
              type="submit"
            >
              {metadataBusy ? 'Saving…' : 'Save changes'}
            </button>
            {hasMetadataChanges ? (
              <button
                className="nn-button nn-button--quiet"
                disabled={metadataBusy}
                onClick={handleMetadataCancel}
                type="button"
              >
                Cancel
              </button>
            ) : null}
          </div>

          {metadataStatus === 'success' ? (
            <p
              className="nn-status nn-status--success mt-3"
              ref={metadataStatusRef}
              role="status"
              tabIndex={-1}
            >
              Metadata updated.
            </p>
          ) : null}
        </form>
      </header>

      {children}

      <section
        aria-labelledby={notesTitleId}
        className="nn-surface nn-surface--elevated mt-6 p-5 sm:p-6"
      >
        <h3 className="nn-type-section-title" id={notesTitleId}>
          Notes
        </h3>
        <p className="nn-type-body-small mt-2">
          Keep private plain-text notes with this saved chart.
        </p>

        <form className="mt-5" noValidate onSubmit={handleCreateNote}>
          <label className="nn-type-label" htmlFor={noteDraftId}>
            Add a note
          </label>
          <textarea
            aria-describedby={noteDraftError ? noteDraftErrorId : undefined}
            aria-invalid={Boolean(noteDraftError)}
            className="nn-field mt-2 min-h-32 resize-y"
            disabled={noteAction !== null || notesStatus !== 'loaded'}
            id={noteDraftId}
            maxLength={CHART_NOTE_MAXIMUM_CHARACTERS}
            onChange={(event) => {
              setNoteDraft(event.target.value);
              setNoteDraftError(null);
              setNoteActionError(null);
              setNotesFeedback(null);
            }}
            value={noteDraft}
          />
          {noteDraftError ? (
            <p className="nn-status nn-status--error mt-2" id={noteDraftErrorId} role="alert">
              {noteDraftError}
            </p>
          ) : null}
          <button
            className="nn-button nn-button--secondary mt-3"
            disabled={noteAction !== null || notesStatus !== 'loaded'}
            type="submit"
          >
            {noteAction?.type === 'create' ? 'Adding…' : 'Add note'}
          </button>
        </form>

        {notesStatus === 'loading' ? (
          <p className="nn-async-state mt-5" role="status" aria-live="polite">
            Loading notes…
          </p>
        ) : null}
        {notesStatus === 'error' ? (
          <p className="nn-async-state nn-async-state--error mt-5" role="alert">
            {notesError ?? "We couldn't load notes for this chart. Please try again."}
          </p>
        ) : null}
        {notesStatus === 'loaded' && notes.length === 0 ? (
          <p className="nn-async-state nn-async-state--empty mt-5">
            No notes yet.
          </p>
        ) : null}

        {notesStatus === 'loaded' && notes.length > 0 ? (
          <ul className="mt-5 grid gap-4">
            {notes.map((note) => {
              const isEditing = editingNoteId === note.noteId;
              const isBusy = noteAction !== null;

              return (
                <li className="nn-surface min-w-0 p-4" key={note.noteId}>
                  {isEditing ? (
                    <div>
                      <label className="nn-type-label" htmlFor={`${note.noteId}-edit`}>
                        Edit note
                      </label>
                      <textarea
                        aria-describedby={editingError ? `${note.noteId}-edit-error` : undefined}
                        aria-invalid={Boolean(editingError)}
                        className="nn-field mt-2 min-h-28 resize-y"
                        disabled={isBusy}
                        id={`${note.noteId}-edit`}
                        maxLength={CHART_NOTE_MAXIMUM_CHARACTERS}
                        onChange={(event) => {
                          setEditingContent(event.target.value);
                          setEditingError(null);
                          setNoteActionError(null);
                        }}
                        value={editingContent}
                      />
                      {editingError ? (
                        <p
                          className="nn-status nn-status--error mt-2"
                          id={`${note.noteId}-edit-error`}
                          role="alert"
                        >
                          {editingError}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          className="nn-button nn-button--secondary"
                          disabled={isBusy}
                          onClick={() => void handleEditNote(note.noteId)}
                          type="button"
                        >
                          {noteAction?.type === 'edit' && noteAction.noteId === note.noteId
                            ? 'Saving…'
                            : 'Save note'}
                        </button>
                        <button
                          className="nn-button nn-button--quiet"
                          disabled={isBusy}
                          onClick={cancelEditingNote}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="break-words whitespace-pre-wrap text-sm leading-6 text-[color:var(--nn-text-primary)]">
                        {note.content}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <time className="nn-type-metadata" dateTime={note.updatedAt}>
                          {noteTimestampLabel(note)}
                        </time>
                        <button
                          className="nn-button nn-button--quiet"
                          disabled={isBusy}
                          onClick={() => startEditingNote(note)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="nn-button nn-button--quiet"
                          disabled={isBusy}
                          onClick={() => void handleDeleteNote(note)}
                          type="button"
                        >
                          {noteAction?.type === 'delete' && noteAction.noteId === note.noteId
                            ? 'Deleting…'
                            : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}

        {noteActionError ? (
          <p className="nn-status nn-status--error mt-3" role="alert">
            {noteActionError}
          </p>
        ) : null}
        {notesFeedback ? (
          <p
            className="nn-status nn-status--success mt-3"
            ref={notesStatusRef}
            role="status"
            tabIndex={-1}
          >
            {notesFeedback}
          </p>
        ) : null}
      </section>

      <section
        aria-labelledby={deleteTitleId}
        className="nn-notice nn-notice--error mt-6 flex-col items-start"
      >
        <div>
          <h3 className="nn-type-section-title" id={deleteTitleId}>
            Delete saved chart
          </h3>
          <p className="nn-type-body-small mt-2">
            This removes the saved chart and all associated notes from your Vault.
          </p>
        </div>
        <button
          className="nn-button nn-button--secondary"
          disabled={chartDeleteStatus === 'deleting'}
          onClick={() => void handleDeleteChart()}
          type="button"
        >
          {chartDeleteStatus === 'deleting' ? 'Deleting…' : 'Delete chart'}
        </button>
        {chartDeleteError ? (
          <p className="nn-status nn-status--error" role="alert">
            {chartDeleteError}
          </p>
        ) : null}
      </section>

    </div>
  );
}
