import type { PoolClient, QueryResultRow } from 'pg';
import type { SqlExecutor, SqlQueryResult } from '../../db/index.js';

/** Adapts one checked-out PostgreSQL client to existing repository queries. */
export class PostgresClientSqlExecutor implements SqlExecutor {
  public constructor(private readonly client: PoolClient) {}

  public async query<Row>(
    sql: string,
    params?: readonly unknown[]
  ): Promise<SqlQueryResult<Row>> {
    const values = params === undefined ? undefined : [...params];
    const result = await this.client.query<Row & QueryResultRow, unknown[]>(
      sql,
      values
    );

    return { rows: result.rows };
  }
}
