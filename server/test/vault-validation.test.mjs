import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CHART_NOTE_MAXIMUM_CHARACTERS,
  isChartNoteContentRequest,
  isMetadataUpdate,
  isValidVaultChartDisplayName,
  normalizeChartNoteContent,
  normalizeVaultChartDisplayName,
  VAULT_CHART_DISPLAY_NAME_MAXIMUM_CHARACTERS
} from '../dist/app/validation/index.js';

test('Vault validation normalizes and bounds chart names and note content', () => {
  assert.equal(VAULT_CHART_DISPLAY_NAME_MAXIMUM_CHARACTERS, 120);
  assert.equal(CHART_NOTE_MAXIMUM_CHARACTERS, 5_000);
  assert.equal(normalizeVaultChartDisplayName('  My chart  '), 'My chart');
  assert.equal(isValidVaultChartDisplayName('  My chart  '), true);
  assert.equal(isValidVaultChartDisplayName('   '), false);
  assert.equal(
    isValidVaultChartDisplayName('🙂'.repeat(VAULT_CHART_DISPLAY_NAME_MAXIMUM_CHARACTERS)),
    true
  );
  assert.equal(
    isValidVaultChartDisplayName('🙂'.repeat(VAULT_CHART_DISPLAY_NAME_MAXIMUM_CHARACTERS + 1)),
    false
  );
  assert.equal(isMetadataUpdate({ displayName: '  Renamed  ' }), true);
  assert.equal(isMetadataUpdate({ displayName: ' ' }), false);
  assert.equal(isMetadataUpdate({ displayName: 'x'.repeat(121) }), false);
  assert.equal(isMetadataUpdate({ category: 'CLIENT' }), true);
  assert.equal(isMetadataUpdate({ category: 'UNKNOWN' }), false);

  assert.equal(
    normalizeChartNoteContent('  first\r\nsecond\rthird  '),
    'first\nsecond\nthird'
  );
  assert.equal(isChartNoteContentRequest({ content: '  first\r\nsecond  ' }), true);
  assert.equal(isChartNoteContentRequest({ content: '   ' }), false);
  assert.equal(
    isChartNoteContentRequest({ content: 'x'.repeat(CHART_NOTE_MAXIMUM_CHARACTERS + 1) }),
    false
  );
  assert.equal(isChartNoteContentRequest({ content: 'valid\u0000note' }), false);
  assert.equal(isChartNoteContentRequest({ content: 'valid\tnote' }), false);
  assert.equal(isChartNoteContentRequest({ content: `valid${'\uD800'}note` }), false);
});
