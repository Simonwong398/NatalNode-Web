import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createHarness, request } from './support/vault-harness.mjs';

const CAPTURE_ID = 'nn-windows-single-real-browser-j2000-e2e-001-resume';
const INITIAL_TIMESTAMP = '2026-08-26T12:00:00.000Z';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function createApprovedCaptureFixture() {
  const chartRequest = {
    birth: {
      localDate: '2000-01-01',
      localTime: '12:00',
      locationLabel: 'Greenwich synthetic test fixture',
      locationResolutionId: 'r5-j2000-greenwich-fixture',
      latitude: 51.4779,
      longitude: -0.0015,
      ianaTimeZone: 'Europe/London',
      resolvedUtcInstant: '2000-01-01T12:00:00.000Z',
      utcOffsetSeconds: 0,
      timezoneDatabaseVersion: '2026e',
      timezoneResolutionMethod: 'NN_WEB_CIVIL_TIME_JS_JODA_6.3.0_TZ_3.1.0_FULL_2026e_1970_2100_V1',
      ambiguityStatus: 'EXACT'
    },
    houseSystem: 'Placidus'
  };
  const engineResult = {
    schemaVersion: '1.0.0',
    engineVersion: 'research-fixture',
    input: {
      instant: '2000-01-01T12:00:00Z',
      latitude: 51.4779,
      longitude: -0.0015
    },
    metadata: { astronomyConfigurationStatus: 'COMPLETE' }
  };
  const presentation = {
    schemaVersion: '2.0.0',
    engineVersion: 'research-fixture',
    bodies: [],
    angles: [],
    houses: { system: 'Placidus', cusps: [] },
    aspects: [],
    warnings: []
  };
  const runId = 'fixture-run-1';
  const serviceInstanceId = 'fixture-service-1';
  const requestExecutionId = 'fixture-execution-1';
  const runtimeIdentity = 'fixture-runtime-identity';
  const runtimeManifestSha256 = 'a'.repeat(64);
  const requestBytes = Buffer.from(JSON.stringify({
    runId,
    requestCount: 1,
    request: { chart: chartRequest }
  }));
  const responseBytes = Buffer.from(JSON.stringify({
    runId,
    status: 200,
    payload: {
      receipt: {
        execution: {
          serviceInstanceId,
          requestExecutionId,
          runtimeIdentity,
          status: 'RESEARCH_ONLY',
          provenance: 'INCOMPLETE_RESEARCH'
        },
        source: { engineResult },
        chart: presentation
      }
    }
  }));
  const capture = {
    captureId: CAPTURE_ID,
    chartRequest,
    presentation,
    engineVersion: 'research-fixture',
    engineSchemaVersion: '1.0.0',
    presentationSchemaVersion: '2.0.0',
    astronomyConfigurationId: 'sha256:fixture-configuration',
    snapshot: {
      schemaVersion: '1',
      captureId: CAPTURE_ID,
      captureReportSha256: 'b'.repeat(64),
      requestSha256: sha256(requestBytes),
      responseSha256: sha256(responseBytes),
      canonicalChartResultSha256: sha256(Buffer.from(JSON.stringify(engineResult))),
      requestUtf8Base64: requestBytes.toString('base64'),
      responseUtf8Base64: responseBytes.toString('base64'),
      runId,
      serviceInstanceId,
      requestExecutionId,
      runtimeIdentity,
      runtimeManifestSha256
    }
  };
  return capture;
}

test('Vault research capture saves, lists, reopens and copies without calculation', async () => {
  const capture = createApprovedCaptureFixture();
  const serviceCalls = [];
  const harness = createHarness({
    runtimeMode: 'local',
    vaultResearchCapture: {
      async loadForAccount(userId, captureId) {
        serviceCalls.push({ userId, captureId });
        return userId === 'owner-1' && captureId === CAPTURE_ID ? capture : null;
      }
    }
  });

  const save = await request(harness.app, '/api/vault/charts/research-snapshot', {
    method: 'POST',
    body: {
      captureId: CAPTURE_ID,
      displayName: 'J2000 research record',
      category: 'SELF',
      tags: [],
      favorite: false
    }
  });
  assert.equal(save.status, 201);
  const saved = (await save.json()).chart;
  assert.equal(saved.recordVersion, 2);
  assert.equal(saved.scientificStatus, 'RESEARCH_ONLY_SNAPSHOT');
  assert.equal(saved.calculationAuthorityState, 'AUTHORITY_INCOMPLETE');
  assert.equal(saved.canonicalChartResult, null);
  assert.equal(saved.researchSnapshot.responseUtf8Base64, capture.snapshot.responseUtf8Base64);
  assert.equal(saved.scientificProvenance.schemaVersion, '2');
  assert.deepEqual(harness.calls, { engine: 0 });

  const list = await request(harness.app, '/api/vault/charts');
  assert.equal(list.status, 200);
  assert.equal((await list.json()).charts[0].chartId, saved.chartId);

  const reopen = await request(harness.app, `/api/vault/charts/${saved.chartId}`);
  assert.equal(reopen.status, 200);
  const reopened = (await reopen.json()).chart;
  assert.equal(reopened.researchSnapshot.responseSha256, capture.snapshot.responseSha256);
  assert.deepEqual(harness.calls, { engine: 0 });

  const copy = await request(harness.app, `/api/vault/charts/${saved.chartId}/duplicate`, {
    method: 'POST'
  });
  assert.equal(copy.status, 201);
  const copied = (await copy.json()).chart;
  assert.notEqual(copied.chartId, saved.chartId);
  assert.equal(copied.researchSnapshot.runId, saved.researchSnapshot.runId);
  assert.equal(copied.researchSnapshot.responseUtf8Base64, saved.researchSnapshot.responseUtf8Base64);
  assert.deepEqual(harness.calls, { engine: 0 });
  assert.deepEqual(serviceCalls, [{ userId: 'owner-1', captureId: CAPTURE_ID }]);
});

test('research capture route fails closed for anonymous, other account, arbitrary fields and non-local mode', async () => {
  const capture = createApprovedCaptureFixture();
  let serviceCalls = 0;
  const service = {
    async loadForAccount(userId, captureId) {
      serviceCalls += 1;
      return userId === 'owner-1' && captureId === CAPTURE_ID ? capture : null;
    }
  };
  const harness = createHarness({ runtimeMode: 'local', vaultResearchCapture: service });
  const body = {
    captureId: CAPTURE_ID,
    displayName: 'J2000 research record',
    category: 'SELF',
    tags: [],
    favorite: false
  };

  const anonymous = await request(harness.app, '/api/vault/charts/research-snapshot', {
    method: 'POST', userId: null, body
  });
  assert.equal(anonymous.status, 401);

  const otherAccount = await request(harness.app, '/api/vault/charts/research-snapshot', {
    method: 'POST', userId: 'other-user', body
  });
  assert.equal(otherAccount.status, 404);

  const forged = await request(harness.app, '/api/vault/charts/research-snapshot', {
    method: 'POST', body: { ...body, chart: { arbitrary: true } }
  });
  assert.equal(forged.status, 400);

  const nonLocal = createHarness({ runtimeMode: 'staging', vaultResearchCapture: service });
  const disabled = await request(nonLocal.app, '/api/vault/charts/research-snapshot', {
    method: 'POST', body
  });
  assert.equal(disabled.status, 409);
  assert.equal(serviceCalls, 1);
  assert.deepEqual(harness.calls, { engine: 0 });
  assert.deepEqual(nonLocal.calls, { engine: 0 });
});
