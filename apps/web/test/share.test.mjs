import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  canonicalizeShareMatchPair,
  getDiscoverMatchPathForShare,
  getShareElementsModesPath,
  getShareMatchPath,
  getShareMatchSlug,
  getShareSignPath,
  parseShareElementModeConcept,
  parseShareMatchSlug,
  SHARE_ELEMENT_MODE_CONCEPTS,
  SHARE_MATCH_PAIRS
} from '../dist/share-characterization/lib/share-links.js';
import {
  createElementsModesCardModel,
  createSignCardModel,
  createSignMatchCardModel
} from '../dist/share-characterization/features/share/share-card-models.js';
import {
  copyShareUrl,
  createSharePayload
} from '../dist/share-characterization/features/share/share-actions.js';
import { SUPPORTED_LOCALES } from '../dist/share-characterization/lib/localization.js';

const EXPECTED_LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh-Hant'];
const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const shareLinksSource = source('../src/lib/share-links.ts');
const shareModelsSource = source('../src/features/share/share-card-models.ts');
const shareActionsSource = source('../src/features/share/share-actions.ts');
const shareCardSource = source('../src/features/share/ShareCard.astro');
const signCardSource = source('../src/features/share/SignCard.astro');
const matchCardSource = source('../src/features/share/SignMatchCard.astro');
const elementsCardSource = source('../src/features/share/ElementsModesCard.astro');
const signRouteSource = source('../src/pages/share/sign/[sign].astro');
const matchRouteSource = source('../src/pages/share/match/[pair].astro');
const elementsRouteSource = source('../src/pages/share/elements-modes/[concept].astro');
const localizedMatchRouteSource = source('../src/pages/[locale]/share/match/[pair].astro');
const localizedElementsRouteSource = source('../src/pages/[locale]/share/elements-modes/[concept].astro');
const zodiacSource = source('../src/features/discover/ZodiacExplorer.tsx');
const discoverMatchSource = source('../src/features/discover/SignMatch.tsx');
const discoverElementsSource = source('../src/features/discover/ElementsModesExplorer.tsx');
const sitemapSource = source('../src/pages/sitemap.xml.ts');
const seoHeadSource = source('../src/components/SeoHead.astro');

const privateDataPattern = /(?:birth(?:date|time)?|latitude|longitude|timezone|coordinate|chartId|userId|accessToken)/iu;

test('Share route identities are closed, canonical, and locale-aware', () => {
  assert.deepEqual(SUPPORTED_LOCALES, EXPECTED_LOCALES);
  assert.equal(SHARE_MATCH_PAIRS.length, 78);
  assert.equal(SHARE_ELEMENT_MODE_CONCEPTS.length, 7);
  assert.deepEqual(
    SHARE_MATCH_PAIRS.slice(0, 3).map(({ signA, signB }) => `${signA}--${signB}`),
    ['aries--aries', 'aries--taurus', 'aries--gemini']
  );
  assert.equal(getShareMatchSlug({ signA: 'pisces', signB: 'aries' }), 'aries--pisces');
  assert.deepEqual(canonicalizeShareMatchPair('pisces', 'aries'), {
    signA: 'aries',
    signB: 'pisces'
  });
  assert.equal(parseShareMatchSlug('pisces--aries'), null);
  assert.equal(parseShareMatchSlug('aries--not-a-sign'), null);
  assert.equal(parseShareElementModeConcept('element-fire')?.value, 'Fire');
  assert.equal(parseShareElementModeConcept('fire'), null);
  assert.equal(getShareSignPath('fr', 'aries'), '/fr/share/sign/aries/');
  assert.equal(
    getShareMatchPath('ja', { signA: 'pisces', signB: 'aries' }),
    '/ja/share/match/aries--pisces/'
  );
  assert.equal(
    getShareElementsModesPath('zh-Hant', { kind: 'modality', value: 'Fixed' }),
    '/zh-Hant/share/elements-modes/modality-fixed/'
  );
  assert.equal(
    getDiscoverMatchPathForShare('en', { signA: 'pisces', signB: 'aries' }),
    '/en/discover/match/?a=aries&b=pisces'
  );
  assert.match(shareLinksSource, /Core zodiac order/u);
  assert.match(shareLinksSource, /Rejects reversed\/non-canonical slugs/u);
});

test('SignCard models use only existing bounded Discover facts', () => {
  for (const locale of EXPECTED_LOCALES) {
    const model = createSignCardModel(locale, 'aries');
    assert.equal(model.kind, 'sign');
    assert.equal(model.signId, 'aries');
    assert.equal(model.locale, locale);
    assert.equal(model.canonicalPath, `/${locale}/share/sign/aries/`);
    assert.equal(model.ctaHref, `/${locale}/discover/zodiac/aries/`);
    assert.notEqual(model.summary.trim(), '');
    assert.notEqual(model.chartFunction.trim(), '');
    assert.equal(Object.isFrozen(model), true);
    assert.doesNotMatch(JSON.stringify(model), privateDataPattern, locale);
  }

  assert.notEqual(createSignCardModel('en', 'aries').title, createSignCardModel('ja', 'aries').title);
  assert.match(shareModelsSource, /getZodiacSignContent/u);
  assert.match(shareModelsSource, /getZodiacElementContent/u);
  assert.match(signCardSource, /model\.summary/u);
  assert.match(signCardSource, /model\.chartFunction/u);
});

test('SignMatchCard canonicalizes reversed selections without compatibility scoring', () => {
  const forward = createSignMatchCardModel('en', { signA: 'aries', signB: 'scorpio' });
  const reverse = createSignMatchCardModel('en', { signA: 'scorpio', signB: 'aries' });

  assert.equal(forward.canonicalPath, '/en/share/match/aries--scorpio/');
  assert.equal(reverse.canonicalPath, forward.canonicalPath);
  assert.deepEqual(forward.pair, reverse.pair);
  assert.equal(forward.signs[0].id, 'aries');
  assert.equal(forward.signs[1].id, 'scorpio');
  assert.notEqual(forward.elementRelationship.trim(), '');
  assert.notEqual(forward.modalityRelationship.trim(), '');
  assert.doesNotMatch(JSON.stringify(forward), /(?:score|compatib|soulmate|perfect|toxic)/iu);
  assert.match(matchCardSource, /model\.pair/u);
  assert.match(matchCardSource, /elementRelationship/u);
  assert.match(matchCardSource, /modalityRelationship/u);
  assert.doesNotMatch(shareModelsSource, /calculate|fetch\(|axios|ephemeris/iu);
});

test('ElementsModesCard models existing element or modality membership only', () => {
  const fire = createElementsModesCardModel('en', 'element-fire');
  const fixed = createElementsModesCardModel('zh-Hant', 'modality-fixed');

  assert.equal(fire.concept.kind, 'element');
  assert.equal(fire.concept.value, 'Fire');
  assert.deepEqual(fire.memberSigns.map(({ id }) => id), ['aries', 'leo', 'sagittarius']);
  assert.equal(fixed.concept.kind, 'modality');
  assert.equal(fixed.concept.value, 'Fixed');
  assert.deepEqual(fixed.memberSigns.map(({ id }) => id), ['taurus', 'leo', 'scorpio', 'aquarius']);
  assert.equal(Object.isFrozen(fire), true);
  assert.equal(Object.isFrozen(fire.memberSigns), true);
  assert.doesNotMatch(JSON.stringify(fire), privateDataPattern);
  assert.match(elementsCardSource, /memberSigns/u);
  assert.match(elementsRouteSource, /parseShareElementModeConcept/u);
  assert.match(localizedElementsRouteSource, /SHARE_ELEMENT_MODE_CONCEPTS/u);
});

test('Share actions expose native payloads and fail closed when copy is unconfirmed', async () => {
  assert.deepEqual(
    createSharePayload('Title', 'Bounded text', 'https://natalnode.com/en/share/sign/aries/'),
    {
      title: 'Title',
      text: 'Bounded text',
      url: 'https://natalnode.com/en/share/sign/aries/'
    }
  );

  let modernValue = '';
  await copyShareUrl('https://natalnode.com/en/share/sign/aries/', {
    clipboard: {
      writeText: async (value) => {
        modernValue = value;
      }
    }
  });
  assert.equal(modernValue, 'https://natalnode.com/en/share/sign/aries/');

  let fallbackValue = '';
  const textarea = {
    value: '',
    style: {},
    setAttribute() {},
    focus() {},
    select() {},
    remove() {
      fallbackValue = this.value;
    }
  };
  const fallbackDocument = {
    body: {
      appendChild(node) {
        node.value = 'https://natalnode.com/en/share/sign/aries/';
      }
    },
    createElement() {
      return textarea;
    },
    execCommand(command) {
      assert.equal(command, 'copy');
      return true;
    }
  };
  await copyShareUrl('https://natalnode.com/en/share/sign/aries/', {
    document: fallbackDocument
  });
  assert.equal(fallbackValue, 'https://natalnode.com/en/share/sign/aries/');

  await assert.rejects(
    copyShareUrl('https://natalnode.com/en/share/sign/aries/', {
      document: {
        body: { appendChild() {} },
        createElement: () => textarea,
        execCommand: () => false
      }
    })
  );
  assert.match(shareActionsSource, /Clipboard copy was not confirmed/u);
  assert.match(shareCardSource, /ShareCardActions/u);
});

test('Share pages, metadata, sitemap, and Discover affordances stay bounded', () => {
  assert.match(signRouteSource, /createSignCardModel/u);
  assert.match(signRouteSource, /createShareSeo/u);
  assert.match(matchRouteSource, /SHARE_MATCH_PAIRS/u);
  assert.match(matchRouteSource, /parseShareMatchSlug/u);
  assert.match(localizedMatchRouteSource, /SHARE_MATCH_PAIRS/u);
  assert.match(seoHeadSource, /og:locale/u);
  assert.match(shareCardSource, /aspect-\[1\.91\/1\]/u);
  assert.doesNotMatch(shareCardSource, /og:image/u);
  assert.match(sitemapSource, /sharePaths/u);
  assert.match(sitemapSource, /SHARE_MATCH_PAIRS/u);
  assert.doesNotMatch(sitemapSource, /[?&](?:a|b)=/u);
  assert.match(zodiacSource, /getShareSignPath/u);
  assert.match(discoverMatchSource, /getShareMatchPath/u);
  assert.match(discoverElementsSource, /getShareElementsModesPath/u);
});
