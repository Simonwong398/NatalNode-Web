import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { afterEach, beforeEach, describe, test } from 'node:test';

import * as vault from '../dist/vault-management-characterization/vault-management.js';
import {
  assertBodylessRequest,
  assertJsonRequest,
  invalidJsonResponse,
  jsonResponse,
  makeChartNote,
  makeVaultChart,
  withCapturedFetch
} from './support/vault-management-client-harness.mjs';

const originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
const originalFetch = globalThis.fetch;

beforeEach(() => {
  assert.strictEqual(globalThis.fetch, originalFetch, 'a previous test leaked its fetch stub');
});

afterEach(() => {
  try {
    assert.strictEqual(globalThis.fetch, originalFetch, 'the current test leaked its fetch stub');
  } finally {
    Object.defineProperty(globalThis, 'fetch', originalFetchDescriptor);
  }
});

const chartId = 'chart /?#% ü\ud83d\ude80';
const noteId = 'note /?#% ñ\ud83c\udf1f';
const encodedChartId = encodeURIComponent(chartId);
const encodedNoteId = encodeURIComponent(noteId);
const metadataRequest = Object.freeze({
  displayName: '  Transport keeps this whitespace  ',
  category: 'PARTNER',
  tags: ['one', 'two'],
  favorite: true
});
const createContent = '  create\r\ncontent\u0000  ';
const updateContent = '  update\rcontent  ';

function operationCases(signal = undefined) {
  const chart = makeVaultChart({ chartId });
  const note = makeChartNote({ chartId, noteId });

  return [
    {
      name: 'updateVaultChartMetadata',
      invoke: () => vault.updateVaultChartMetadata(chartId, metadataRequest, signal),
      expectedStatus: 200,
      alternateSuccessStatus: 201,
      payload: { chart },
      expectedResult: { status: 'success', chart },
      assertRequest: (call) =>
        assertJsonRequest(call, {
          url: `/api/vault/charts/${encodedChartId}`,
          method: 'PATCH',
          body: metadataRequest,
          signal
        })
    },
    {
      name: 'listChartNotes',
      invoke: () => vault.listChartNotes(chartId, signal),
      expectedStatus: 200,
      alternateSuccessStatus: 201,
      payload: { notes: [note] },
      expectedResult: { status: 'success', notes: [note] },
      assertRequest: (call) =>
        assertBodylessRequest(call, {
          url: `/api/vault/charts/${encodedChartId}/notes`,
          method: 'GET',
          signal
        })
    },
    {
      name: 'createChartNote',
      invoke: () => vault.createChartNote(chartId, createContent, signal),
      expectedStatus: 201,
      alternateSuccessStatus: 200,
      payload: { note },
      expectedResult: { status: 'success', note },
      assertRequest: (call) =>
        assertJsonRequest(call, {
          url: `/api/vault/charts/${encodedChartId}/notes`,
          method: 'POST',
          body: { content: createContent },
          signal
        })
    },
    {
      name: 'updateChartNote',
      invoke: () => vault.updateChartNote(chartId, noteId, updateContent, signal),
      expectedStatus: 200,
      alternateSuccessStatus: 201,
      payload: { note },
      expectedResult: { status: 'success', note },
      assertRequest: (call) =>
        assertJsonRequest(call, {
          url: `/api/vault/charts/${encodedChartId}/notes/${encodedNoteId}`,
          method: 'PATCH',
          body: { content: updateContent },
          signal
        })
    },
    {
      name: 'deleteChartNote',
      invoke: () => vault.deleteChartNote(chartId, noteId, signal),
      expectedStatus: 200,
      alternateSuccessStatus: 204,
      payload: { deleted: true },
      expectedResult: { status: 'success' },
      assertRequest: (call) =>
        assertBodylessRequest(call, {
          url: `/api/vault/charts/${encodedChartId}/notes/${encodedNoteId}`,
          method: 'DELETE',
          signal
        })
    },
    {
      name: 'deleteVaultChart',
      invoke: () => vault.deleteVaultChart(chartId, signal),
      expectedStatus: 200,
      alternateSuccessStatus: 204,
      payload: { deleted: true },
      expectedResult: { status: 'success' },
      assertRequest: (call) =>
        assertBodylessRequest(call, {
          url: `/api/vault/charts/${encodedChartId}`,
          method: 'DELETE',
          signal
        })
    }
  ];
}

async function resultForPayload(invoke, payload, status) {
  return withCapturedFetch(
    () => jsonResponse(payload, status),
    async () => invoke()
  );
}

function without(object, key) {
  const copy = { ...object };
  delete copy[key];
  return copy;
}

describe('runtime public surface', () => {
  test('exports exactly the current runtime API and constants', () => {
    assert.deepEqual(Object.keys(vault).sort(), [
      'CHART_NOTE_MAXIMUM_CHARACTERS',
      'DISPLAY_NAME_MAXIMUM_CHARACTERS',
      'VAULT_CHART_CATEGORIES',
      'createChartNote',
      'deleteChartNote',
      'deleteVaultChart',
      'listChartNotes',
      'normalizeDisplayName',
      'normalizeNoteContent',
      'updateChartNote',
      'updateVaultChartMetadata',
      'validateDisplayName',
      'validateNoteContent'
    ]);
    assert.equal(vault.DISPLAY_NAME_MAXIMUM_CHARACTERS, 120);
    assert.equal(vault.CHART_NOTE_MAXIMUM_CHARACTERS, 5_000);
  });

  test('the emitted module resolves no unapproved direct runtime dependencies', async () => {
    const auditedModuleUrl = new URL(
      '../dist/vault-management-characterization/vault-management.js?runtime-import-audit',
      import.meta.url
    ).href;
    const dependencySpecifiers = [];
    const hooks = registerHooks({
      resolve(specifier, context, nextResolve) {
        if (context.parentURL === auditedModuleUrl) {
          dependencySpecifiers.push(specifier);
        }

        return nextResolve(specifier, context);
      }
    });

    try {
      await import(auditedModuleUrl);
    } finally {
      hooks.deregister();
    }

    const allowedDependencySpecifiers = new Set([
      './vault-content-validation.js',
      './vault-management-client.js'
    ]);
    assert.ok(
      dependencySpecifiers.every((specifier) =>
        allowedDependencySpecifiers.has(specifier)
      )
    );
  });
});

describe('display-name normalization and validation', () => {
  test('trims outer whitespace but preserves inner whitespace', () => {
    assert.equal(vault.normalizeDisplayName(' \t  My   chart \r\n'), 'My   chart');
    assert.equal(vault.validateDisplayName('  My chart  '), null);
  });

  test('rejects empty and whitespace-only names with the exact message', () => {
    assert.equal(vault.validateDisplayName(''), 'Enter a chart name.');
    assert.equal(vault.validateDisplayName(' \t\r\n '), 'Enter a chart name.');
  });

  test('accepts exactly 120 and rejects more than 120 Unicode code points', () => {
    assert.equal(vault.validateDisplayName('a'.repeat(120)), null);
    assert.equal(
      vault.validateDisplayName('a'.repeat(121)),
      'Use 120 characters or fewer.'
    );
  });

  test('counts non-BMP emoji as one code point', () => {
    assert.equal('\ud83d\ude80'.repeat(120).length, 240);
    assert.equal(vault.validateDisplayName('\ud83d\ude80'.repeat(120)), null);
    assert.equal(
      vault.validateDisplayName('\ud83d\ude80'.repeat(121)),
      'Use 120 characters or fewer.'
    );
  });
});

describe('note normalization and validation', () => {
  test('normalizes CRLF and bare CR to LF, then trims the whole note', () => {
    assert.equal(
      vault.normalizeNoteContent(' \r\nLine one\rLine two\r\n '),
      'Line one\nLine two'
    );
  });

  test('accepts valid LF-delimited multiline content', () => {
    assert.equal(vault.validateNoteContent('Line one\nLine two'), null);
  });

  test('rejects empty and whitespace-only notes with the exact message', () => {
    assert.equal(vault.validateNoteContent(''), 'Enter a note.');
    assert.equal(vault.validateNoteContent(' \t\r\n '), 'Enter a note.');
  });

  test('accepts exactly 5,000 and rejects more than 5,000 code points', () => {
    assert.equal(vault.validateNoteContent('a'.repeat(5_000)), null);
    assert.equal(
      vault.validateNoteContent('a'.repeat(5_001)),
      'Use 5,000 characters or fewer.'
    );
  });

  test('counts non-BMP emoji as one code point at the note boundary', () => {
    assert.equal('\ud83c\udf1f'.repeat(5_000).length, 10_000);
    assert.equal(vault.validateNoteContent('\ud83c\udf1f'.repeat(5_000)), null);
    assert.equal(
      vault.validateNoteContent('\ud83c\udf1f'.repeat(5_001)),
      'Use 5,000 characters or fewer.'
    );
  });

  test('rejects NUL and representative C0, DEL, C1, and tab controls', () => {
    for (const character of ['\u0000', '\u0001', '\t', '\u007f', '\u0085']) {
      assert.equal(
        vault.validateNoteContent(`before${character}after`),
        'Remove unsupported control characters from the note.'
      );
    }
  });

  test('rejects unpaired high and low surrogates with the control-character message', () => {
    assert.equal(vault.normalizeNoteContent('\ud800'), '\ud800');
    assert.equal(vault.normalizeNoteContent('\udc00'), '\udc00');
    assert.equal(
      vault.validateNoteContent('\ud800'),
      'Remove unsupported control characters from the note.'
    );
    assert.equal(
      vault.validateNoteContent('\udc00'),
      'Remove unsupported control characters from the note.'
    );
  });

  test('reports the length failure before unsupported controls when both apply', () => {
    assert.equal(
      vault.validateNoteContent(`${'a'.repeat(5_001)}\u0000`),
      'Use 5,000 characters or fewer.'
    );
  });
});

describe('chart categories through the metadata response guard', () => {
  test('publishes the exact ordered category list', () => {
    assert.deepEqual(vault.VAULT_CHART_CATEGORIES, [
      'SELF',
      'PARTNER',
      'FAMILY',
      'FRIEND',
      'CLIENT'
    ]);
  });

  for (const category of ['SELF', 'PARTNER', 'FAMILY', 'FRIEND', 'CLIENT']) {
    test(`accepts ${category}`, async () => {
      const chart = makeVaultChart({ category });
      const result = await resultForPayload(
        () => vault.updateVaultChartMetadata('category-chart', metadataRequest),
        { chart },
        200
      );
      assert.deepEqual(result, { status: 'success', chart });
    });
  }

  for (const [name, chart] of [
    ['invalid category', makeVaultChart({ category: 'OTHER' })],
    ['missing category', without(makeVaultChart(), 'category')],
    ['malformed category', makeVaultChart({ category: ['SELF'] })]
  ]) {
    test(`rejects ${name}`, async () => {
      const result = await resultForPayload(
        () => vault.updateVaultChartMetadata('category-chart', metadataRequest),
        { chart },
        200
      );
      assert.deepEqual(result, { status: 'failed' });
    });
  }
});

describe('successful request contracts and response mapping', () => {
  for (const operation of operationCases(new AbortController().signal)) {
    test(`${operation.name} sends the exact request and maps its valid response`, async () => {
      await withCapturedFetch(
        () => jsonResponse(operation.payload, operation.expectedStatus),
        async (calls) => {
          const result = await operation.invoke();
          assert.equal(calls.length, 1);
          operation.assertRequest(calls[0]);
          assert.deepEqual(result, operation.expectedResult);
        }
      );
    });
  }

  test('metadata PATCH preserves each supported partial and no-op request shape', async (t) => {
    const variants = [
      ['displayName only', { displayName: 'Display-only chart' }],
      ['category only', { category: 'FAMILY' }],
      [
        'displayName and category',
        { displayName: 'Combined metadata chart', category: 'CLIENT' }
      ],
      ['empty no-op', {}]
    ];

    for (const [name, request] of variants) {
      await t.test(name, async () => {
        const signal = new AbortController().signal;
        const chart = makeVaultChart({ chartId });

        await withCapturedFetch(
          () => jsonResponse({ chart }, 200),
          async (calls) => {
            const result = await vault.updateVaultChartMetadata(chartId, request, signal);

            assert.equal(calls.length, 1);
            assertJsonRequest(calls[0], {
              url: `/api/vault/charts/${encodedChartId}`,
              method: 'PATCH',
              body: request,
              signal
            });
            assert.equal(calls[0].init.body, JSON.stringify(request));
            assert.deepEqual(result, { status: 'success', chart });
          }
        );
      });
    }
  });

  test('serializes only the valid public metadata and note inputs, without normalization', async () => {
    const operations = operationCases();
    const mutating = operations.filter(({ name }) =>
      ['updateVaultChartMetadata', 'createChartNote', 'updateChartNote'].includes(name)
    );
    const capturedBodies = [];

    for (const operation of mutating) {
      await withCapturedFetch(
        () => jsonResponse(operation.payload, operation.expectedStatus),
        async (calls) => {
          await operation.invoke();
          capturedBodies.push(JSON.parse(calls[0].init.body));
        }
      );
    }

    assert.deepEqual(capturedBodies, [
      metadataRequest,
      { content: createContent },
      { content: updateContent }
    ]);

    const serializedKeys = new Set(
      capturedBodies.flatMap((body) => Object.keys(body))
    );
    for (const forbidden of [
      'userId',
      'ownerId',
      'accountId',
      'normalizedChartRequest',
      'canonicalChartResult',
      'engineVersion',
      'astronomyConfigurationId',
      'provenanceEnvelopeId'
    ]) {
      assert.equal(serializedKeys.has(forbidden), false, `${forbidden} was serialized`);
    }
  });

  test('keeps all six paths under /api/vault/charts and outside the /api/chart prefix', async () => {
    const capturedUrls = [];

    for (const operation of operationCases()) {
      await withCapturedFetch(
        () => jsonResponse(operation.payload, operation.expectedStatus),
        async (calls) => {
          await operation.invoke();
          capturedUrls.push(calls[0].input);
        }
      );
    }

    assert.equal(capturedUrls.length, 6);
    for (const url of capturedUrls) {
      assert.equal(url.startsWith('/api/vault/charts/'), true);
      assert.equal(url.startsWith('/api/chart'), false);
    }
  });
});

describe('runtime success-payload guards', () => {
  test('metadata rejects non-record, missing, primitive, and malformed nested chart fields', async (t) => {
    const chart = makeVaultChart();
    const cases = [
      ['null payload', null],
      ['array payload', []],
      ['missing chart', {}],
      ['null chart', { chart: null }],
      ['array chart', { chart: [] }],
      ['missing chartId', { chart: without(chart, 'chartId') }],
      ['primitive favorite', { chart: makeVaultChart({ favorite: 'yes' }) }],
      ['malformed tags', { chart: makeVaultChart({ tags: ['ok', 3] }) }],
      ['malformed normalized request', { chart: makeVaultChart({ normalizedChartRequest: null }) }],
      ['malformed canonical result', { chart: makeVaultChart({ canonicalChartResult: [] }) }],
      ['malformed nullable provenance', { chart: makeVaultChart({ provenanceEnvelopeId: 4 }) }]
    ];

    for (const [name, payload] of cases) {
      await t.test(name, async () => {
        const result = await resultForPayload(
          () => vault.updateVaultChartMetadata('guard-chart', metadataRequest),
          payload,
          200
        );
        assert.deepEqual(result, { status: 'failed' });
      });
    }
  });

  test('metadata accepts required fields with additional payload and chart fields', async () => {
    const chart = makeVaultChart({ additionalChartField: 'ignored' });
    const result = await resultForPayload(
      () => vault.updateVaultChartMetadata('guard-chart', metadataRequest),
      { chart, additionalPayloadField: 'ignored' },
      200
    );
    assert.deepEqual(result, { status: 'success', chart });
  });

  test('notes list accepts an empty list and fully shaped notes', async () => {
    for (const notes of [[], [makeChartNote({ extra: 'ignored' })]]) {
      const result = await resultForPayload(
        () => vault.listChartNotes('guard-chart'),
        { notes, extra: 'ignored' },
        200
      );
      assert.deepEqual(result, { status: 'success', notes });
    }
  });

  test('notes list rejects non-record, non-array, primitive, and malformed nested notes', async (t) => {
    const note = makeChartNote();
    const cases = [
      ['null payload', null],
      ['array payload', []],
      ['missing notes', {}],
      ['null notes', { notes: null }],
      ['object notes', { notes: {} }],
      ['null nested note', { notes: [null] }],
      ['array nested note', { notes: [[]] }],
      ['missing nested content', { notes: [without(note, 'content')] }],
      ['primitive nested timestamp', { notes: [makeChartNote({ updatedAt: 7 })] }]
    ];

    for (const [name, payload] of cases) {
      await t.test(name, async () => {
        const result = await resultForPayload(
          () => vault.listChartNotes('guard-chart'),
          payload,
          200
        );
        assert.deepEqual(result, { status: 'failed' });
      });
    }
  });

  for (const [name, invoke, status] of [
    ['create', () => vault.createChartNote('guard-chart', 'content'), 201],
    ['update', () => vault.updateChartNote('guard-chart', 'guard-note', 'content'), 200]
  ]) {
    test(`${name} note accepts required fields plus extras`, async () => {
      const note = makeChartNote({ extra: 'ignored' });
      const result = await resultForPayload(invoke, { note, extra: 'ignored' }, status);
      assert.deepEqual(result, { status: 'success', note });
    });

    test(`${name} note rejects malformed wrapper and nested note shapes`, async (t) => {
      const cases = [
        ['null payload', null],
        ['array payload', []],
        ['missing note', {}],
        ['null note', { note: null }],
        ['array note', { note: [] }],
        ['missing noteId', { note: without(makeChartNote(), 'noteId') }],
        ['primitive content', { note: makeChartNote({ content: 5 }) }]
      ];

      for (const [caseName, payload] of cases) {
        await t.test(caseName, async () => {
          const result = await resultForPayload(invoke, payload, status);
          assert.deepEqual(result, { status: 'failed' });
        });
      }
    });
  }

  for (const [name, invoke] of [
    ['delete note', () => vault.deleteChartNote('guard-chart', 'guard-note')],
    ['delete chart', () => vault.deleteVaultChart('guard-chart')]
  ]) {
    test(`${name} requires literal deleted true but permits extra fields`, async (t) => {
      for (const [caseName, payload, expected] of [
        ['literal true', { deleted: true }, { status: 'success' }],
        ['literal true with extras', { deleted: true, extra: 'ignored' }, { status: 'success' }],
        ['null payload', null, { status: 'failed' }],
        ['array payload', [], { status: 'failed' }],
        ['missing deleted', {}, { status: 'failed' }],
        ['false deleted', { deleted: false }, { status: 'failed' }],
        ['truthy primitive deleted', { deleted: 1 }, { status: 'failed' }]
      ]) {
        await t.test(caseName, async () => {
          const result = await resultForPayload(invoke, payload, 200);
          assert.deepEqual(result, expected);
        });
      }
    });
  }
});

describe('HTTP status mapping across every operation', () => {
  const mappings = [
    [400, 'invalid-request'],
    [401, 'unauthorized'],
    [404, 'not-found'],
    [403, 'failed'],
    [409, 'failed'],
    [413, 'failed'],
    [415, 'failed'],
    [429, 'failed'],
    [500, 'failed']
  ];

  for (const operation of operationCases()) {
    test(`${operation.name} preserves the shared explicit and fallback mappings`, async (t) => {
      for (const [status, expectedStatus] of mappings) {
        await t.test(String(status), async () => {
          const result = await withCapturedFetch(
            () => new Response(null, { status }),
            async () => operation.invoke()
          );
          assert.deepEqual(result, { status: expectedStatus });
        });
      }
    });

    test(`${operation.name} rejects an unexpected successful HTTP status`, async () => {
      const result = await withCapturedFetch(
        () => new Response(null, { status: operation.alternateSuccessStatus }),
        async () => operation.invoke()
      );
      assert.deepEqual(result, { status: 'failed' });
    });
  }
});

describe('transport and parsing failures across every operation', () => {
  for (const operation of operationCases()) {
    test(`${operation.name} maps network rejection to failed`, async () => {
      const result = await withCapturedFetch(
        async () => {
          throw new TypeError('fixture network rejection');
        },
        async () => operation.invoke()
      );
      assert.deepEqual(result, { status: 'failed' });
    });

    test(`${operation.name} maps AbortError rejection to failed`, async () => {
      const result = await withCapturedFetch(
        async () => {
          throw new DOMException('fixture abort', 'AbortError');
        },
        async () => operation.invoke()
      );
      assert.deepEqual(result, { status: 'failed' });
    });

    test(`${operation.name} maps invalid JSON at its expected status to failed`, async () => {
      const result = await withCapturedFetch(
        () => invalidJsonResponse(operation.expectedStatus),
        async () => operation.invoke()
      );
      assert.deepEqual(result, { status: 'failed' });
    });

    test(`${operation.name} maps a malformed success payload to failed`, async () => {
      const result = await withCapturedFetch(
        () => jsonResponse(null, operation.expectedStatus),
        async () => operation.invoke()
      );
      assert.deepEqual(result, { status: 'failed' });
    });
  }
});

test('fetch replacement restores the exact original implementation', async () => {
  await withCapturedFetch(
    () => jsonResponse({ notes: [] }),
    async (_calls, fetchStub) => {
      assert.strictEqual(globalThis.fetch, fetchStub);
      assert.notStrictEqual(globalThis.fetch, originalFetch);
      assert.deepEqual(await vault.listChartNotes('restore-check'), {
        status: 'success',
        notes: []
      });
    }
  );

  assert.strictEqual(globalThis.fetch, originalFetch);
});
