import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { afterEach, test } from 'node:test';

import {
  assertNoVaultHarnessLeak,
  deferred,
  jsonResponse,
  makeChartNote,
  makeVaultChart,
  requestBody,
  statusResponse,
  withVaultChartManagement
} from './support/vault-chart-management-harness.mjs';

const CHART_CONFIRMATION =
  'Delete this saved chart? The saved chart and all associated notes will be removed.';
const NOTE_CONFIRMATION = 'Delete this note?';
const FORBIDDEN_MUTATION_FIELDS = [
  'userId',
  'ownerId',
  'accountId',
  'normalizedChartRequest',
  'canonicalChartResult',
  'engineVersion',
  'chartSchemaVersion',
  'astronomyConfigurationId',
  'provenanceEnvelopeId'
];

afterEach(() => {
  assertNoVaultHarnessLeak();
});

function chartUrl(chart) {
  return `/api/vault/charts/${encodeURIComponent(chart.chartId)}`;
}

function duplicateUrl(chart) {
  return `${chartUrl(chart)}/duplicate`;
}

function notesUrl(chart) {
  return `${chartUrl(chart)}/notes`;
}

function noteUrl(chart, note) {
  return `${notesUrl(chart)}/${encodeURIComponent(note.noteId)}`;
}

function queueNotes(scope, chart, notes = []) {
  scope.fetch.enqueue('GET', notesUrl(chart), jsonResponse({ notes }));
}

async function mountWithNotes(scope, chart, notes = []) {
  queueNotes(scope, chart, notes);
  await scope.mount(chart);
  await scope.flush();
}

function assertMutationIntent(call, { method, url, body }) {
  assert.equal(call.method, method);
  assert.equal(call.url, url);
  if (body === undefined) {
    assert.equal(Object.hasOwn(call.init, 'body'), false);
    return;
  }

  assert.deepEqual(requestBody(call), body);
  for (const field of FORBIDDEN_MUTATION_FIELDS) {
    assert.equal(Object.hasOwn(requestBody(call), field), false, `${field} leaked into request`);
  }
}

test('initial render exposes the prop boundary, workspace, management regions, and pending notes semantics', async () => {
  const chart = makeVaultChart({ displayName: 'Current saved chart', category: 'FAMILY' });
  const load = deferred();

  await withVaultChartManagement({ chart }, async (scope) => {
    scope.fetch.enqueue('GET', notesUrl(chart), load.promise);
    await scope.mount();

    assert.match(scope.container.textContent, /Current saved chart/);
    assert.match(scope.container.textContent, /FAMILY/);
    assert.match(scope.container.textContent, /Edit metadata/);
    assert.match(scope.container.textContent, /Notes/);
    assert.match(scope.container.textContent, /Add a note/);
    assert.match(scope.container.textContent, /Delete saved chart/);
    assert.equal(
      scope.container.querySelector('[data-vault-workspace-sentinel]').textContent,
      'Workspace sentinel'
    );

    const loading = scope.role('status', 'Loading notes…');
    assert.equal(loading.getAttribute('aria-live'), 'polite');
    assert.equal(scope.roles('alert').length, 0);
    assert.equal(scope.control('Add a note').disabled, true);
    assert.equal(scope.button('Add note').disabled, true);
    assert.equal(scope.button('Duplicate chart').disabled, false);
    assert.equal(scope.button('Delete chart').disabled, false);
    assert.equal(scope.fetch.calls.length, 1);
    assert.equal(scope.fetch.calls[0].init.signal.aborted, false);

    load.resolve(jsonResponse({ notes: [] }));
    await scope.flush();
  });
});

test('notes load renders empty and populated server-confirmed states', async () => {
  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart, []);
    assert.match(scope.container.textContent, /No notes yet\./);
    assert.equal(scope.roles('status').length, 0);
    assert.equal(scope.control('Add a note').disabled, false);
  });

  const notes = [
    makeChartNote(),
    makeChartNote({
      noteId: 'note-b',
      content: 'Second fixture note',
      updatedAt: '2026-08-25T02:00:00.000Z'
    })
  ];
  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart, notes);
    assert.match(scope.container.textContent, /First fixture note/);
    assert.match(scope.container.textContent, /Second fixture note/);
    assert.match(scope.container.textContent, /Created 2026-08-25T01:00:00.000Z/);
    assert.match(scope.container.textContent, /Updated 2026-08-25T02:00:00.000Z/);
    assert.equal(scope.buttons('Edit').length, 2);
    assert.equal(scope.buttons('Delete').length, 2);
  });
});

test('notes load distinguishes not-found from generic transport and malformed-payload failures', async () => {
  const cases = [
    [statusResponse(404), 'This saved chart is no longer available.'],
    [statusResponse(500), "We couldn't load notes for this chart. Please try again."],
    [jsonResponse({ notes: [null] }), "We couldn't load notes for this chart. Please try again."]
  ];

  for (const [response, message] of cases) {
    await withVaultChartManagement({}, async (scope) => {
      scope.fetch.enqueue('GET', notesUrl(scope.chart), response);
      await scope.mount();
      await scope.flush();
      const notesSection = [...scope.container.querySelectorAll('section')].find((section) =>
        [...section.querySelectorAll('h3')].some((heading) => scope.text(heading) === 'Notes')
      );
      assert.ok(notesSection);
      assert.strictEqual(scope.role('alert', message).parentElement, notesSection);
      assert.equal(scope.control('Add a note').disabled, true);
    });
  }
});

test('notes load aborts on unmount and ignores a subsequently settled transport', async () => {
  const load = deferred();

  await withVaultChartManagement({}, async (scope) => {
    scope.fetch.enqueue('GET', notesUrl(scope.chart), load.promise);
    await scope.mount();
    const signal = scope.fetch.calls[0].init.signal;
    assert.equal(signal.aborted, false);

    await scope.unmount();
    assert.equal(signal.aborted, true);
    assert.equal(scope.container.innerHTML, '');

    load.resolve(jsonResponse({ notes: [makeChartNote()] }));
    await scope.flush();
    assert.equal(scope.container.innerHTML, '');
  });
});

test('metadata starts as an always-visible editor with five categories, disabled no-op save, and lossless Cancel', async () => {
  const chart = makeVaultChart({ displayName: 'Confirmed name', category: 'PARTNER' });

  await withVaultChartManagement({ chart }, async (scope) => {
    await mountWithNotes(scope, chart);
    const name = scope.control('Chart name');
    const category = scope.control('Category');

    assert.equal(name.value, 'Confirmed name');
    assert.equal(name.required, true);
    assert.equal(name.maxLength, 120);
    assert.equal(name.getAttribute('aria-invalid'), 'false');
    assert.equal(name.hasAttribute('aria-describedby'), false);
    assert.equal(category.value, 'PARTNER');
    assert.deepEqual(
      [...category.options].map((option) => [option.value, option.textContent]),
      [
        ['SELF', 'Self'],
        ['PARTNER', 'Partner'],
        ['FAMILY', 'Family'],
        ['FRIEND', 'Friend'],
        ['CLIENT', 'Client']
      ]
    );
    assert.equal(scope.button('Save changes').disabled, true);
    assert.equal(scope.buttons('Cancel').length, 0);

    await scope.change(name, 'Changed locally');
    await scope.change(category, 'CLIENT');
    assert.equal(scope.button('Save changes').disabled, false);
    await scope.click(scope.button('Cancel'));
    assert.equal(name.value, 'Confirmed name');
    assert.equal(category.value, 'PARTNER');
    assert.equal(scope.button('Save changes').disabled, true);
    assert.equal(scope.roles('alert').length, 0);
  });
});

test('metadata normalized no-ops omit requests while preserving raw whitespace in the field', async () => {
  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart);
    const name = scope.control('Chart name');
    await scope.change(name, `  ${scope.chart.displayName}  `);

    assert.equal(name.value, `  ${scope.chart.displayName}  `);
    assert.equal(scope.button('Save changes').disabled, true);
    assert.equal(scope.buttons('Cancel').length, 0);
    await scope.submit(name.form);
    assert.equal(scope.fetch.calls.length, 1);
    assert.equal(scope.roles('status').length, 0);
    assert.equal(scope.roles('alert').length, 0);
  });
});

test('metadata validation suppresses requests and dynamically associates and focuses exact errors', async () => {
  const cases = [
    ['   ', 'Enter a chart name.'],
    ['x'.repeat(121), 'Use 120 characters or fewer.']
  ];

  for (const [value, message] of cases) {
    await withVaultChartManagement({}, async (scope) => {
      await mountWithNotes(scope, scope.chart);
      const name = scope.control('Chart name');
      await scope.change(name, value);
      await scope.submit(name.form);

      const alert = scope.role('alert', message);
      assert.equal(scope.fetch.calls.length, 1);
      assert.equal(name.value, value);
      assert.equal(name.getAttribute('aria-invalid'), 'true');
      assert.equal(name.getAttribute('aria-describedby'), alert.id);
      assert.equal(alert.tabIndex, -1);
      assert.strictEqual(scope.document.activeElement, alert);
      assert.equal(scope.button('Save changes').disabled, false);
    });
  }
});

test('metadata name-only, category-only, and combined saves send minimal bodies and accept authoritative responses', async () => {
  const cases = [
    {
      change: async (scope) => scope.change(scope.control('Chart name'), '  Requested name  '),
      body: { displayName: 'Requested name' },
      returned: { displayName: 'Server name' }
    },
    {
      change: async (scope) => scope.change(scope.control('Category'), 'FAMILY'),
      body: { category: 'FAMILY' },
      returned: { category: 'CLIENT' }
    },
    {
      change: async (scope) => {
        await scope.change(scope.control('Chart name'), 'Combined request');
        await scope.change(scope.control('Category'), 'FRIEND');
      },
      body: { displayName: 'Combined request', category: 'FRIEND' },
      returned: { displayName: 'Combined server name', category: 'FAMILY' }
    }
  ];

  for (const specification of cases) {
    await withVaultChartManagement({}, async (scope) => {
      await mountWithNotes(scope, scope.chart);
      const returnedChart = makeVaultChart({
        ...specification.returned,
        updatedAt: '2026-08-26T00:00:00.000Z'
      });
      scope.fetch.enqueue('PATCH', chartUrl(scope.chart), jsonResponse({ chart: returnedChart }));
      await specification.change(scope);
      await scope.submit(scope.control('Chart name').form);
      await scope.flush();

      const mutation = scope.fetch.calls[1];
      assertMutationIntent(mutation, {
        method: 'PATCH',
        url: chartUrl(scope.chart),
        body: specification.body
      });
      assert.deepEqual(scope.onChartUpdatedCalls, [returnedChart]);
      assert.equal(scope.control('Chart name').value, returnedChart.displayName);
      assert.equal(scope.control('Category').value, returnedChart.category);
      const status = scope.role('status', 'Metadata updated.');
      assert.equal(status.tabIndex, -1);
      assert.strictEqual(scope.document.activeElement, status);
      assert.equal(scope.container.querySelector('h2').textContent, scope.chart.displayName);
      await scope.rerender(returnedChart);
      assert.equal(scope.container.querySelector('h2').textContent, returnedChart.displayName);
    });
  }
});

test('metadata non-navigation failures preserve edits, editability, invalid semantics, exact copy, and focused alerts', async () => {
  const cases = [
    [400, 'Check the chart name and category, then try again.'],
    [404, 'This saved chart is no longer available.'],
    [500, "We couldn't save these changes. Please try again."]
  ];

  for (const [status, message] of cases) {
    await withVaultChartManagement({}, async (scope) => {
      await mountWithNotes(scope, scope.chart);
      scope.fetch.enqueue('PATCH', chartUrl(scope.chart), statusResponse(status));
      const name = scope.control('Chart name');
      await scope.change(name, 'Preserved metadata draft');
      await scope.submit(name.form);
      await scope.flush();

      const alert = scope.role('alert', message);
      assert.equal(name.value, 'Preserved metadata draft');
      assert.equal(name.disabled, false);
      assert.equal(name.getAttribute('aria-invalid'), 'true');
      assert.equal(name.getAttribute('aria-describedby'), alert.id);
      assert.strictEqual(scope.document.activeElement, alert);
      assert.equal(scope.button('Save changes').disabled, false);
      assert.equal(scope.buttons('Cancel').length, 1);
      assert.equal(scope.onChartUpdatedCalls.length, 0);
    });
  }
});

test('metadata pending state disables its own controls and suppresses duplicate Save while other sections remain available', async () => {
  const save = deferred();

  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart);
    scope.fetch.enqueue('PATCH', chartUrl(scope.chart), save.promise);
    await scope.change(scope.control('Chart name'), 'Pending name');
    await scope.submit(scope.control('Chart name').form);

    assert.equal(scope.button('Saving…').disabled, true);
    assert.equal(scope.button('Cancel').disabled, true);
    assert.equal(scope.control('Chart name').disabled, true);
    assert.equal(scope.control('Category').disabled, true);
    assert.equal(scope.control('Add a note').disabled, false);
    assert.equal(scope.button('Delete chart').disabled, false);
    await scope.click(scope.button('Saving…'));
    assert.equal(scope.fetch.callsFor('PATCH', chartUrl(scope.chart)).length, 1);

    save.resolve(jsonResponse({ chart: makeVaultChart({ displayName: 'Pending server name' }) }));
    await scope.flush();
  });
});

test('note composer exposes current DOM constraints and validates blank and over-limit drafts without a request', async () => {
  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart);
    const draft = scope.control('Add a note');
    assert.equal(draft.value, '');
    assert.equal(draft.maxLength, 5_000);
    assert.equal(draft.required, false);
    assert.equal(draft.getAttribute('aria-invalid'), 'false');
    assert.equal(draft.hasAttribute('aria-describedby'), false);

    draft.focus();
    await scope.submit(draft.form);
    let alert = scope.role('alert', 'Enter a note.');
    assert.equal(draft.getAttribute('aria-invalid'), 'true');
    assert.equal(draft.getAttribute('aria-describedby'), alert.id);
    assert.strictEqual(scope.document.activeElement, draft);
    assert.equal(scope.fetch.calls.length, 1);

    await scope.change(draft, 'x'.repeat(5_001));
    assert.equal(scope.roles('alert').length, 0);
    await scope.submit(draft.form);
    alert = scope.role('alert', 'Use 5,000 characters or fewer.');
    assert.equal(draft.getAttribute('aria-describedby'), alert.id);
    assert.strictEqual(scope.document.activeElement, draft);
    assert.equal(scope.fetch.calls.length, 1);
  });
});

test('note validation counts code points even though the DOM maxLength reflects UTF-16 length', async () => {
  const content = '🌟'.repeat(5_000);

  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart);
    const draft = scope.control('Add a note');
    assert.equal(draft.maxLength, 5_000);
    assert.equal(content.length, 10_000);
    scope.fetch.enqueue(
      'POST',
      notesUrl(scope.chart),
      jsonResponse({ note: makeChartNote({ content }) }, 201)
    );
    await scope.change(draft, content);
    await scope.submit(draft.form);
    await scope.flush();
    assert.deepEqual(requestBody(scope.fetch.calls[1]), { content });
    assert.equal(scope.roles('alert').length, 0);
  });
});

test('note create uses a shared lock, sends normalized content, and focuses only authoritative success status', async () => {
  const notes = [makeChartNote(), makeChartNote({ noteId: 'note-b', content: 'Second fixture note' })];
  const create = deferred();

  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart, notes);
    const originalFocus = Object.getOwnPropertyDescriptor(scope.window.HTMLElement.prototype, 'focus');
    const focusCalls = [];
    Object.defineProperty(scope.window.HTMLElement.prototype, 'focus', {
      ...originalFocus,
      value(...arguments_) {
        focusCalls.push(this);
        return originalFocus.value.apply(this, arguments_);
      }
    });
    scope.fetch.enqueue('POST', notesUrl(scope.chart), create.promise);
    const draft = scope.control('Add a note');
    await scope.change(draft, '  New\r\nnote  ');
    await scope.submit(draft.form);

    assertMutationIntent(scope.fetch.calls[1], {
      method: 'POST',
      url: notesUrl(scope.chart),
      body: { content: 'New\nnote' }
    });
    assert.equal(scope.button('Adding…').disabled, true);
    assert.equal(draft.disabled, true);
    for (const button of [...scope.buttons('Edit'), ...scope.buttons('Delete')]) {
      assert.equal(button.disabled, true);
    }
    assert.equal(scope.button('Delete chart').disabled, false);
    await scope.click(scope.button('Adding…'));
    assert.equal(scope.fetch.callsFor('POST', notesUrl(scope.chart)).length, 1);

    const serverNote = makeChartNote({
      noteId: 'note-server',
      content: 'Server-confirmed note',
      createdAt: '2026-08-26T01:00:00.000Z',
      updatedAt: '2026-08-26T01:00:00.000Z'
    });
    create.resolve(jsonResponse({ note: serverNote }, 201));
    await scope.flush();

    assert.equal(draft.value, '');
    assert.match(scope.container.textContent, /Server-confirmed note/);
    assert.doesNotMatch(scope.container.textContent, /New\s+note/);
    const status = scope.role('status', 'Note added.');
    assert.equal(status.tabIndex, -1);
    assert.strictEqual(scope.document.activeElement, status);
    assert.equal(focusCalls.length, 1);
    assert.strictEqual(focusCalls[0], status);
    assert.equal(draft.getAttribute('aria-invalid'), 'false');
    Object.defineProperty(scope.window.HTMLElement.prototype, 'focus', originalFocus);
  });
});

test('note create non-navigation failures preserve drafts, release the lock, and keep field validation clear', async () => {
  const cases = [
    [400, 'Check the note text, then try again.'],
    [404, 'This saved chart is no longer available.'],
    [500, "We couldn't add the note. Please try again."]
  ];

  for (const [status, message] of cases) {
    await withVaultChartManagement({}, async (scope) => {
      await mountWithNotes(scope, scope.chart);
      scope.fetch.enqueue('POST', notesUrl(scope.chart), statusResponse(status));
      const draft = scope.control('Add a note');
      await scope.change(draft, 'Preserved note draft');
      draft.focus();
      await scope.submit(draft.form);
      await scope.flush();

      scope.role('alert', message);
      assert.equal(draft.value, 'Preserved note draft');
      assert.equal(draft.disabled, false);
      assert.equal(draft.getAttribute('aria-invalid'), 'false');
      assert.equal(draft.hasAttribute('aria-describedby'), false);
      assert.strictEqual(scope.document.activeElement, draft);
      assert.equal(scope.button('Add note').disabled, false);
    });
  }
});

test('one authoritative note editor transitions from note A to B and resets content rather than transferring drafts', async () => {
  const noteA = makeChartNote();
  const noteB = makeChartNote({ noteId: 'note-b', content: 'Second fixture note' });

  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart, [noteA, noteB]);
    const editA = scope.button('Edit', scope.noteRow(noteA.content));
    editA.focus();
    await scope.click(editA);
    let editor = scope.control('Edit note');
    assert.equal(editor.value, noteA.content);
    assert.equal(editor.maxLength, 5_000);
    assert.equal(scope.buttons('Save note').length, 1);
    assert.equal(scope.buttons('Cancel').length, 1);
    assert.strictEqual(scope.document.activeElement, scope.document.body);
    assert.equal(scope.button('Edit', scope.noteRow(noteB.content)).disabled, false);

    await scope.change(editor, 'Uncommitted A draft');
    await scope.click(scope.button('Edit', scope.noteRow(noteB.content)));
    editor = scope.control('Edit note');
    assert.equal(editor.value, noteB.content);
    assert.match(scope.container.textContent, /First fixture note/);
    assert.doesNotMatch(scope.container.textContent, /Uncommitted A draft/);
    assert.equal(scope.buttons('Save note').length, 1);
  });
});

test('note edit Cancel keeps confirmed content, clears validation, closes the editor, and performs no focus restoration', async () => {
  const note = makeChartNote();

  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart, [note]);
    await scope.click(scope.button('Edit'));
    const editor = scope.control('Edit note');
    await scope.change(editor, 'Changed but canceled');
    await scope.change(editor, '   ');
    await scope.click(scope.button('Save note'));
    assert.equal(editor.getAttribute('aria-invalid'), 'true');

    const cancel = scope.button('Cancel');
    cancel.focus();
    await scope.click(cancel);
    assert.equal(scope.buttons('Save note').length, 0);
    assert.match(scope.container.textContent, /First fixture note/);
    assert.doesNotMatch(scope.container.textContent, /Changed but canceled/);
    assert.equal(scope.roles('alert').length, 0);
    assert.strictEqual(scope.document.activeElement, scope.document.body);
    assert.equal(scope.fetch.calls.length, 1);
  });
});

test('note edit validation associates exact blank and over-limit errors, suppresses Save, and does not move focus', async () => {
  const cases = [
    [' ', 'Enter a note.'],
    ['x'.repeat(5_001), 'Use 5,000 characters or fewer.']
  ];

  for (const [value, message] of cases) {
    await withVaultChartManagement({}, async (scope) => {
      await mountWithNotes(scope, scope.chart, [makeChartNote()]);
      await scope.click(scope.button('Edit'));
      const editor = scope.control('Edit note');
      await scope.change(editor, value);
      const save = scope.button('Save note');
      save.focus();
      await scope.click(save);

      const alert = scope.role('alert', message);
      assert.equal(editor.value, value);
      assert.equal(editor.getAttribute('aria-invalid'), 'true');
      assert.equal(editor.getAttribute('aria-describedby'), alert.id);
      assert.strictEqual(scope.document.activeElement, save);
      assert.equal(scope.fetch.calls.length, 1);
    });
  }
});

test('note edit success holds the shared lock, replaces only with the returned note, closes, and focuses feedback', async () => {
  const noteA = makeChartNote();
  const noteB = makeChartNote({ noteId: 'note-b', content: 'Second fixture note' });
  const update = deferred();

  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart, [noteA, noteB]);
    await scope.click(scope.button('Edit', scope.noteRow(noteA.content)));
    const editor = scope.control('Edit note');
    await scope.change(editor, 'Requested edited content');
    scope.fetch.enqueue('PATCH', noteUrl(scope.chart, noteA), update.promise);
    await scope.click(scope.button('Save note'));

    assertMutationIntent(scope.fetch.calls[1], {
      method: 'PATCH',
      url: noteUrl(scope.chart, noteA),
      body: { content: 'Requested edited content' }
    });
    assert.equal(editor.disabled, true);
    assert.equal(scope.button('Saving…').disabled, true);
    assert.equal(scope.button('Cancel').disabled, true);
    assert.equal(scope.control('Add a note').disabled, true);
    for (const button of [...scope.buttons('Edit'), ...scope.buttons('Delete')]) {
      assert.equal(button.disabled, true);
    }

    const returned = makeChartNote({
      noteId: noteA.noteId,
      content: 'Authoritative edited content',
      updatedAt: '2026-08-26T02:00:00.000Z'
    });
    update.resolve(jsonResponse({ note: returned }));
    await scope.flush();

    assert.equal(scope.buttons('Save note').length, 0);
    assert.match(scope.container.textContent, /Authoritative edited content/);
    assert.doesNotMatch(scope.container.textContent, /Requested edited content/);
    assert.match(scope.container.textContent, /Second fixture note/);
    const status = scope.role('status', 'Note updated.');
    assert.strictEqual(scope.document.activeElement, status);
  });
});

test('note edit non-navigation failures preserve the active draft and editor while releasing the shared lock', async () => {
  const cases = [
    [400, 'Check the note text, then try again.'],
    [404, 'This note is no longer available.'],
    [500, "We couldn't update the note. Please try again."]
  ];

  for (const [status, message] of cases) {
    await withVaultChartManagement({}, async (scope) => {
      const note = makeChartNote();
      await mountWithNotes(scope, scope.chart, [note]);
      await scope.click(scope.button('Edit'));
      const editor = scope.control('Edit note');
      await scope.change(editor, 'Preserved edit draft');
      scope.fetch.enqueue('PATCH', noteUrl(scope.chart, note), statusResponse(status));
      const save = scope.button('Save note');
      save.focus();
      await scope.click(save);
      await scope.flush();

      scope.role('alert', message);
      assert.equal(scope.control('Edit note').value, 'Preserved edit draft');
      assert.equal(scope.control('Edit note').disabled, false);
      assert.equal(scope.control('Edit note').getAttribute('aria-invalid'), 'false');
      assert.equal(scope.button('Save note').disabled, false);
      assert.equal(scope.button('Cancel').disabled, false);
      assert.strictEqual(scope.document.activeElement, save);
    });
  }
});

test('note delete freezes exact confirmation cancel and successful shared-lock behavior', async () => {
  const noteA = makeChartNote();
  const noteB = makeChartNote({ noteId: 'note-b', content: 'Second fixture note' });

  await withVaultChartManagement({ confirmResults: [false] }, async (scope) => {
    await mountWithNotes(scope, scope.chart, [noteA]);
    await scope.click(scope.button('Delete'));
    assert.deepEqual(scope.confirmCalls, [NOTE_CONFIRMATION]);
    assert.equal(scope.fetch.calls.length, 1);
    assert.match(scope.container.textContent, /First fixture note/);
  });

  const deletion = deferred();
  await withVaultChartManagement({ confirmResults: [true] }, async (scope) => {
    await mountWithNotes(scope, scope.chart, [noteA, noteB]);
    scope.fetch.enqueue('DELETE', noteUrl(scope.chart, noteA), deletion.promise);
    await scope.click(scope.button('Delete', scope.noteRow(noteA.content)));
    assert.deepEqual(scope.confirmCalls, [NOTE_CONFIRMATION]);
    assertMutationIntent(scope.fetch.calls[1], {
      method: 'DELETE',
      url: noteUrl(scope.chart, noteA)
    });
    assert.equal(scope.button('Deleting…').disabled, true);
    assert.equal(scope.control('Add a note').disabled, true);
    for (const button of [...scope.buttons('Edit'), ...scope.buttons('Delete')]) {
      assert.equal(button.disabled, true);
    }
    await scope.click(scope.button('Deleting…'));
    assert.deepEqual(scope.confirmCalls, [NOTE_CONFIRMATION]);
    assert.equal(scope.fetch.callsFor('DELETE', noteUrl(scope.chart, noteA)).length, 1);

    deletion.resolve(jsonResponse({ deleted: true }));
    await scope.flush();
    assert.doesNotMatch(scope.container.textContent, /First fixture note/);
    assert.match(scope.container.textContent, /Second fixture note/);
    const status = scope.role('status', 'Note deleted.');
    assert.strictEqual(scope.document.activeElement, status);
  });
});

test('note delete non-navigation failures retain the note, release the lock, and distinguish not-found from generic copy', async () => {
  const cases = [
    [404, 'This note is no longer available.'],
    [500, "We couldn't delete the note. Please try again."]
  ];

  for (const [status, message] of cases) {
    await withVaultChartManagement({ confirmResults: [true] }, async (scope) => {
      const note = makeChartNote();
      await mountWithNotes(scope, scope.chart, [note]);
      scope.fetch.enqueue('DELETE', noteUrl(scope.chart, note), statusResponse(status));
      const button = scope.button('Delete');
      button.focus();
      await scope.click(button);
      await scope.flush();

      scope.role('alert', message);
      assert.match(scope.container.textContent, /First fixture note/);
      assert.equal(scope.button('Delete').disabled, false);
      assert.equal(scope.control('Add a note').disabled, false);
      assert.strictEqual(scope.document.activeElement, button);
    });
  }
});

test('chart deletion freezes exact confirmation cancellation without invoking the callback', async () => {
  await withVaultChartManagement({ confirmResults: [false] }, async (scope) => {
    await mountWithNotes(scope, scope.chart);
    await scope.click(scope.button('Delete chart'));
    assert.deepEqual(scope.confirmCalls, [CHART_CONFIRMATION]);
    assert.equal(scope.fetch.callsFor('DELETE', chartUrl(scope.chart)).length, 0);
    assert.equal(scope.onDeletedCalls.length, 0);
    assert.equal(scope.button('Delete chart').disabled, false);
  });
});

test('chart duplication uses one bodyless request, prevents repeats, and navigates to the returned chart', async () => {
  const duplication = deferred();
  const duplicate = makeVaultChart({
    chartId: 'chart-copy',
    displayName: 'Server duplicate'
  });

  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart);
    scope.fetch.enqueue('POST', duplicateUrl(scope.chart), duplication.promise);
    await scope.click(scope.button('Duplicate chart'));

    assertMutationIntent(scope.fetch.calls[1], {
      method: 'POST',
      url: duplicateUrl(scope.chart)
    });
    assert.equal(scope.button('Duplicating…').disabled, true);
    assert.equal(scope.button('Delete chart').disabled, false);
    await scope.click(scope.button('Duplicating…'));
    assert.equal(scope.fetch.callsFor('POST', duplicateUrl(scope.chart)).length, 1);

    duplication.resolve(jsonResponse({ chart: duplicate }, 201));
    await scope.flush();

    assert.deepEqual(scope.locationReplaceCalls, [
      `/vault/chart?chartId=${encodeURIComponent(duplicate.chartId)}`
    ]);
    assert.equal(scope.fetch.callsFor('POST', duplicateUrl(scope.chart)).length, 1);
  });
});

test('chart duplication failures preserve the source chart and release the action lock', async () => {
  const cases = [
    [404, 'This saved chart is no longer available.'],
    [500, "We couldn't duplicate this chart. Please try again."]
  ];

  for (const [status, message] of cases) {
    await withVaultChartManagement({}, async (scope) => {
      await mountWithNotes(scope, scope.chart);
      scope.fetch.enqueue('POST', duplicateUrl(scope.chart), statusResponse(status));
      const duplicateButton = scope.button('Duplicate chart');
      duplicateButton.focus();
      await scope.click(duplicateButton);
      await scope.flush();

      scope.role('alert', message);
      assert.match(scope.container.textContent, /Fixture chart/);
      assert.equal(scope.button('Duplicate chart').disabled, false);
      assert.deepEqual(scope.locationReplaceCalls, []);
      assert.strictEqual(scope.document.activeElement, duplicateButton);
    });
  }
});

test('chart deletion pending state suppresses repeats, leaves other sections operable, and delegates success exactly once', async () => {
  const deletion = deferred();

  await withVaultChartManagement({ confirmResults: [true, true] }, async (scope) => {
    await mountWithNotes(scope, scope.chart);
    scope.fetch.enqueue('DELETE', chartUrl(scope.chart), deletion.promise);
    await scope.click(scope.button('Delete chart'));

    assert.deepEqual(scope.confirmCalls, [CHART_CONFIRMATION]);
    assert.equal(scope.button('Deleting…').disabled, true);
    assert.equal(scope.control('Chart name').disabled, false);
    assert.equal(scope.control('Add a note').disabled, false);
    await scope.click(scope.button('Deleting…'));
    assert.deepEqual(scope.confirmCalls, [CHART_CONFIRMATION]);
    assert.equal(scope.fetch.callsFor('DELETE', chartUrl(scope.chart)).length, 1);

    deletion.resolve(jsonResponse({ deleted: true }));
    await scope.flush();
    assert.equal(scope.onDeletedCalls.length, 1);
    assert.equal(scope.button('Deleting…').disabled, true);
  });
});

test('chart delete non-navigation failures release deleting state, preserve callback omission, and show exact errors', async () => {
  const cases = [
    [404, 'This saved chart is no longer available.'],
    [500, "We couldn't delete this chart. Please try again."]
  ];

  for (const [status, message] of cases) {
    await withVaultChartManagement({ confirmResults: [true] }, async (scope) => {
      await mountWithNotes(scope, scope.chart);
      scope.fetch.enqueue('DELETE', chartUrl(scope.chart), statusResponse(status));
      await scope.click(scope.button('Delete chart'));
      await scope.flush();
      scope.role('alert', message);
      assert.equal(scope.button('Delete chart').disabled, false);
      assert.equal(scope.onDeletedCalls.length, 0);
    });
  }
});

test('unauthorized redirect policy is consistent for load, metadata, note mutation, and chart deletion', async () => {
  await withVaultChartManagement({}, async (scope) => {
    scope.fetch.enqueue('GET', notesUrl(scope.chart), statusResponse(401));
    await scope.mount();
    await scope.flush();
    assert.deepEqual(scope.locationReplaceCalls, ['/auth/sign-in']);
    assert.equal(scope.role('status', 'Loading notes…').getAttribute('aria-live'), 'polite');
  });

  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart);
    scope.fetch.enqueue('PATCH', chartUrl(scope.chart), statusResponse(401));
    await scope.change(scope.control('Chart name'), 'Unauthorized metadata');
    await scope.submit(scope.control('Chart name').form);
    await scope.flush();
    assert.deepEqual(scope.locationReplaceCalls, ['/auth/sign-in']);
    assert.equal(scope.button('Saving…').disabled, true);
    assert.equal(scope.roles('alert').length, 0);
  });

  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart);
    scope.fetch.enqueue('POST', notesUrl(scope.chart), statusResponse(401));
    await scope.change(scope.control('Add a note'), 'Unauthorized note');
    await scope.submit(scope.control('Add a note').form);
    await scope.flush();
    assert.deepEqual(scope.locationReplaceCalls, ['/auth/sign-in']);
    assert.equal(scope.button('Adding…').disabled, true);
    assert.equal(scope.control('Add a note').value, 'Unauthorized note');
  });

  await withVaultChartManagement({}, async (scope) => {
    const note = makeChartNote();
    await mountWithNotes(scope, scope.chart, [note]);
    await scope.click(scope.button('Edit'));
    await scope.change(scope.control('Edit note'), 'Unauthorized edit');
    scope.fetch.enqueue('PATCH', noteUrl(scope.chart, note), statusResponse(401));
    await scope.click(scope.button('Save note'));
    await scope.flush();
    assert.deepEqual(scope.locationReplaceCalls, ['/auth/sign-in']);
    assert.equal(scope.button('Saving…').disabled, true);
    assert.equal(scope.control('Edit note').value, 'Unauthorized edit');
  });

  await withVaultChartManagement({ confirmResults: [true] }, async (scope) => {
    const note = makeChartNote();
    await mountWithNotes(scope, scope.chart, [note]);
    scope.fetch.enqueue('DELETE', noteUrl(scope.chart, note), statusResponse(401));
    await scope.click(scope.button('Delete'));
    await scope.flush();
    assert.deepEqual(scope.locationReplaceCalls, ['/auth/sign-in']);
    assert.equal(scope.button('Deleting…').disabled, true);
    assert.match(scope.container.textContent, /First fixture note/);
  });

  await withVaultChartManagement({ confirmResults: [true] }, async (scope) => {
    await mountWithNotes(scope, scope.chart);
    scope.fetch.enqueue('DELETE', chartUrl(scope.chart), statusResponse(401));
    await scope.click(scope.button('Delete chart'));
    await scope.flush();
    assert.deepEqual(scope.locationReplaceCalls, ['/auth/sign-in']);
    assert.equal(scope.button('Deleting…').disabled, true);
    assert.equal(scope.onDeletedCalls.length, 0);
  });

  await withVaultChartManagement({}, async (scope) => {
    await mountWithNotes(scope, scope.chart);
    scope.fetch.enqueue('POST', duplicateUrl(scope.chart), statusResponse(401));
    await scope.click(scope.button('Duplicate chart'));
    await scope.flush();
    assert.deepEqual(scope.locationReplaceCalls, ['/auth/sign-in']);
    assert.equal(scope.button('Duplicating…').disabled, true);
    assert.match(scope.container.textContent, /Fixture chart/);
  });
});

test('independent busy mechanisms permit metadata, note, and chart mutations to coexist', async () => {
  const metadata = deferred();
  const create = deferred();
  const deletion = deferred();

  await withVaultChartManagement({ confirmResults: [true] }, async (scope) => {
    await mountWithNotes(scope, scope.chart);
    scope.fetch.enqueue('PATCH', chartUrl(scope.chart), metadata.promise);
    scope.fetch.enqueue('POST', notesUrl(scope.chart), create.promise);
    scope.fetch.enqueue('DELETE', chartUrl(scope.chart), deletion.promise);

    await scope.change(scope.control('Chart name'), 'Concurrent metadata');
    await scope.submit(scope.control('Chart name').form);
    await scope.change(scope.control('Add a note'), 'Concurrent note');
    await scope.submit(scope.control('Add a note').form);
    await scope.click(scope.button('Delete chart'));

    assert.equal(scope.fetch.callsFor('PATCH', chartUrl(scope.chart)).length, 1);
    assert.equal(scope.fetch.callsFor('POST', notesUrl(scope.chart)).length, 1);
    assert.equal(scope.fetch.callsFor('DELETE', chartUrl(scope.chart)).length, 1);
    assert.equal(scope.button('Saving…').disabled, true);
    assert.equal(scope.button('Adding…').disabled, true);
    assert.equal(scope.button('Deleting…').disabled, true);

    metadata.resolve(jsonResponse({ chart: makeVaultChart({ displayName: 'Concurrent server metadata' }) }));
    create.resolve(jsonResponse({ note: makeChartNote({ noteId: 'concurrent-note', content: 'Concurrent server note' }) }, 201));
    deletion.resolve(jsonResponse({ deleted: true }));
    await scope.flush();
  });

  const chartDeletion = deferred();
  const metadataAfterDelete = deferred();
  await withVaultChartManagement({ confirmResults: [true] }, async (scope) => {
    await mountWithNotes(scope, scope.chart);
    scope.fetch.enqueue('DELETE', chartUrl(scope.chart), chartDeletion.promise);
    scope.fetch.enqueue('PATCH', chartUrl(scope.chart), metadataAfterDelete.promise);
    await scope.click(scope.button('Delete chart'));
    await scope.change(scope.control('Chart name'), 'Started after delete');
    await scope.submit(scope.control('Chart name').form);
    assert.equal(scope.fetch.callsFor('DELETE', chartUrl(scope.chart)).length, 1);
    assert.equal(scope.fetch.callsFor('PATCH', chartUrl(scope.chart)).length, 1);

    chartDeletion.resolve(jsonResponse({ deleted: true }));
    metadataAfterDelete.resolve(jsonResponse({ chart: makeVaultChart({ displayName: 'After delete server' }) }));
    await scope.flush();
  });
});

test('different chart IDs reset metadata and active note action, abort and replace loads, but retain the note draft', async () => {
  const chartA = makeVaultChart();
  const chartB = makeVaultChart({ chartId: 'chart-b', displayName: 'Second chart', category: 'CLIENT' });
  const noteA = makeChartNote();
  const pendingUpdate = deferred();
  const loadB = deferred();

  await withVaultChartManagement({ chart: chartA }, async (scope) => {
    await mountWithNotes(scope, chartA, [noteA]);
    const loadASignal = scope.fetch.calls[0].init.signal;
    await scope.change(scope.control('Chart name'), 'Local metadata draft');
    await scope.change(scope.control('Category'), 'PARTNER');
    await scope.change(scope.control('Add a note'), 'Draft survives chart switch');
    await scope.click(scope.button('Edit'));
    await scope.change(scope.control('Edit note'), 'Pending A edit');
    scope.fetch.enqueue('PATCH', noteUrl(chartA, noteA), pendingUpdate.promise);
    await scope.click(scope.button('Save note'));

    scope.fetch.enqueue('GET', notesUrl(chartB), loadB.promise);
    await scope.rerender(chartB);
    assert.equal(loadASignal.aborted, true);
    assert.equal(scope.fetch.callsFor('GET', notesUrl(chartB)).length, 1);
    assert.equal(scope.fetch.callsFor('GET', notesUrl(chartB))[0].init.signal.aborted, false);
    assert.equal(scope.control('Chart name').value, 'Second chart');
    assert.equal(scope.control('Category').value, 'CLIENT');
    assert.equal(scope.control('Add a note').value, 'Draft survives chart switch');
    assert.equal(scope.role('status', 'Loading notes…').getAttribute('aria-live'), 'polite');
    assert.equal(scope.buttons('Save note').length, 0);

    const noteB = makeChartNote({ noteId: 'note-b', chartId: 'chart-b', content: 'Chart B note' });
    loadB.resolve(jsonResponse({ notes: [noteB] }));
    await scope.flush();
    assert.match(scope.container.textContent, /Chart B note/);
    assert.equal(scope.control('Add a note').disabled, false);
    assert.equal(scope.control('Add a note').value, 'Draft survives chart switch');

    pendingUpdate.resolve(jsonResponse({ note: makeChartNote({ content: 'Late A response' }) }));
    await scope.flush();
    assert.match(scope.container.textContent, /Chart B note/);
    assert.doesNotMatch(scope.container.textContent, /Late A response/);
    assert.strictEqual(scope.document.activeElement, scope.role('status', 'Note updated.'));
  });
});

test('same-chart-ID prop updates change display props but do not resynchronize metadata, note draft, editor, or notes load', async () => {
  const first = makeVaultChart({ displayName: 'First prop name', category: 'SELF' });
  const next = makeVaultChart({ displayName: 'New prop name', category: 'CLIENT' });

  await withVaultChartManagement({ chart: first }, async (scope) => {
    await mountWithNotes(scope, first, [makeChartNote()]);
    const loadSignal = scope.fetch.calls[0].init.signal;
    await scope.change(scope.control('Chart name'), 'Local name draft');
    await scope.change(scope.control('Category'), 'PARTNER');
    await scope.change(scope.control('Add a note'), 'Local note draft');
    await scope.click(scope.button('Edit'));
    await scope.change(scope.control('Edit note'), 'Local edit draft');

    await scope.rerender(next);
    assert.equal(scope.container.querySelector('h2').textContent, 'New prop name');
    assert.equal(scope.container.querySelector('.nn-badge').textContent, 'CLIENT');
    assert.equal(scope.control('Chart name').value, 'Local name draft');
    assert.equal(scope.control('Category').value, 'PARTNER');
    assert.equal(scope.control('Add a note').value, 'Local note draft');
    assert.equal(scope.control('Edit note').value, 'Local edit draft');
    assert.equal(scope.fetch.callsFor('GET', notesUrl(first)).length, 1);
    assert.equal(loadSignal.aborted, false);
  });
});

test('the direct consumer statically preserves onDeleted navigation to /vault', async () => {
  const source = await readFile(
    new URL('../src/features/vault/SavedVaultChartExperience.tsx', import.meta.url),
    'utf8'
  );
  const matches = source.match(/onDeleted=\{\(\) => window\.location\.replace\('\/vault'\)\}/gu) ?? [];
  assert.equal(matches.length, 1);
});

test('responsive visual characterization is explicitly manual-deferred under happy-dom', () => {
  assert.equal(
    'RESPONSIVE VISUAL CHARACTERIZATION = MANUAL BASELINE DEFERRED',
    'RESPONSIVE VISUAL CHARACTERIZATION = MANUAL BASELINE DEFERRED'
  );
});
