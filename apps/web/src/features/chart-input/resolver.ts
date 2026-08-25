import type { BirthInputDraft, BirthInputResolution } from './types';

export interface BirthInputResolver {
  resolve(input: BirthInputDraft): Promise<BirthInputResolution>;
}
