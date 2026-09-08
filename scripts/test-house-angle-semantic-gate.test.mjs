import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactPath = 'docs/research/personal-synthesis/HOUSE_ANGLE_SEMANTIC_REPRESENTATIVE_V1.json';
const methodPath = 'docs/product/NATALNODE_HOUSE_ANGLE_SEMANTIC_METHOD_V1.md';
const houseSourcePath = 'docs/research/astrology-knowledge-canon/houses/HOUSE_SOURCE_READINESS_V1.md';
const angleSourcePath = 'docs/research/astrology-knowledge-canon/angles/ANGLE_SOURCE_READINESS_V1.md';
const firewallPath = 'docs/architecture/NATALNODE_PRODUCTION_ADMISSION_FIREWALL_V1.md';
const packagePath = 'package.json';

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

const artifact = readJson(artifactPath);
const method = readText(methodPath);
const houseSource = readText(houseSourcePath);
const angleSource = readText(angleSourcePath);
const firewall = readText(firewallPath);
const rootPackage = readJson(packagePath);

test('house source audit covers all twelve houses without claiming mature personal canon', () => {
  assert.equal(artifact.sourceReadiness.houses.length, 12);
  assert.deepEqual(
    artifact.sourceReadiness.houses.map((record) => record.house),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  );
  assert.ok(artifact.sourceReadiness.houses.every((record) => record.status === 'SOURCE_READY'));
  assert.equal(artifact.sourceReadiness.houseOverall, 'SOURCE_READY_FOR_BOUNDED_CONTEXT');
  assert.match(houseSource, /not a prediction|not deterministic|not.*outcome/iu);
  assert.match(houseSource, /professional\/technical|complete.*personal|Signal/iu);
});

test('representative method uses four contrasting, source-ready houses only', () => {
  assert.deepEqual(artifact.scope.representativeHouses, [1, 4, 7, 10]);
  assert.equal(artifact.representativeCompositions.length, 4);
  assert.deepEqual(
    artifact.representativeCompositions.map((record) => record.house),
    [1, 4, 7, 10]
  );
  assert.deepEqual(
    artifact.representativeCompositions.map((record) => record.bodySignCompositionId),
    [
      'body.sun_x_sign.aries',
      'body.moon_x_sign.taurus',
      'body.mercury_x_sign.aries',
      'body.venus_x_sign.taurus'
    ]
  );
});

test('Body, Sign, and House stay distinct semantic dimensions and one contextual unit', () => {
  assert.equal(artifact.houseMethod.semanticUnitType, 'BODY_SIGN_HOUSE_CONTEXT');
  assert.equal(artifact.houseMethod.semanticUnitCount, 1);
  assert.deepEqual(artifact.houseMethod.semanticDimensions, [
    'BODY_FUNCTION',
    'SIGN_CONDITION',
    'HOUSE_CONTEXT'
  ]);
  assert.equal(artifact.houseMethod.houseReplacesPlacement, false);
  for (const record of artifact.representativeCompositions) {
    assert.equal(record.semanticDimensions.length, 3);
    assert.equal(record.semanticUnitCount, 1);
  }
  assert.match(method, /BODY\s*=\s*what function/iu);
  assert.match(method, /SIGN\s*=\s*how/iu);
  assert.match(method, /HOUSE\s*=\s*where/iu);
  assert.match(method, /keyword concatenation/iu);
});

test('house context does not inflate independent evidence roots or create self-convergence', () => {
  const accounting = artifact.houseMethod.evidenceAccounting;
  assert.equal(accounting.astronomicalEvidenceRootCount, 1);
  assert.equal(accounting.independentEvidenceUnits, 1);
  assert.equal(accounting.houseContextIndependentEvidenceIncrement, 0);
  assert.equal(accounting.houseCuspIndependentEvidenceIncrement, 0);
  assert.equal(accounting.houseSystemIdentityIndependentEvidenceIncrement, 0);
  assert.equal(accounting.sameUnitMaySelfConverge, false);
  assert.equal(accounting.duplicateReferenceIncreasesConfidence, false);
  for (const record of artifact.representativeCompositions) {
    assert.equal(record.astronomicalEvidenceRootCount, 1);
    assert.equal(record.independentEvidenceIncrement, 0);
  }
});

test('house-system identity is required and no system is selected or recalculated', () => {
  const system = artifact.houseMethod.houseSystem;
  assert.equal(system.assignmentRequired, true);
  assert.equal(system.identityRequired, true);
  assert.equal(system.defaultSystem, null);
  assert.equal(system.calculatesCusps, false);
  assert.equal(system.selectsSystem, false);
  assert.equal(system.switchesSystem, false);
  assert.equal(system.comparesSystems, false);
  for (const record of artifact.representativeCompositions) {
    assert.equal(record.houseSystemId, 'MUST_BE_SUPPLIED_BY_AUTHORITY');
  }
  assert.match(method, /AUTHORITATIVELY_SUPPLIED_HOUSE_ASSIGNMENT/iu);
  assert.match(method, /HOUSE_SYSTEM_IDENTITY/iu);
});

test('unknown time suppresses every house composition without a fallback', () => {
  assert.equal(artifact.houseMethod.unknownTime.outcome, 'SUPPRESS_HOUSE_SEMANTICS');
  assert.deepEqual(artifact.houseMethod.unknownTime.forbiddenFallbacks, [
    'NOON',
    'MIDNIGHT',
    'AVERAGE_TIME',
    'DEFAULT_ASC',
    'LIKELY_HOUSE',
    'WHOLE_SIGN_FALLBACK'
  ]);
  assert.match(artifact.houseMethod.unknownTime.certificationGate, /SEPARATE_PREPROD_GATE/u);
  assert.ok(artifact.representativeCompositions.every((record) => record.unknownTimeOutcome === 'SUPPRESS'));
  assert.match(method, /UNKNOWN_TIME\s*->\s*NO HOUSE SEMANTICS/iu);
  assert.match(houseSource, /unknown (birth )?time|missing.*house/iu);
});

test('ASC and MC remain distinct from House 1 and House 10', () => {
  assert.equal(artifact.angleReadiness.asc.houseIdentity, 'ASC_IS_NOT_HOUSE_1');
  assert.equal(artifact.angleReadiness.mc.houseIdentity, 'MC_IS_NOT_HOUSE_10');
  assert.match(method, /ASC and MC are not houses/iu);
  assert.match(angleSource, /ASC is not House 1/iu);
  assert.match(angleSource, /MC is not House 10/iu);
});

test('ASC and MC have bounded contexts without personality or career shortcuts', () => {
  assert.equal(artifact.angleReadiness.asc.boundedSemanticRole, 'ORIENTATION_INTERFACE');
  assert.equal(artifact.angleReadiness.mc.boundedSemanticRole, 'MERIDIAN_PUBLIC_DIRECTION_CONTEXT');
  assert.deepEqual(artifact.angleReadiness.asc.forbiddenShortcuts, [
    'personality',
    'mask',
    'appearance',
    'universal_first_impression',
    'destiny'
  ]);
  assert.deepEqual(artifact.angleReadiness.mc.forbiddenShortcuts, [
    'career',
    'job',
    'destiny',
    'fame',
    'social_status_outcome',
    'life_purpose_certainty'
  ]);
  assert.equal(artifact.angleReadiness.asc.angleSignMethod, 'DEFERRED');
  assert.equal(artifact.angleReadiness.mc.angleSignMethod, 'DEFERRED');
  assert.match(angleSource, /SOURCE_PARTIAL/iu);
  assert.match(angleSource, /ASC.*personality|MC.*career/isu);
});

test('angles are birth-time dependent and no Big Three shortcut is admitted', () => {
  assert.equal(
    artifact.angleReadiness.asc.birthTimeDependency,
    'REQUIRES_KNOWN_TIME_AND_RESOLVED_LOCATION'
  );
  assert.equal(
    artifact.angleReadiness.mc.birthTimeDependency,
    'REQUIRES_KNOWN_TIME_AND_RESOLVED_LOCATION'
  );
  assert.equal(artifact.selectorCompatibility.automaticSunMoonAscThreeCards, false);
  assert.equal(artifact.selectorCompatibility.themeCandidateByDefault, false);
  assert.match(method, /Big Three/iu);
  assert.match(method, /not.*default.*THEME_CANDIDATE/isu);
});

test('selector, convergence, and counterevidence roles remain bounded', () => {
  assert.deepEqual(artifact.selectorCompatibility.allowedRoles, [
    'CONTEXT_MODIFIER',
    'SUPPORTING_WHY',
    'TECHNICAL_DEPTH'
  ]);
  assert.ok(artifact.representativeCompositions.every((record) =>
    record.selectorRole.includes('CONTEXT_MODIFIER') &&
    record.selectorRole.includes('SUPPORTING_WHY')
  ));
  assert.equal(artifact.convergenceAndCounterevidence.houseContextCreatesIndependentConvergence, false);
  assert.equal(artifact.convergenceAndCounterevidence.houseDifferenceCreatesCounterevidence, false);
  assert.equal(artifact.convergenceAndCounterevidence.privatePublicContrastCreatesCounterevidence, false);
  assert.equal(artifact.convergenceAndCounterevidence.angleSharedSignCreatesConvergence, false);
  assert.match(method, /one house = one card/iu);
  assert.match(method, /does not automatically create convergence/iu);
});

test('production admission, provider, Engine, and runtime boundaries remain closed', () => {
  assert.equal(artifact.runtimeEligibility, 'RUNTIME_NOT_ADMITTED');
  assert.equal(artifact.providerStatus, 'PROVIDER DECISION DEFERRED');
  assert.equal(artifact.gates.PRODUCTION_FIREWALL_COMPATIBILITY, 'PASS');
  assert.equal(artifact.gates.PROVIDER_BOUNDARY, 'PASS');
  assert.equal(artifact.gates.HOUSE_ANGLE_RUNTIME_POC_ADMISSION, 'NO');
  assert.equal(rootPackage.scripts['test:house-angle-semantic-gate'], 'node --test scripts/test-house-angle-semantic-gate.test.mjs');
  assert.match(firewall, /PRODUCTION_INTERPRETATION_ADMISSION.*NONE|NONE.*NOT_ADMITTED/isu);
  assert.match(method, /No new executable POC.*Engine call.*BFF change/isu);
  assert.equal(fs.existsSync(path.join(root, 'apps/web/src/features/interpretation/house-angle-semantic-poc.ts')), false);
});

test('artifact records explicit research references and finite readiness gates', () => {
  assert.ok(artifact.sourceRefs.length >= 8);
  assert.equal(artifact.gates.HOUSE_SEMANTIC_METHOD_ADMISSION, 'YES');
  assert.equal(artifact.gates.ANGLE_SEMANTIC_METHOD_ADMISSION, 'YES_BOUNDED_CONTEXT_ONLY');
  assert.equal(artifact.gates.HOUSE_SIGNAL_POLICY_READY, 'NO');
  assert.equal(artifact.gates.ANGLE_SIGNAL_POLICY_READY, 'NO');
  assert.equal(artifact.gates.READY_FOR_PRODUCTION_HOUSE_RUNTIME, 'NO');
  assert.equal(artifact.gates.READY_FOR_PRODUCTION_ANGLE_RUNTIME, 'NO');
  assert.equal(artifact.gates.RUNTIME_ADMISSION, 'NO');
});
