import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { isChartResult } from '@natalnode/engine-client';

import {
  createEngineAngleSignPresentationV1,
  projectEngineResultToWebV2
} from '../dist/development/engine-result-adapter/engine-result-adapter.js';

const EXPECTED_ENGINE_HEAD = 'a6125470edda64fb297c0e848f212fe215137bb2';
const ENGINE_REQUEST = Object.freeze({
  input: Object.freeze({
    instant: '2025-10-22T09:52:00.000Z',
    latitude: 51.4779,
    longitude: -0.0015
  }),
  options: Object.freeze({ houseSystem: 'placidus' })
});
const ENGINE_BODY_ID_TO_WEB = Object.freeze({
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
  jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto'
});

async function calculateActualEngine() {
  const configuredRoot = process.env.NATALNODE_ENGINE_CHECKOUT;
  assert.ok(typeof configuredRoot === 'string' && configuredRoot.length > 0,
    'Set NATALNODE_ENGINE_CHECKOUT to the verified Engine checkout for this test.');
  const checkoutRoot = resolve(configuredRoot);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: checkoutRoot, encoding: 'utf8'
  }).trim(), EXPECTED_ENGINE_HEAD);
  assert.equal(execFileSync('git', ['diff', '--name-only', 'HEAD', '--'], {
    cwd: checkoutRoot, encoding: 'utf8'
  }).trim(), '', 'Tracked Engine source must remain unchanged.');

  const engineRoot = join(checkoutRoot, 'packages', 'engine');
  const engineApi = await import(pathToFileURL(join(engineRoot, 'dist/src/index.js')).href);
  const { FakeAstronomyProvider } = await import(pathToFileURL(
    join(engineRoot, 'dist/tests/fixtures/fake-astronomy-provider.js')
  ).href);
  return {
    chart: engineApi.createEngine(new FakeAstronomyProvider()).calculateChart(
      ENGINE_REQUEST.input,
      ENGINE_REQUEST.options
    ),
    signForLongitude: engineApi.signForLongitude,
    policy: engineApi.NATALNODE_POLICY
  };
}

const ACTUAL_ENGINE = await calculateActualEngine();
const ACTUAL_ENGINE_RESULT = ACTUAL_ENGINE.chart;

function clone(value) {
  return structuredClone(value);
}

function assertRejected(result, expectedCode) {
  assert.equal(result.outcome, 'REJECTED');
  assert.deepEqual(result.error, { code: expectedCode });
}

function createPresentation(chart = ACTUAL_ENGINE_RESULT, expectedRequest = ENGINE_REQUEST) {
  return createEngineAngleSignPresentationV1({
    rawResult: chart,
    expectedRequest,
    signForLongitude: ACTUAL_ENGINE.signForLongitude,
    policy: ACTUAL_ENGINE.policy
  });
}

function mapResult(chart = ACTUAL_ENGINE_RESULT, expectedRequest = ENGINE_REQUEST, presentation) {
  const signRecord = presentation ?? createPresentation(chart, expectedRequest).presentation;
  return projectEngineResultToWebV2(chart, expectedRequest, signRecord);
}

test('actual pinned Engine result maps deterministically to the isolated Web V2 fact view', async () => {
  const engineResult = ACTUAL_ENGINE_RESULT;
  const first = mapResult(engineResult);
  const second = mapResult(clone(engineResult));

  assert.equal(first.outcome, 'MAPPED');
  assert.deepEqual(first, second);
  const chart = first.chart;
  assert.equal(chart.schemaVersion, '2.0.0');
  assert.equal(chart.engineVersion, engineResult.engineVersion);
  assert.equal(chart.bodies.length, 10);
  assert.deepEqual(chart.bodies.map(({ bodyId }) => bodyId), [
    'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
  ]);
  assert.equal(chart.angles.length, 2);
  assert.equal(chart.houses.cusps.length, 12);
  assert.equal(chart.houses.system, 'Placidus');
  assert.equal(chart.aspects.length, engineResult.aspects.length);
  assert.equal('calculationStatus' in chart, false);
  assert.equal('metadata' in chart, false);
  assert.equal(isChartResult(chart), false, 'Web V2 must remain outside production ChartResult acceptance.');
});

test('validator rejects missing and duplicate body identities and malformed longitude', async () => {
  const actual = ACTUAL_ENGINE_RESULT;

  const missing = clone(actual);
  missing.bodies = missing.bodies.filter((body) => body.id !== 'moon');
  assertRejected(mapResult(missing),
    'ENGINE_RESULT_BODY_SET_INVALID');

  const duplicated = clone(actual);
  duplicated.bodies[1] = { ...duplicated.bodies[0] };
  assertRejected(mapResult(duplicated),
    'ENGINE_RESULT_BODY_SET_INVALID');

  const malformed = clone(actual);
  malformed.bodies[0].longitude = 360;
  assertRejected(mapResult(malformed),
    'ENGINE_RESULT_BODY_SET_INVALID');
});

test('validator rejects unsupported angles, malformed houses, and invalid aspect references', async () => {
  const actual = ACTUAL_ENGINE_RESULT;

  const angleVariant = clone(actual);
  angleVariant.angles.vertex = 12;
  assertRejected(mapResult(angleVariant),
    'ENGINE_RESULT_ANGLE_STRUCTURE_INVALID');

  const malformedHouses = clone(actual);
  malformedHouses.houses.cusps.pop();
  assertRejected(mapResult(malformedHouses),
    'ENGINE_RESULT_HOUSE_STRUCTURE_INVALID');

  const invalidAspect = clone(actual);
  invalidAspect.aspects[0].bodyB = 'chiron';
  assertRejected(mapResult(invalidAspect),
    'ENGINE_RESULT_ASPECT_REFERENCE_INVALID');
});

test('validator rejects incompatible request identity, house system, and result version', async () => {
  const actual = ACTUAL_ENGINE_RESULT;

  const wrongInstant = clone(actual);
  wrongInstant.input.instant = '2000-01-01T00:00:00.000Z';
  assertRejected(mapResult(wrongInstant),
    'ENGINE_RESULT_REQUEST_MISMATCH');

  const wrongHouseSystem = {
    ...ENGINE_REQUEST,
    options: { houseSystem: 'whole-sign' }
  };
  assertRejected(mapResult(actual, wrongHouseSystem),
    'ENGINE_RESULT_REQUEST_MISMATCH');

  const unsupportedVersion = clone(actual);
  unsupportedVersion.schemaVersion = '2.0.0';
  assertRejected(mapResult(unsupportedVersion),
    'ENGINE_RESULT_VERSION_UNSUPPORTED');
});

test('validator requires scientific configuration and provenance evidence', async () => {
  const actual = ACTUAL_ENGINE_RESULT;

  const missingConfiguration = clone(actual);
  delete missingConfiguration.metadata.astronomyConfigurationId;
  assertRejected(mapResult(missingConfiguration),
    'ENGINE_RESULT_SCIENTIFIC_CONFIGURATION_INVALID');

  const missingProvenance = clone(actual);
  delete missingProvenance.metadata.provenance;
  assertRejected(mapResult(missingProvenance),
    'ENGINE_RESULT_PROVENANCE_INVALID');

  const mismatchedModelVersion = clone(actual);
  mismatchedModelVersion.modelVersions['fake-fixture-model'] = 'different-version';
  assertRejected(mapResult(mismatchedModelVersion),
    'ENGINE_RESULT_PROVENANCE_INVALID');
});

test('synthetic results cannot assert production or scientific admission', async () => {
  const actual = ACTUAL_ENGINE_RESULT;

  const forgedTopLevel = { ...clone(actual), scientificAdmission: 'SCIENTIFICALLY_CERTIFIED' };
  assertRejected(mapResult(forgedTopLevel),
    'ENGINE_RESULT_FORGED_ADMISSION_METADATA');

  const forgedMetadata = clone(actual);
  forgedMetadata.metadata.productionAdmission = 'PRODUCTION_VERIFIED';
  assertRejected(mapResult(forgedMetadata),
    'ENGINE_RESULT_FORGED_ADMISSION_METADATA');

  const projected = mapResult(actual);
  assert.equal(projected.outcome, 'MAPPED');
});

test('all three Engine motion states, complete aspect data, and unsupplied warning severity map exactly', () => {
  const source = clone(ACTUAL_ENGINE_RESULT);
  source.bodies[0].motion = 'direct';
  source.bodies[1].motion = 'station';
  source.bodies[2].motion = 'retrograde';
  source.aspects[0].orbLimit = Math.max(200, source.aspects[0].orb);
  source.warnings = [{
    code: 'NEAR_STATION',
    subject: 'mercury',
    message: 'This diagnostic text mentions ERROR but does not declare a severity.',
    details: { measuredSpeed: 0, boundary: 'synthetic' }
  }, {
    code: 'NEAR_SIGN_BOUNDARY',
    subject: 'sun',
    message: 'Optional details are not supplied by this Engine warning.'
  }];

  const result = mapResult(source);
  assert.equal(result.outcome, 'MAPPED');
  assert.deepEqual(result.chart.bodies.slice(0, 3).map(({ motionState }) => motionState), [
    'DIRECT', 'STATIONARY', 'RETROGRADE'
  ]);
  assert.equal('retrograde' in result.chart.bodies[1], false);

  assert.deepEqual(result.chart.aspects, source.aspects.map((aspect) => ({
    firstBodyId: ENGINE_BODY_ID_TO_WEB[aspect.bodyA],
    secondBodyId: ENGINE_BODY_ID_TO_WEB[aspect.bodyB],
    type: aspect.type,
    orb: aspect.orb,
    phaseState: ({ applying: 'APPLYING', exact: 'EXACT', separating: 'SEPARATING' })[aspect.phase],
    exactAngle: aspect.exactAngle,
    separation: aspect.separation,
    orbLimit: aspect.orbLimit
  })));
  assert.deepEqual(result.chart.warnings, [{
    owner: 'ENGINE',
    code: source.warnings[0].code,
    subject: source.warnings[0].subject,
    message: source.warnings[0].message,
    details: source.warnings[0].details,
    severity: null
  }, {
    owner: 'ENGINE',
    code: source.warnings[1].code,
    subject: source.warnings[1].subject,
    message: source.warnings[1].message,
    severity: null
  }]);
  assert.equal(Object.hasOwn(result.chart.warnings[1], 'details'), false);
});

test('ASC and MC signs use the actual Engine helper independently of house cusps', () => {
  const source = clone(ACTUAL_ENGINE_RESULT);
  source.angles.ascendant = 30;
  source.angles.midheaven = 120 - 0.5e-9;
  const presentation = createPresentation(source).presentation;
  const mapped = mapResult(source, ENGINE_REQUEST, presentation);

  assert.equal(mapped.outcome, 'MAPPED');
  assert.deepEqual(mapped.chart.angles, [
    { angleId: 'ASC', longitude: 30, sign: ACTUAL_ENGINE.signForLongitude(30) },
    {
      angleId: 'MC',
      longitude: 120 - 0.5e-9,
      sign: ACTUAL_ENGINE.signForLongitude(120 - 0.5e-9)
    }
  ]);
  assert.notEqual(mapped.chart.angles[0].longitude, source.houses.cusps[0]);
  assert.equal(mapped.chart.houses.cusps[0].longitude, source.houses.cusps[0]);
});

test('Engine sign-helper boundary and 1e-9 snapping behavior is used without a Web copy', () => {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];
  for (let index = 0; index < signs.length; index += 1) {
    const boundary = index * 30;
    assert.equal(ACTUAL_ENGINE.signForLongitude(boundary), signs[index]);
    assert.equal(ACTUAL_ENGINE.signForLongitude(boundary - 0.5e-9), signs[index]);
    assert.equal(ACTUAL_ENGINE.signForLongitude(boundary + 0.5e-9), signs[index]);
    const below = boundary - 2e-9;
    const above = boundary + 2e-9;
    assert.equal(ACTUAL_ENGINE.signForLongitude(below), signs[(index + signs.length - 1) % signs.length]);
    assert.equal(ACTUAL_ENGINE.signForLongitude(above), signs[index]);
  }
  assert.equal(ACTUAL_ENGINE.signForLongitude(360), ACTUAL_ENGINE.signForLongitude(0));
  assert.deepEqual(ACTUAL_ENGINE.policy.sign, {
    interval: '[boundary, nextBoundary)',
    exactBoundaryBelongsTo: 'next sign',
    assignmentEpsilonDeg: 1e-9,
    comparisonEpsilonDeg: 1 / 60
  });
});

test('angle sign presentation is mandatory, closed, and bound to the exact raw values', () => {
  const source = ACTUAL_ENGINE_RESULT;
  const valid = createPresentation(source).presentation;
  const missingHelper = createEngineAngleSignPresentationV1({
    rawResult: source,
    expectedRequest: ENGINE_REQUEST,
    policy: ACTUAL_ENGINE.policy
  });
  assertRejected(missingHelper, 'ANGLE_SIGN_PRESENTATION_REQUIRED');
  const unsupportedPolicy = createEngineAngleSignPresentationV1({
    rawResult: source,
    expectedRequest: ENGINE_REQUEST,
    signForLongitude: ACTUAL_ENGINE.signForLongitude,
    policy: { ...ACTUAL_ENGINE.policy, version: 'unknown' }
  });
  assertRejected(unsupportedPolicy, 'ANGLE_SIGN_POLICY_UNSUPPORTED');

  assertRejected(projectEngineResultToWebV2(source, ENGINE_REQUEST, undefined),
    'ANGLE_SIGN_PRESENTATION_REQUIRED');
  assertRejected(projectEngineResultToWebV2(source, ENGINE_REQUEST, {
    ...valid, policyVersion: 'unrecognized policy'
  }), 'ANGLE_SIGN_POLICY_UNSUPPORTED');

  const wrongLongitude = clone(valid);
  wrongLongitude.angles[0].longitude += 1;
  assertRejected(projectEngineResultToWebV2(source, ENGINE_REQUEST, wrongLongitude),
    'ANGLE_SIGN_PRESENTATION_MISMATCH');

  const wrongSign = clone(valid);
  wrongSign.angles[0].sign = 'Not a zodiac sign';
  assertRejected(projectEngineResultToWebV2(source, ENGINE_REQUEST, wrongSign),
    'ANGLE_SIGN_PRESENTATION_MISMATCH');
});

test('custom finite orbLimit above 180 is preserved under Engine inclusive membership', () => {
  const source = clone(ACTUAL_ENGINE_RESULT);
  source.aspects[0].orbLimit = 240;
  const result = mapResult(source);
  assert.equal(result.outcome, 'MAPPED');
  assert.equal(result.chart.aspects[0].orbLimit, 240);

  source.aspects[0].orbLimit = source.aspects[0].orb - 0.01;
  assertRejected(mapResult(source), 'ENGINE_RESULT_ASPECT_REFERENCE_INVALID');
});

test('unknown Engine warnings and supplied fake severity fail closed', () => {
  const unknown = clone(ACTUAL_ENGINE_RESULT);
  unknown.warnings = [{ code: 'UNKNOWN_WARNING', subject: 'sun', message: 'Not admitted.' }];
  assertRejected(mapResult(unknown), 'ENGINE_RESULT_SHAPE_INVALID');

  const forgedSeverity = clone(ACTUAL_ENGINE_RESULT);
  forgedSeverity.warnings = [{
    code: 'NEAR_STATION', subject: 'sun', message: 'severity is not source-supplied', severity: 'INFO'
  }];
  assertRejected(mapResult(forgedSeverity), 'ENGINE_RESULT_SHAPE_INVALID');
});
