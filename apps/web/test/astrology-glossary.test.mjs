import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  ASTROLOGY_GLOSSARY_CANONICAL_REVISION,
  ASTROLOGY_GLOSSARY_CONCEPT_IDS,
  ASTROLOGY_GLOSSARY_DEFERRED_CONCEPT_IDS,
  ASTROLOGY_GLOSSARY_ENTRIES,
  ASTROLOGY_GLOSSARY_PRODUCTION_LOCALE_VARIANTS,
  ASTROLOGY_GLOSSARY_REGISTRY,
  ASTROLOGY_GLOSSARY_TERMINOLOGY_VERSION,
  createAstrologyGlossaryRepository,
  getAstrologyGlossaryAvailability,
  getAstrologyGlossaryConceptId,
  getAstrologyGlossaryEntry,
  getAstrologyGlossaryNotation,
  isAstrologyGlossaryConceptId,
  resolveAstrologyDomainTerm,
  resolveAstrologyTerm
} from '../dist/astrology-glossary-characterization/lib/astrology-glossary.js';

const EXPECTED_P0_COUNT = 51;
const EXPECTED_P1_COUNT = 10;
const EXPECTED_P2_COUNT = 5;
const EXPECTED_TOTAL = 66;

test('the canonical registry exactly represents the frozen closed V1 inventory', () => {
  const registryIds = Object.keys(ASTROLOGY_GLOSSARY_REGISTRY);
  const entries = Object.values(ASTROLOGY_GLOSSARY_REGISTRY);

  assert.equal(ASTROLOGY_GLOSSARY_CONCEPT_IDS.length, EXPECTED_TOTAL);
  assert.equal(ASTROLOGY_GLOSSARY_ENTRIES.length, EXPECTED_TOTAL);
  assert.equal(registryIds.length, EXPECTED_TOTAL);
  assert.deepEqual(registryIds, ASTROLOGY_GLOSSARY_CONCEPT_IDS);
  assert.equal(new Set(registryIds).size, EXPECTED_TOTAL);
  assert.equal(entries.filter(({ priority }) => priority === 'P0').length, EXPECTED_P0_COUNT);
  assert.equal(entries.filter(({ priority }) => priority === 'P1').length, EXPECTED_P1_COUNT);
  assert.equal(entries.filter(({ priority }) => priority === 'P2').length, EXPECTED_P2_COUNT);

  for (const entry of entries) {
    assert.equal(isAstrologyGlossaryConceptId(entry.semanticConceptId), true);
    assert.strictEqual(
      getAstrologyGlossaryEntry(entry.semanticConceptId),
      ASTROLOGY_GLOSSARY_REGISTRY[entry.semanticConceptId]
    );
    assert.notEqual(entry.canonicalEnglishTerm.trim(), '');
    assert.equal(entry.canonicalTerminologyVersion, ASTROLOGY_GLOSSARY_TERMINOLOGY_VERSION);
    assert.equal(entry.canonicalTerminologyRevision, ASTROLOGY_GLOSSARY_CANONICAL_REVISION);
    assert.ok(['P0', 'P1', 'P2'].includes(entry.priority));
  }
});

test('aliases and notation remain presentation metadata under one semantic identity', () => {
  assert.deepEqual(ASTROLOGY_GLOSSARY_REGISTRY['angle.ascendant'].aliases, ['ASC']);
  assert.equal(ASTROLOGY_GLOSSARY_REGISTRY['angle.ascendant'].shortForm, 'ASC');
  assert.deepEqual(ASTROLOGY_GLOSSARY_REGISTRY['angle.midheaven'].aliases, ['MC']);
  assert.equal(ASTROLOGY_GLOSSARY_REGISTRY['body.sun'].notation.glyph, '☉');
  assert.equal(ASTROLOGY_GLOSSARY_REGISTRY['body.sun'].notation.rendererAbbreviation, 'Su');
  assert.equal(ASTROLOGY_GLOSSARY_REGISTRY['house.11'].notation.romanNumeral, 'XI');
  assert.deepEqual(ASTROLOGY_GLOSSARY_REGISTRY['house_system.equal'].aliases, ['Equal']);
  assert.deepEqual(ASTROLOGY_GLOSSARY_REGISTRY['chart_type.natal'].aliases, ['Birth chart']);
  assert.equal(getAstrologyGlossaryNotation('aspect', 'opposition', 'glyph'), '☍');
  assert.equal(getAstrologyGlossaryNotation('house', 12, 'romanNumeral'), 'XII');
  assert.equal(getAstrologyGlossaryNotation('body', 'not-a-body', 'glyph'), undefined);
});

test('deferred concepts and unknown identities cannot enter the active registry', () => {
  assert.deepEqual(ASTROLOGY_GLOSSARY_DEFERRED_CONCEPT_IDS, [
    'angle.descendant',
    'angle.imum_coeli',
    'technique.transit',
    'technique.profection',
    'technique.synastry',
    'technique.solar_return'
  ]);

  for (const conceptId of ASTROLOGY_GLOSSARY_DEFERRED_CONCEPT_IDS) {
    assert.equal(isAstrologyGlossaryConceptId(conceptId), false, conceptId);
  }

  assert.equal(isAstrologyGlossaryConceptId('body.sun'), true);
  assert.equal(isAstrologyGlossaryConceptId('body.sunny'), false);
  assert.throws(() => getAstrologyGlossaryEntry('body.sunny'), TypeError);
  assert.throws(() => resolveAstrologyTerm('body.sunny', 'en'), TypeError);
});

test('English resolves directly to canonical terminology without an English variant', () => {
  const result = resolveAstrologyTerm('aspect.opposition', 'en');

  assert.deepEqual(result, {
    conceptId: 'aspect.opposition',
    requestedLocale: 'en',
    resolvedLocale: 'en',
    displayTerm: 'Opposition',
    fallbackUsed: false,
    availability: 'CANONICAL_ENGLISH',
    canonicalRevision: ASTROLOGY_GLOSSARY_CANONICAL_REVISION
  });
  assert.equal(ASTROLOGY_GLOSSARY_PRODUCTION_LOCALE_VARIANTS.length, 0);
});

test('ja and zh-Hant use direct canonical English fallback when no approved variant exists', () => {
  for (const requestedLocale of ['ja', 'zh-Hant']) {
    const result = resolveAstrologyTerm('body.sun', requestedLocale);

    assert.equal(result.requestedLocale, requestedLocale);
    assert.equal(result.resolvedLocale, 'en');
    assert.equal(result.displayTerm, 'Sun');
    assert.equal(result.fallbackUsed, true);
    assert.equal(result.availability, 'ENGLISH_FALLBACK');
    assert.equal(result.canonicalRevision, ASTROLOGY_GLOSSARY_CANONICAL_REVISION);
  }
});

test('only an APPROVED and CURRENT variant reviewed against the current revision is publishable', () => {
  const repository = createAstrologyGlossaryRepository([
    {
      semanticConceptId: 'body.sun',
      locale: 'ja',
      professionalDisplayTerm: 'SYNTHETIC_APPROVED_CURRENT_BODY_SUN',
      shortForm: 'SYNTHETIC_SUN',
      aliases: ['SYNTHETIC_ALIAS'],
      canonicalTerminologyVersion: ASTROLOGY_GLOSSARY_TERMINOLOGY_VERSION,
      approvalState: 'APPROVED',
      currentness: 'CURRENT',
      reviewedAgainstCanonicalTerminologyRevision: ASTROLOGY_GLOSSARY_CANONICAL_REVISION
    },
    {
      semanticConceptId: 'body.moon',
      locale: 'ja',
      professionalDisplayTerm: 'SYNTHETIC_OUTDATED_BODY_MOON',
      canonicalTerminologyVersion: ASTROLOGY_GLOSSARY_TERMINOLOGY_VERSION,
      approvalState: 'APPROVED',
      currentness: 'OUTDATED',
      reviewedAgainstCanonicalTerminologyRevision: ASTROLOGY_GLOSSARY_CANONICAL_REVISION
    },
    {
      semanticConceptId: 'body.mercury',
      locale: 'ja',
      professionalDisplayTerm: 'SYNTHETIC_DRAFT_BODY_MERCURY',
      canonicalTerminologyVersion: ASTROLOGY_GLOSSARY_TERMINOLOGY_VERSION,
      approvalState: 'DRAFT',
      currentness: 'CURRENT',
      reviewedAgainstCanonicalTerminologyRevision: ASTROLOGY_GLOSSARY_CANONICAL_REVISION
    },
    {
      semanticConceptId: 'body.venus',
      locale: 'ja',
      professionalDisplayTerm: 'SYNTHETIC_WRONG_REVISION_BODY_VENUS',
      canonicalTerminologyVersion: ASTROLOGY_GLOSSARY_TERMINOLOGY_VERSION,
      approvalState: 'APPROVED',
      currentness: 'CURRENT',
      reviewedAgainstCanonicalTerminologyRevision: 'v0'
    },
    {
      semanticConceptId: 'body.mars',
      locale: 'es',
      professionalDisplayTerm: 'SYNTHETIC_OTHER_LOCALE_BODY_MARS',
      canonicalTerminologyVersion: ASTROLOGY_GLOSSARY_TERMINOLOGY_VERSION,
      approvalState: 'APPROVED',
      currentness: 'CURRENT',
      reviewedAgainstCanonicalTerminologyRevision: ASTROLOGY_GLOSSARY_CANONICAL_REVISION
    }
  ]);

  const approved = resolveAstrologyTerm('body.sun', 'ja', repository);
  assert.equal(approved.displayTerm, 'SYNTHETIC_APPROVED_CURRENT_BODY_SUN');
  assert.equal(approved.resolvedLocale, 'ja');
  assert.equal(approved.fallbackUsed, false);
  assert.equal(approved.availability, 'LOCALIZED_APPROVED_CURRENT');
  assert.equal(approved.shortForm, 'SYNTHETIC_SUN');
  assert.deepEqual(approved.aliases, ['SYNTHETIC_ALIAS']);

  for (const conceptId of ['body.moon', 'body.mercury', 'body.venus']) {
    const result = resolveAstrologyTerm(conceptId, 'ja', repository);
    assert.equal(result.resolvedLocale, 'en', conceptId);
    assert.equal(result.fallbackUsed, true, conceptId);
    assert.equal(result.availability, 'ENGLISH_FALLBACK', conceptId);
  }

  const noCrossLocaleFallback = resolveAstrologyTerm('body.mars', 'fr', repository);
  assert.equal(noCrossLocaleFallback.displayTerm, 'Mars');
  assert.equal(noCrossLocaleFallback.resolvedLocale, 'en');
  assert.equal(noCrossLocaleFallback.fallbackUsed, true);

  const wrongVersionRepository = createAstrologyGlossaryRepository([
    {
      semanticConceptId: 'body.pluto',
      locale: 'ja',
      professionalDisplayTerm: 'SYNTHETIC_WRONG_VERSION_BODY_PLUTO',
      canonicalTerminologyVersion: '0.9',
      approvalState: 'APPROVED',
      currentness: 'CURRENT',
      reviewedAgainstCanonicalTerminologyRevision: ASTROLOGY_GLOSSARY_CANONICAL_REVISION
    }
  ]);
  const wrongVersion = resolveAstrologyTerm('body.pluto', 'ja', wrongVersionRepository);
  assert.equal(wrongVersion.displayTerm, 'Pluto');
  assert.equal(wrongVersion.fallbackUsed, true);
  assert.equal(wrongVersion.availability, 'ENGLISH_FALLBACK');
});

test('invalid locales fail deterministically and resolver never uses arbitrary lookup input', () => {
  assert.throws(() => resolveAstrologyTerm('body.sun', 'zh-Hans'), TypeError);
  assert.throws(() => resolveAstrologyTerm('body.sun', '/ja'), TypeError);
  assert.throws(
    () => createAstrologyGlossaryRepository([
      {
        semanticConceptId: 'unknown.concept',
        locale: 'ja',
        professionalDisplayTerm: 'SYNTHETIC_UNKNOWN_CONCEPT',
        canonicalTerminologyVersion: ASTROLOGY_GLOSSARY_TERMINOLOGY_VERSION,
        approvalState: 'APPROVED',
        currentness: 'CURRENT',
        reviewedAgainstCanonicalTerminologyRevision: ASTROLOGY_GLOSSARY_CANONICAL_REVISION
      }
    ]),
    TypeError
  );
});

test('current domain values map to glossary identities without changing the values', () => {
  const domainValues = {
    body: 'Sun',
    sign: 'Taurus',
    signElement: 'Earth',
    signModality: 'Fixed',
    house: 11,
    angle: 'ASC',
    houseSystem: 'Placidus',
    aspect: 'opposition',
    orb: 'orb',
    phase: 'APPLYING',
    motion: 'RETROGRADE',
    chartType: 'natal',
    zodiacModel: 'TROPICAL',
    skyEvent: 'INGRESS',
    lunarPhase: 'FULL_MOON'
  };
  const originalValues = { ...domainValues };

  assert.equal(getAstrologyGlossaryConceptId('body', domainValues.body), 'body.sun');
  assert.equal(getAstrologyGlossaryConceptId('sign', domainValues.sign), 'sign.taurus');
  assert.equal(getAstrologyGlossaryConceptId('sign_element', domainValues.signElement), 'sign_element.earth');
  assert.equal(getAstrologyGlossaryConceptId('sign_modality', domainValues.signModality), 'sign_modality.fixed');
  assert.equal(getAstrologyGlossaryConceptId('house', domainValues.house), 'house.11');
  assert.equal(getAstrologyGlossaryConceptId('angle', domainValues.angle), 'angle.ascendant');
  assert.equal(getAstrologyGlossaryConceptId('house_system', domainValues.houseSystem), 'house_system.placidus');
  assert.equal(getAstrologyGlossaryConceptId('aspect', domainValues.aspect), 'aspect.opposition');
  assert.equal(getAstrologyGlossaryConceptId('aspect', domainValues.orb), 'aspect.orb');
  assert.equal(getAstrologyGlossaryConceptId('aspect_phase', domainValues.phase), 'aspect_phase.applying');
  assert.equal(getAstrologyGlossaryConceptId('motion', domainValues.motion), 'motion.retrograde');
  assert.equal(getAstrologyGlossaryConceptId('chart_type', domainValues.chartType), 'chart_type.natal');
  assert.equal(getAstrologyGlossaryConceptId('zodiac_model', domainValues.zodiacModel), 'zodiac_model.tropical');
  assert.equal(getAstrologyGlossaryConceptId('sky_event', domainValues.skyEvent), 'sky_event.ingress');
  assert.equal(getAstrologyGlossaryConceptId('lunar_phase', domainValues.lunarPhase), 'lunar_phase.full_moon');

  assert.equal(resolveAstrologyDomainTerm('body', domainValues.body, 'ja').displayTerm, 'Sun');
  assert.equal(resolveAstrologyDomainTerm('sign', domainValues.sign, 'ja').displayTerm, 'Taurus');
  assert.equal(resolveAstrologyDomainTerm('sign_element', domainValues.signElement, 'ja').displayTerm, 'Earth');
  assert.equal(resolveAstrologyDomainTerm('sign_modality', domainValues.signModality, 'ja').displayTerm, 'Fixed');
  assert.equal(resolveAstrologyDomainTerm('house', domainValues.house, 'ja').displayTerm, '11th House');
  assert.equal(resolveAstrologyDomainTerm('angle', domainValues.angle, 'ja').displayTerm, 'Ascendant');
  assert.equal(resolveAstrologyDomainTerm('aspect', domainValues.aspect, 'ja').displayTerm, 'Opposition');
  assert.equal(resolveAstrologyDomainTerm('aspect_phase', domainValues.phase, 'ja').displayTerm, 'Applying');
  assert.equal(resolveAstrologyDomainTerm('motion', domainValues.motion, 'ja').displayTerm, 'Retrograde');
  assert.equal(resolveAstrologyDomainTerm('house_system', 'EQUAL', 'ja').displayTerm, 'Equal House');
  assert.deepEqual(domainValues, originalValues);
});

test('availability is exposed for callers before rendering a professional term', () => {
  assert.equal(
    getAstrologyGlossaryAvailability('body.sun', 'en'),
    'CANONICAL_ENGLISH'
  );
  assert.equal(
    getAstrologyGlossaryAvailability('body.sun', 'ja'),
    'ENGLISH_FALLBACK'
  );
});

test('representative P0 presentation paths depend on the glossary resolver and keep Class A separate', async () => {
  const [notationSource, rendererSource, workspaceSource, detailsSource, uiCatalogSource] = await Promise.all([
    readFile(new URL('../src/features/chart-workspace/AstrologicalNotation.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/chart-renderer/ChartRenderer.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/chart-workspace/ChartWorkspaceView.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/calculation-details/CalculationDetails.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/ui-catalog.ts', import.meta.url), 'utf8')
  ]);

  assert.match(notationSource, /resolveAstrologyDomainTerm/u);
  assert.match(notationSource, /getAstrologyGlossaryNotation/u);
  assert.match(rendererSource, /resolveAstrologyDomainTerm/u);
  assert.match(rendererSource, /getAstrologyGlossaryNotation/u);
  assert.match(workspaceSource, /resolveAstrologyTerm/u);
  assert.match(detailsSource, /resolveAstrologyDomainTerm/u);
  assert.doesNotMatch(uiCatalogSource, /body\.sun|aspect\.opposition|house_system\.placidus/u);
});

test('remaining current Class B surfaces use the shared resolver boundary', async () => {
  const sources = await Promise.all([
    readFile(new URL('../src/features/chart-input/BirthAdvancedSettings.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/public-sky/CurrentSkyInstrument.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/sign-lookup.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/aspect-lookup.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/house-lookup.ts', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/tools/sign-lookup.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/tools/aspect-lookup.astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/tools/house-lookup.astro', import.meta.url), 'utf8')
  ]);
  const [birthSettings, currentSky, signLookup, aspectLookup, houseLookup, signPage, aspectPage, housePage] = sources;

  assert.match(birthSettings, /resolveAstrologyDomainTerm/u);
  assert.match(currentSky, /resolveAstrologyDomainTerm/u);
  assert.match(currentSky, /getAstrologyGlossaryNotation/u);
  assert.doesNotMatch(currentSky, /const BODY_GLYPHS|const ASPECT_GLYPHS|const BODY_ABBREVIATIONS/u);
  assert.match(signLookup, /resolveAstrologyDomainTerm/u);
  assert.match(aspectLookup, /resolveAstrologyDomainTerm/u);
  assert.match(houseLookup, /resolveAstrologyDomainTerm/u);
  assert.match(signPage, /data-glossary-locale=\{locale\}/u);
  assert.match(aspectPage, /data-glossary-locale=\{locale\}/u);
  assert.match(housePage, /data-glossary-locale=\{locale\}/u);
});
