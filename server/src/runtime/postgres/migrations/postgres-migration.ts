export interface PostgresMigration {
  readonly version: string;
  readonly filename: string;
  readonly checksumSha256: string;
  readonly executableSql: string;
}
