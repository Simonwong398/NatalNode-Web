import {
  getAstrologyGlossaryNotation,
  type AstrologyGlossaryDomainKind,
  type AstrologyGlossaryNotation
} from '../../lib/astrology-glossary.js';

/**
 * Resolve a canonical symbolic notation without changing the source fact.
 * Missing notation stays missing so callers cannot accidentally invent a
 * scientific identity from presentation data.
 */
export function getAstrologyNotation(
  kind: AstrologyGlossaryDomainKind,
  value: unknown,
  notation: keyof AstrologyGlossaryNotation
): string | undefined {
  return getAstrologyGlossaryNotation(kind, value, notation);
}

export function getAstrologyGlyph(
  kind: AstrologyGlossaryDomainKind,
  value: unknown
): string | undefined {
  const glyph = getAstrologyNotation(kind, value, 'glyph');
  return glyph;
}

export type AstrologyGlyphProps = {
  kind: AstrologyGlossaryDomainKind;
  value: unknown;
  className?: string;
  decorative?: boolean;
  label?: string;
};

/** Small shared React primitive for symbolic language on fact-backed UI. */
export function AstrologyGlyph({
  kind,
  value,
  className,
  decorative = true,
  label
}: AstrologyGlyphProps) {
  const glyph = getAstrologyGlyph(kind, value);
  if (!glyph) return null;

  return (
    <span
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={!decorative ? label : undefined}
      className={className ? `nn-astrology-glyph ${className}` : 'nn-astrology-glyph'}
    >
      {glyph}
    </span>
  );
}
