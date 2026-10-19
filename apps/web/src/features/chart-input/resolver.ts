import type { BirthInputDraft, BirthInputResolution } from './types';
import type { CanonicalResolvedLocation } from './location-resolution';
import type { TimeDisambiguation } from '@natalnode/contracts';

export interface BirthInputResolverOptions {
  readonly disambiguation?: TimeDisambiguation;
  readonly expectedTimezoneDatabaseVersion?: string | null;
}

export interface BirthInputResolver {
  /** Presentation marker for an explicitly injected development fixture. */
  readonly provenance?: 'UI_DEVELOPMENT_ONLY';
  resolve(
    input: BirthInputDraft,
    selectedLocation?: CanonicalResolvedLocation | null,
    options?: BirthInputResolverOptions
  ): Promise<BirthInputResolution>;
}

/** Safe, user-presentable failure emitted by an explicitly trusted resolver. */
export class BirthInputResolverError extends Error {
  public readonly code: string;

  public constructor(code: string, message: string) {
    super(message);
    this.name = 'BirthInputResolverError';
    this.code = code;
  }
}
