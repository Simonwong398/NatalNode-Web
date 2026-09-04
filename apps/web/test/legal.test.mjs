import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  APPROVED_LEGAL_CONTENT,
  LEGAL_CONTENT_STATUS,
  getApprovedLegalContent,
  getLegalMetadata
} from '../dist/legal-characterization/lib/legal-content.js';
import {
  LEGAL_PRODUCTION_LAUNCH_GATE,
  LEGAL_SERVICE_REGISTRY,
  LEGAL_UNRESOLVED_VARIABLES
} from '../dist/legal-characterization/lib/legal-metadata.js';
import { SUPPORTED_LOCALES } from '../dist/legal-characterization/lib/localization.js';

const EXPECTED_LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant'];
const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const json = (value) => JSON.stringify(value);

const privacyRouteSource = source('../src/pages/privacy.astro');
const termsRouteSource = source('../src/pages/terms.astro');
const localizedPrivacyRouteSource = source('../src/pages/[locale]/privacy.astro');
const localizedTermsRouteSource = source('../src/pages/[locale]/terms.astro');
const siteLayoutSource = source('../src/layouts/SiteLayout.astro');
const middlewareSource = source('../src/middleware.ts');
const privacyDoc = source('../../../docs/legal/NATALNODE_PRIVACY_POLICY_V1.md');
const termsDoc = source('../../../docs/legal/NATALNODE_TERMS_OF_SERVICE_V1.md');
const gateDoc = source('../../../docs/legal/NATALNODE_LEGAL_PUBLICATION_GATE_V1.md');

test('approved legal authority covers every frozen locale without English fallback', () => {
  assert.deepEqual(SUPPORTED_LOCALES, EXPECTED_LOCALES);
  assert.equal(LEGAL_CONTENT_STATUS, 'PRODUCT_OWNER_APPROVED_PRECOMMERCIAL');
  assert.deepEqual(Object.keys(APPROVED_LEGAL_CONTENT), ['privacy', 'terms']);

  for (const locale of EXPECTED_LOCALES) {
    const privacy = getApprovedLegalContent('privacy', locale);
    const terms = getApprovedLegalContent('terms', locale);

    assert.ok(privacy);
    assert.ok(terms);
    assert.equal(privacy.locale, locale);
    assert.equal(terms.locale, locale);
    assert.equal(privacy.sections.length, 15);
    assert.equal(terms.sections.length, 25);
    assert.deepEqual(
      privacy.sections.map(({ number }) => number),
      Array.from({ length: 15 }, (_, index) => String(index + 1))
    );
    assert.deepEqual(
      terms.sections.map(({ number }) => number),
      Array.from({ length: 25 }, (_, index) => String(index + 1))
    );
    assert.ok(privacy.introduction.length >= 4);
    assert.ok(terms.introduction.length >= 4);
    assert.ok(privacy.sections.every(({ paragraphs }) => paragraphs.join(' ').length > 40));
    assert.ok(terms.sections.every(({ paragraphs }) => paragraphs.join(' ').length > 40));
    assert.doesNotMatch(json(privacy), /\[[A-Z_]+\]/u);
    assert.doesNotMatch(json(terms), /\[[A-Z_]+\]/u);
  }

  const englishPrivacy = getApprovedLegalContent('privacy', 'en');
  const spanishPrivacy = getApprovedLegalContent('privacy', 'es');
  const englishTerms = getApprovedLegalContent('terms', 'en');
  const japaneseTerms = getApprovedLegalContent('terms', 'ja');
  assert.notEqual(spanishPrivacy.title, englishPrivacy.title);
  assert.notEqual(spanishPrivacy.sections[0].paragraphs[0], englishPrivacy.sections[0].paragraphs[0]);
  assert.notEqual(japaneseTerms.title, englishTerms.title);
  assert.notEqual(japaneseTerms.sections[0].paragraphs[0], englishTerms.sections[0].paragraphs[0]);
});

test('canonical sources, variables, provenance, and publication gate stay explicit', () => {
  assert.match(privacyDoc, /^# NatalNode Privacy Policy V1/mu);
  assert.match(privacyDoc, /^## 15\. Contact/mu);
  assert.match(termsDoc, /^# NatalNode Terms of Service V1/mu);
  assert.match(termsDoc, /^## 25\. Contact/mu);
  assert.match(privacyDoc, /\[OPERATOR_LEGAL_NAME\]/u);
  assert.match(termsDoc, /\[GOVERNING_LAW_AND_FORUM_CLAUSE\]/u);
  assert.match(gateDoc, /PRECOMMERCIAL_NOT_LAUNCH_FINAL/u);
  assert.match(gateDoc, /PRODUCT_TRANSLATION_NOT_LEGAL_COUNSEL_CERTIFIED/u);
  assert.deepEqual(
    Object.keys(LEGAL_UNRESOLVED_VARIABLES),
    [
      'LEGAL_OPERATOR_IDENTITY',
      'OPERATOR_ADDRESS',
      'EFFECTIVE_DATE',
      'PRIVACY_CONTACT_EMAIL',
      'SUPPORT_CONTACT_EMAIL',
      'LEGAL_CONTACT_EMAIL',
      'GOVERNING_LAW_AND_FORUM_CLAUSE'
    ]
  );
  assert.ok(Object.values(LEGAL_UNRESOLVED_VARIABLES).every((value) => value === null));
  assert.equal(getLegalMetadata().productionLaunchFinal, false);
  assert.equal(getLegalMetadata().publicationStatus, 'PRECOMMERCIAL_NOT_LAUNCH_FINAL');
  assert.ok(LEGAL_PRODUCTION_LAUNCH_GATE.length >= 11);
  assert.ok(LEGAL_PRODUCTION_LAUNCH_GATE.every(({ satisfied, blocking }) => satisfied === false && blocking === true));
  assert.doesNotMatch(json(LEGAL_UNRESOLVED_VARIABLES), /NatalNode LLC|EIN|registered address/u);
  assert.doesNotMatch(json(LEGAL_SERVICE_REGISTRY), /Swiss Ephemeris|Astro-Seek|AstroDienst|Astrodienst/u);
  assert.equal(
    LEGAL_SERVICE_REGISTRY.find(({ id }) => id === 'astronomy-provider')?.status,
    'PROVIDER DECISION DEFERRED'
  );
  assert.equal(
    LEGAL_SERVICE_REGISTRY.find(({ id }) => id === 'astronomy-provider')?.provider,
    null
  );
  assert.equal(
    LEGAL_SERVICE_REGISTRY.find(({ id }) => id === 'geonames')?.attributionRequired,
    true
  );
});

test('legal routes render real content through the existing layout and SEO boundary', () => {
  for (const routeSource of [privacyRouteSource, termsRouteSource]) {
    assert.match(routeSource, /getApprovedLegalContent/u);
    assert.match(routeSource, /createPublicSeo/u);
    assert.match(routeSource, /content\.introduction/u);
    assert.match(routeSource, /content\.effectiveDate/u);
    assert.match(routeSource, /content\.publicationNotice/u);
    assert.match(routeSource, /section\.blocks/u);
    assert.match(routeSource, /<h1/u);
    assert.match(routeSource, /aria-labelledby/u);
    assert.doesNotMatch(routeSource, /og:image|ShareCard|client:load/u);
  }
  assert.match(localizedPrivacyRouteSource, /getLocaleStaticPaths/u);
  assert.match(localizedTermsRouteSource, /getLocaleStaticPaths/u);
  assert.match(middlewareSource, /'\/privacy'/u);
  assert.match(middlewareSource, /'\/terms'/u);
  assert.ok(siteLayoutSource.includes("href={localize('/privacy')}"));
  assert.ok(siteLayoutSource.includes("href={localize('/terms')}"));
  assert.match(siteLayoutSource, /<footer/u);
});

test('unknown locale content fails closed rather than falling back', () => {
  assert.equal(getApprovedLegalContent('privacy', 'zh-Hans'), null);
  assert.equal(getApprovedLegalContent('terms', 'zh-Hans'), null);
  assert.equal(existsSync(new URL('../src/pages/[locale]/privacy.astro', import.meta.url)), true);
  assert.equal(existsSync(new URL('../src/pages/[locale]/terms.astro', import.meta.url)), true);
});
