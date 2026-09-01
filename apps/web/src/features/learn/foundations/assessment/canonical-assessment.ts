import {
  frontmatter as canonicalAssessmentFrontmatter,
  rawContent as readCanonicalAssessmentBody
} from '../../../../../../../docs/content/foundations/v1/en/FINAL_ASSESSMENT.md';
import {
  parseApprovedFoundationsAssessment,
  type FoundationsAssessment
} from './assessment-contract.js';

function serializeFrontmatterValue(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

const canonicalAssessmentMarkdown = [
  '---',
  ...Object.entries(canonicalAssessmentFrontmatter).map(
    ([key, value]) => `${key}: ${serializeFrontmatterValue(value)}`
  ),
  '---',
  readCanonicalAssessmentBody()
].join('\n');

export const FOUNDATIONS_FINAL_ASSESSMENT: FoundationsAssessment =
  parseApprovedFoundationsAssessment(canonicalAssessmentMarkdown);
