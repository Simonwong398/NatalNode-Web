import type { ChartNoteRecord } from '@natalnode/contracts';
import type { SqlExecutor } from '../../db/index.js';
import type { ChartNoteRepository } from '../chart-note-repository.js';
import type { ChartNoteContentUpdate } from '../types.js';

interface ChartNoteRow {
  note_id: string;
  chart_id: string;
  user_id: string;
  content: string;
  created_at: Date | string;
  updated_at: Date | string;
}

const NOTE_COLUMNS = `
  note_id,
  chart_id,
  user_id,
  content,
  created_at,
  updated_at`;

const INSERT_NOTE_SQL = `
  INSERT INTO chart_notes (
    note_id,
    chart_id,
    user_id,
    content,
    created_at,
    updated_at
  )
  VALUES ($1, $2, $3, $4, $5, $6)`;

const LIST_NOTES_SQL = `
  SELECT${NOTE_COLUMNS}
  FROM chart_notes
  WHERE user_id = $1
    AND chart_id = $2
  ORDER BY created_at ASC, note_id ASC`;

const DELETE_NOTE_SQL = `
  DELETE FROM chart_notes
  WHERE user_id = $1
    AND chart_id = $2
    AND note_id = $3
  RETURNING note_id`;

function toTimestampString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapChartNoteRow(row: ChartNoteRow): ChartNoteRecord {
  return {
    noteId: row.note_id,
    chartId: row.chart_id,
    userId: row.user_id,
    content: row.content,
    createdAt: toTimestampString(row.created_at),
    updatedAt: toTimestampString(row.updated_at)
  };
}

export class PostgresChartNoteRepository implements ChartNoteRepository {
  public constructor(private readonly executor: SqlExecutor) {}

  public async create(note: ChartNoteRecord): Promise<void> {
    await this.executor.query<never>(INSERT_NOTE_SQL, [
      note.noteId,
      note.chartId,
      note.userId,
      note.content,
      note.createdAt,
      note.updatedAt
    ]);
  }

  public async listForChart(
    userId: string,
    chartId: string
  ): Promise<readonly ChartNoteRecord[]> {
    const result = await this.executor.query<ChartNoteRow>(LIST_NOTES_SQL, [userId, chartId]);

    return result.rows.map(mapChartNoteRow);
  }

  public async updateContent(
    userId: string,
    chartId: string,
    noteId: string,
    update: ChartNoteContentUpdate
  ): Promise<ChartNoteRecord | null> {
    const result = await this.executor.query<ChartNoteRow>(
      `
        UPDATE chart_notes
        SET content = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
          AND chart_id = $3
          AND note_id = $4
        RETURNING${NOTE_COLUMNS}`,
      [update.content, userId, chartId, noteId]
    );
    const row = result.rows[0];

    return row ? mapChartNoteRow(row) : null;
  }

  public async deleteById(userId: string, chartId: string, noteId: string): Promise<boolean> {
    const result = await this.executor.query<{ note_id: string }>(DELETE_NOTE_SQL, [
      userId,
      chartId,
      noteId
    ]);

    return result.rows.length > 0;
  }
}
