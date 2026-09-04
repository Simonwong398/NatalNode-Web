import type { SupportedLocale } from '@/lib/localization';

export interface PublicEditorialLink {
  readonly href: string;
  readonly label: string;
}

export interface PublicEditorialSection {
  readonly id: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly bullets?: readonly string[];
  readonly link?: PublicEditorialLink;
}

/**
 * Long-form public copy is kept outside route components. Every admitted
 * locale has a complete value; callers must not silently substitute English.
 */
export interface PublicEditorialPage {
  readonly locale: SupportedLocale;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly sections: readonly PublicEditorialSection[];
}
