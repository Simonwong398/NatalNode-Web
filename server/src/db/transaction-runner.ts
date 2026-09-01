import type { SqlExecutor } from './sql-executor.js';

/** Runs one operation over a single caller-owned database transaction. */
export interface TransactionRunner {
  run<Result>(
    operation: (executor: SqlExecutor) => Promise<Result>
  ): Promise<Result>;
}
