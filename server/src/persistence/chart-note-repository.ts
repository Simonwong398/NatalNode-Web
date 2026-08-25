import type { ChartNoteRecord } from '@natalnode/contracts';
import type { ChartNoteContentUpdate } from './types.js';

export interface ChartNoteRepository {
  create(note: ChartNoteRecord): Promise<void>;
  listForChart(userId: string, chartId: string): Promise<readonly ChartNoteRecord[]>;
  updateContent(
    userId: string,
    chartId: string,
    noteId: string,
    update: ChartNoteContentUpdate
  ): Promise<ChartNoteRecord | null>;
  deleteById(userId: string, chartId: string, noteId: string): Promise<boolean>;
}
