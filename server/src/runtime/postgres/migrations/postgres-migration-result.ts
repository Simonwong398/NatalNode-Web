export interface PostgresMigrationRunResult {
  readonly appliedVersions: readonly string[];
  readonly alreadyAppliedVersions: readonly string[];
}
