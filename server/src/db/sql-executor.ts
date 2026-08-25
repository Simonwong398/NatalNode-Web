export interface SqlQueryResult<Row> {
  readonly rows: readonly Row[];
}

export interface SqlExecutor {
  query<Row>(
    sql: string,
    params?: readonly unknown[]
  ): Promise<SqlQueryResult<Row>>;
}
