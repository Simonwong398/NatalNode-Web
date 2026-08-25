import type { Pool, QueryResultRow } from 'pg';
import type { SqlExecutor, SqlQueryResult } from '../../db/index.js';

export class PostgresSqlExecutor implements SqlExecutor {
  public constructor(private readonly pool: Pool) {}

  public async query<Row>(
    sql: string,
    params?: readonly unknown[]
  ): Promise<SqlQueryResult<Row>> {
    const values = params === undefined ? undefined : [...params];
    const result = await this.pool.query<Row & QueryResultRow, unknown[]>(sql, values);

    return {
      rows: result.rows
    };
  }
}
