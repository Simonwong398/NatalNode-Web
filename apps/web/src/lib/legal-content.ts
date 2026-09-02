import type { SupportedLocale } from './localization.js';

export type LegalPageId = 'privacy' | 'terms';

export interface ApprovedLegalSection {
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export interface ApprovedLegalPageContent {
  readonly page: LegalPageId;
  readonly locale: SupportedLocale;
  readonly title: string;
  readonly description: string;
  readonly sections: readonly ApprovedLegalSection[];
}

/** Final public legal copy is an external approval gate, not generated here. */
export const LEGAL_CONTENT_STATUS = 'LEGAL_EXTERNAL' as const;

type LegalContentRegistry = Partial<
  Record<LegalPageId, Partial<Record<SupportedLocale, ApprovedLegalPageContent>>>
>;

/**
 * Keep this source empty until approved legal text is supplied. The route
 * renderer is deliberately fail-closed and cannot publish placeholders.
 */
const APPROVED_LEGAL_CONTENT: LegalContentRegistry = Object.freeze({});

export function getApprovedLegalContent(
  page: LegalPageId,
  locale: SupportedLocale
): ApprovedLegalPageContent | null {
  return APPROVED_LEGAL_CONTENT[page]?.[locale] ?? null;
}
