import type { BirthInputDraft, BirthInputResolution } from './types';
import type { CanonicalResolvedLocation } from './location-resolution';

export interface BirthInputResolver {
  resolve(
    input: BirthInputDraft,
    selectedLocation?: CanonicalResolvedLocation | null
  ): Promise<BirthInputResolution>;
}
