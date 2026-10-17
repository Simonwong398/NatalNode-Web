import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import {
  projectEngineResultForDevelopmentInspection
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

async function calculateActualEngineResult() {
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
  const { createEngine } = await import(pathToFileURL(join(engineRoot, 'dist/src/index.js')).href);
  const { FakeAstronomyProvider } = await import(pathToFileURL(
    join(engineRoot, 'dist/tests/fixtures/fake-astronomy-provider.js')
  ).href);
  return createEngine(new FakeAstronomyProvider()).calculateChart(
    ENGINE_REQUEST.input,
    ENGINE_REQUEST.options
  );
}

const ACTUAL_ENGINE_RESULT = await calculateActualEngineResult();

function clone(value) {
  return structuredClone(value);
}

function assertRejected(result, expectedCode) {
  assert.equal(result.outcome, 'REJECTED');
  assert.deepEqual(result.error, { code: expectedCode });
}

test('actual pinned Engine result projects deterministically without Web certification', async () => {
  const engineResult = ACTUAL_ENGINE_RESULT;
  const first = projectEngineResultForDevelopmentInspection(engineResult, ENGINE_REQUEST);
  const second = projectEngineResultForDevelopmentInspection(clone(engineResult), ENGINE_REQUEST);

  assert.equal(first.outcome, 'PROJECTED');
  assert.deepEqual(first, second);
  assert.equal(first.projection.authority.structuralValidation, 'STRUCTURALLY_VALID');
  assert.equal(first.projection.authority.semanticMapping, 'PARTIAL');
  assert.equal(first.projection.authority.scientificAdmission, 'NOT_ADMITTED');
  assert.equal(first.projection.authority.dataClassification, 'ENGINEERING TEST DATA');
  assert.equal(first.projection.authority.astronomicalStatus, 'NOT REAL ASTRONOMICAL OUTPUT');
  assert.equal(first.projection.authority.scientificValidation, 'NOT_PERFORMED');
  assert.equal(first.projection.authority.resultCertification, 'NOT_CREATED');
  assert.deepEqual(first.projection.provider, engineResult.provider);
  assert.deepEqual(first.projection.modelVersions, engineResult.modelVersions);
  assert.deepEqual(first.projection.engineMetadata, engineResult.metadata);
  assert.equal(first.projection.bodies.length, 10);
  assert.equal(first.projection.angles.length, 2);
  assert.equal(first.projection.houses.cusps.length, 12);
  assert.equal(first.projection.aspects.length, engineResult.aspects.length);
  assert.deepEqual(first.projection.engineWarnings, engineResult.warnings);
  assert.deepEqual(first.projection.resultContractGaps, [
    'ANGLE_SIGN_NOT_SUPPLIED_FOR_WEB_ANGLE_FACT',
    'ENGINE_WARNING_SEVERITY_HAS_NO_WEB_MAPPING',
    'ENGINE_STATION_STATE_CANNOT_BE_REDUCED_TO_WEB_RETROGRADE_BOOLEAN',
    'WEB_ASPECT_FACT_OMITS_ENGINE_EXACT_ANGLE_SEPARATION_AND_ORB_LIMIT',
    'ENGINE_PROVIDER_AND_MODEL_PROVENANCE_HAVE_NO_WEB_CHART_RESULT_FIELDS',
    'ENGINE_RESULT_HAS_NO_CIVIL_TIME_AUTHORITY_EVIDENCE',
    'WEB_CHART_RESULT_HAS_NO_SYNTHETIC_AUTHORITY_CLASSIFICATION',
    'ENGINE_PRECISION_QUALITY_HAS_NO_WEB_CHART_RESULT_FIELD'
  ]);
  assert.equal('calculationStatus' in first.projection, false);
  assert.equal('metadata' in first.projection, false);
});

test('validator rejects missing and duplicate body identities and malformed longitude', async () => {
  const actual = ACTUAL_ENGINE_RESULT;

  const missing = clone(actual);
  missing.bodies = missing.bodies.filter((body) => body.id !== 'moon');
  assertRejected(projectEngineResultForDevelopmentInspection(missing, ENGINE_REQUEST),
    'ENGINE_RESULT_BODY_SET_INVALID');

  const duplicated = clone(actual);
  duplicated.bodies[1] = { ...duplicated.bodies[0] };
  assertRejected(projectEngineResultForDevelopmentInspection(duplicated, ENGINE_REQUEST),
    'ENGINE_RESULT_BODY_SET_INVALID');

  const malformed = clone(actual);
  malformed.bodies[0].longitude = 360;
  assertRejected(projectEngineResultForDevelopmentInspection(malformed, ENGINE_REQUEST),
    'ENGINE_RESULT_BODY_SET_INVALID');
});

test('validator rejects unsupported angles, malformed houses, and invalid aspect references', async () => {
  const actual = ACTUAL_ENGINE_RESULT;

  const angleVariant = clone(actual);
  angleVariant.angles.vertex = 12;
  assertRejected(projectEngineResultForDevelopmentInspection(angleVariant, ENGINE_REQUEST),
    'ENGINE_RESULT_ANGLE_STRUCTURE_INVALID');

  const malformedHouses = clone(actual);
  malformedHouses.houses.cusps.pop();
  assertRejected(projectEngineResultForDevelopmentInspection(malformedHouses, ENGINE_REQUEST),
    'ENGINE_RESULT_HOUSE_STRUCTURE_INVALID');

  const invalidAspect = clone(actual);
  invalidAspect.aspects[0].bodyB = 'chiron';
  assertRejected(projectEngineResultForDevelopmentInspection(invalidAspect, ENGINE_REQUEST),
    'ENGINE_RESULT_ASPECT_REFERENCE_INVALID');
});

test('validator rejects incompatible request identity, house system, and result version', async () => {
  const actual = ACTUAL_ENGINE_RESULT;

  const wrongInstant = clone(actual);
  wrongInstant.input.instant = '2000-01-01T00:00:00.000Z';
  assertRejected(projectEngineResultForDevelopmentInspection(wrongInstant, ENGINE_REQUEST),
    'ENGINE_RESULT_REQUEST_MISMATCH');

  const wrongHouseSystem = {
    ...ENGINE_REQUEST,
    options: { houseSystem: 'whole-sign' }
  };
  assertRejected(projectEngineResultForDevelopmentInspection(actual, wrongHouseSystem),
    'ENGINE_RESULT_REQUEST_MISMATCH');

  const unsupportedVersion = clone(actual);
  unsupportedVersion.schemaVersion = '2.0.0';
  assertRejected(projectEngineResultForDevelopmentInspection(unsupportedVersion, ENGINE_REQUEST),
    'ENGINE_RESULT_VERSION_UNSUPPORTED');
});

test('validator requires scientific configuration and provenance evidence', async () => {
  const actual = ACTUAL_ENGINE_RESULT;

  const missingConfiguration = clone(actual);
  delete missingConfiguration.metadata.astronomyConfigurationId;
  assertRejected(projectEngineResultForDevelopmentInspection(missingConfiguration, ENGINE_REQUEST),
    'ENGINE_RESULT_SCIENTIFIC_CONFIGURATION_INVALID');

  const missingProvenance = clone(actual);
  delete missingProvenance.metadata.provenance;
  assertRejected(projectEngineResultForDevelopmentInspection(missingProvenance, ENGINE_REQUEST),
    'ENGINE_RESULT_PROVENANCE_INVALID');

  const mismatchedModelVersion = clone(actual);
  mismatchedModelVersion.modelVersions['fake-fixture-model'] = 'different-version';
  assertRejected(projectEngineResultForDevelopmentInspection(mismatchedModelVersion, ENGINE_REQUEST),
    'ENGINE_RESULT_PROVENANCE_INVALID');
});

test('synthetic results cannot assert production or scientific admission', async () => {
  const actual = ACTUAL_ENGINE_RESULT;

  const forgedTopLevel = { ...clone(actual), scientificAdmission: 'SCIENTIFICALLY_CERTIFIED' };
  assertRejected(projectEngineResultForDevelopmentInspection(forgedTopLevel, ENGINE_REQUEST),
    'ENGINE_RESULT_FORGED_ADMISSION_METADATA');

  const forgedMetadata = clone(actual);
  forgedMetadata.metadata.productionAdmission = 'PRODUCTION_VERIFIED';
  assertRejected(projectEngineResultForDevelopmentInspection(forgedMetadata, ENGINE_REQUEST),
    'ENGINE_RESULT_FORGED_ADMISSION_METADATA');

  const projected = projectEngineResultForDevelopmentInspection(actual, ENGINE_REQUEST);
  assert.equal(projected.outcome, 'PROJECTED');
  assert.equal(projected.projection.authority.scientificAdmission, 'NOT_ADMITTED');
  assert.equal(projected.projection.authority.resultCertification, 'NOT_CREATED');
});
