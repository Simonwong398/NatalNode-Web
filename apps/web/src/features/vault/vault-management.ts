export {
  VAULT_CHART_CATEGORIES,
  DISPLAY_NAME_MAXIMUM_CHARACTERS,
  CHART_NOTE_MAXIMUM_CHARACTERS,
  normalizeDisplayName,
  normalizeNoteContent,
  validateDisplayName,
  validateNoteContent
} from './vault-content-validation.js';

export {
  updateVaultChartMetadata,
  duplicateVaultChart,
  listChartNotes,
  createChartNote,
  updateChartNote,
  deleteChartNote,
  deleteVaultChart
} from './vault-management-client.js';

export type {
  UpdateVaultChartResult,
  DuplicateVaultChartResult,
  ChartNotesResult,
  ChartNoteResult,
  DeleteResult
} from './vault-management-client.js';
