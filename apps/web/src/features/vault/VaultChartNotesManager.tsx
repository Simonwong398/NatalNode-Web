import type { SyntheticEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import type { ChartNoteRecord } from '@natalnode/contracts';
import VaultChartNoteEditor from './VaultChartNoteEditor.js';
import {
  CHART_NOTE_MAXIMUM_CHARACTERS,
  createChartNote,
  deleteChartNote,
  listChartNotes,
  normalizeNoteContent,
  updateChartNote,
  validateNoteContent
} from './vault-management.js';

const SIGN_IN_PATH = '/auth/sign-in';

type NotesStatus = 'loading' | 'loaded' | 'error';
type NoteAction =
  | null
  | { readonly type: 'create' }
  | { readonly type: 'edit'; readonly noteId: string }
  | { readonly type: 'delete'; readonly noteId: string };

interface VaultChartNotesManagerProps {
  readonly chartId: string;
}

function redirectToSignIn(): void {
  window.location.replace(SIGN_IN_PATH);
}

function noteTimestampLabel(note: ChartNoteRecord): string {
  return note.updatedAt === note.createdAt
    ? `Created ${note.createdAt}`
    : `Updated ${note.updatedAt}`;
}

export default function VaultChartNotesManager({ chartId }: VaultChartNotesManagerProps) {
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
  const notesStatusRef = useRef<HTMLParagraphElement>(null);
  const noteDraftRef = useRef<HTMLTextAreaElement>(null);
  const notesTitleId = useId();
  const noteDraftId = useId();
  const noteDraftErrorId = useId();

  useEffect(() => {
    const abortController = new AbortController();

    setNotesStatus('loading');
    setNotesError(null);
    setNotesFeedback(null);
    setEditingNoteId(null);
    setNoteAction(null);

    async function loadNotes(): Promise<void> {
      const result = await listChartNotes(chartId, abortController.signal);

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
  }, [chartId]);

  useEffect(() => {
    if (notesFeedback !== null) {
      notesStatusRef.current?.focus();
    }
  }, [notesFeedback]);

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

    const result = await createChartNote(chartId, normalizeNoteContent(noteDraft));

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
      chartId,
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

    const result = await deleteChartNote(chartId, note.noteId);

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

  return (
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
                  <VaultChartNoteEditor
                    busy={isBusy}
                    error={editingError}
                    noteId={note.noteId}
                    onCancel={cancelEditingNote}
                    onChange={(value) => {
                      setEditingContent(value);
                      setEditingError(null);
                      setNoteActionError(null);
                    }}
                    onSave={() => void handleEditNote(note.noteId)}
                    saving={noteAction?.type === 'edit' && noteAction.noteId === note.noteId}
                    value={editingContent}
                  />
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
  );
}
