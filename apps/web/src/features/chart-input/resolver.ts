import type { BirthInputDraft, BirthInputResolution } from './types';
import type { CanonicalResolvedLocation } from './location-resolution';

export interface BirthInputResolver {
  resolve(
    input: BirthInputDraft,
    selectedLocation?: CanonicalResolvedLocation | null
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
