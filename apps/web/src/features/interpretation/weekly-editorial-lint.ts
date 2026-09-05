import type {
  WeeklyEditorialContentBlock,
  WeeklyInterpretationDraft
} from './weekly-editorial.js';

export type WeeklyEditorialLintCode =
  | 'EMPTY_HERO'
  | 'DUPLICATE_PARAGRAPH'
  | 'REPEATED_CORE_THEME_TEXT'
  | 'PROHIBITED_CERTAINTY'
  | 'UNSUPPORTED_BEST_WINDOW'
  | 'SHARE_TOO_LONG'
  | 'MISSING_TRACEABILITY'
  | 'TECHNICAL_ID_LEAK'
  | 'NON_DEVELOPMENT_AUTHORITY';

export interface WeeklyEditorialLintIssue {
  readonly code: WeeklyEditorialLintCode;
  readonly contentBlockId?: string;
  readonly message: string;
}

const CERTAINTY_PATTERNS = [
  /\b(?:you|this|it|that)\s+will\b/iu,
  /\bwill\s+(?:happen|meet|be|arrive|come)\b/iu,
  /\b(?:you|this|it)\s+(?:are|is)\s+guaranteed\b/iu,
  /\bguaranteed\s+to\b/iu
];

const TECHNICAL_ID_PATTERN = /(?:fixture:\/\/|weekly-poc\.[a-z0-9_.-]+|signal\.[a-z0-9_.-]+|rule\.[a-z0-9_.-]+|\/bodies\/|\/aspects\/)/iu;

function blockList(draft: WeeklyInterpretationDraft): readonly WeeklyEditorialContentBlock[] {
  const blocks = [
    draft.hero,
    ...draft.coreThemes.map((theme) => theme.content),
    ...draft.timeline.map((entry) => entry.content),
    draft.relationship,
    draft.workCreation,
    draft.innerState,
    draft.actionDecision,
    draft.watchOut,
    draft.bestWindow,
    draft.astrologerView,
    draft.signatureLine,
    draft.shareProjection.hook,
    draft.shareProjection.insight,
    draft.shareProjection.cta
  ];
  const result: WeeklyEditorialContentBlock[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    if (block !== null && block !== undefined && !seen.has(block.contentBlockId)) {
      seen.add(block.contentBlockId);
      result.push(block);
    }
  }

  return result;
}

function normalizedText(text: string): string {
  return text.trim().replace(/\s+/gu, ' ').toLocaleLowerCase();
}

function sourceSignalSet(draft: WeeklyInterpretationDraft): ReadonlySet<string> {
  return new Set(draft.signals.map((signal) => signal.signalId));
}

function hasTemporalEvidence(
  draft: WeeklyInterpretationDraft,
  block: WeeklyEditorialContentBlock
): boolean {
  const signals = new Map(draft.signals.map((signal) => [signal.signalId, signal]));

  return block.sourceSignalIds.some((signalId) =>
    signals.get(signalId)?.temporalWindow !== undefined
  );
}

export function lintWeeklyInterpretationDraft(
  draft: WeeklyInterpretationDraft
): readonly WeeklyEditorialLintIssue[] {
  const issues: WeeklyEditorialLintIssue[] = [];
  const blocks = blockList(draft);
  const traceabilityIds = new Set(
    draft.traceability.map((block) => block.contentBlockId)
  );
  const signalIds = sourceSignalSet(draft);
  const textOwners = new Map<string, string>();
  const coreThemeTexts = new Set<string>();

  if (draft.hero.text.trim().length === 0) {
    issues.push({ code: 'EMPTY_HERO', contentBlockId: draft.hero.contentBlockId, message: 'Hero text is empty.' });
  }

  for (const block of blocks) {
    const text = normalizedText(block.text);

    if (text.length > 0) {
      const previousOwner = textOwners.get(text);
      if (previousOwner !== undefined && previousOwner !== block.contentBlockId) {
        issues.push({
          code: 'DUPLICATE_PARAGRAPH',
          contentBlockId: block.contentBlockId,
          message: `Text duplicates content block ${previousOwner}.`
        });
      } else {
        textOwners.set(text, block.contentBlockId);
      }
    }

    if (!traceabilityIds.has(block.contentBlockId) ||
        block.sourceSignalIds.length === 0 ||
        block.sourceFactRefs.length === 0 ||
        block.contentStyle !== draft.style ||
        block.templateVersion.length === 0 ||
        block.rulesVersion.id.length === 0 ||
        block.rulesVersion.version.length === 0) {
      issues.push({
        code: 'MISSING_TRACEABILITY',
        contentBlockId: block.contentBlockId,
        message: 'Content block is missing required traceability fields.'
      });
    }

    if (block.sourceSignalIds.some((signalId) => !signalIds.has(signalId)) ||
        TECHNICAL_ID_PATTERN.test(block.text)) {
      issues.push({
        code: 'TECHNICAL_ID_LEAK',
        contentBlockId: block.contentBlockId,
        message: 'Technical or unknown Signal identifiers are present in consumer prose.'
      });
    }

    if (CERTAINTY_PATTERNS.some((pattern) => pattern.test(block.text))) {
      issues.push({
        code: 'PROHIBITED_CERTAINTY',
        contentBlockId: block.contentBlockId,
        message: 'Consumer prose uses a prohibited certain-event formulation.'
      });
    }
  }

  for (const theme of draft.coreThemes) {
    const text = normalizedText(theme.content.text);
    if (coreThemeTexts.has(text)) {
      issues.push({
        code: 'REPEATED_CORE_THEME_TEXT',
        contentBlockId: theme.content.contentBlockId,
        message: 'Core themes repeat the same consumer text.'
      });
    }
    coreThemeTexts.add(text);
  }

  if (draft.bestWindow !== null && !hasTemporalEvidence(draft, draft.bestWindow)) {
    issues.push({
      code: 'UNSUPPORTED_BEST_WINDOW',
      contentBlockId: draft.bestWindow.contentBlockId,
      message: 'Best Window has no explicit temporal Signal evidence.'
    });
  }

  const shareLines = [
    draft.shareProjection.hook.text,
    draft.shareProjection.insight.text,
    draft.shareProjection.cta.text
  ];
  const shareText = shareLines.join('\n');
  if (shareText.length > 320 || shareLines.length > 5) {
    issues.push({
      code: 'SHARE_TOO_LONG',
      contentBlockId: draft.shareProjection.hook.contentBlockId,
      message: 'SHARE projection exceeds the compact review target.'
    });
  }

  if (draft.authority !== 'DEVELOPMENT_ONLY' ||
      blocks.some((block) => block.fixtureAuthority !== 'DEVELOPMENT_ONLY')) {
    issues.push({
      code: 'NON_DEVELOPMENT_AUTHORITY',
      message: 'Weekly POC output is not explicitly development-only.'
    });
  }

  return Object.freeze(issues.map((issue) => Object.freeze(issue)));
}

export function assertWeeklyEditorialQuality(
  draft: WeeklyInterpretationDraft
): WeeklyInterpretationDraft {
  const issues = lintWeeklyInterpretationDraft(draft);

  if (issues.length > 0) {
    throw new Error(
      `Weekly editorial lint failed: ${issues.map((issue) => `${issue.code}:${issue.message}`).join(' | ')}`
    );
  }

  return draft;
}
