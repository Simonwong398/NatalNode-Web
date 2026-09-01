import type { Pool } from 'pg';
import type { SqlExecutor, TransactionRunner } from '../../db/index.js';
import { PostgresClientSqlExecutor } from '../../persistence/postgres/postgres-client-sql-executor.js';

/** Adapts one checked-out pool client to the transaction boundary. */
export class PostgresTransactionRunner implements TransactionRunner {
  public constructor(private readonly pool: Pool) {}

  public async run<Result>(
    operation: (executor: SqlExecutor) => Promise<Result>
  ): Promise<Result> {
    const client = await this.pool.connect();
    let transactionStarted = false;

    try {
      await client.query('BEGIN');
      transactionStarted = true;
      const result = await operation(new PostgresClientSqlExecutor(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      if (!transactionStarted) {
        throw error;
      }

      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        throw new AggregateError(
          [error, rollbackError],
          'Foundations transaction and rollback both failed.'
        );
      }

      throw error;
    } finally {
      client.release();
    }
  }
}
