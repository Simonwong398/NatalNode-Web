import { createHash } from 'node:crypto';
import { open, lstat } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { ChartRequest, ChartResultV2, VaultResearchSnapshot } from '@natalnode/contracts';
import { isChartRequest } from '../app/validation/chart-request.js';

export const APPROVED_VAULT_RESEARCH_CAPTURE_ID =
  'nn-windows-single-real-browser-j2000-e2e-001-resume';

const APPROVED_TASK_ID = 'NN-WINDOWS-SINGLE-REAL-BROWSER-J2000-E2E-001-RESUME';
const APPROVED_ENGINE_HEAD = 'd446c0c8d4ba399929e8634e3e4c855b3b4f0c4e';
const APPROVED_RUN_ID = 'f7476f0a-3c92-41c2-908a-b1bc95cde84a';
const APPROVED_RUNTIME_IDENTITY =
  '3a7e863f7174e5f421cfc8ea1830cce3f428921fde820bc23ddfa849d05c0dfc';
const APPROVED_RUNTIME_MANIFEST_SHA256 =
  '11424da76825084cf116df34b7360c2b66a02c9e684dfdb13c847a3a90bf51ef';
const APPROVED_SERVICE_INSTANCE_ID =
  'service-95158e9a-60d7-449b-996e-ec9c1d694e2b';
const APPROVED_REQUEST_EXECUTION_ID =
  'request-8d081de2-d443-4c22-a386-5da22cec8706';
const APPROVED_REPORT_SHA256 =
  '4cfc2d8d80e33b2684830b2ed90fc0b4225d4e16189408df262e6145ea65867d';
const APPROVED_REQUEST_SHA256 =
  '85fca585bd36c36f8d41bda699eded37a1e1d2aa0b44fa49b5e822da650c4c86';
const APPROVED_RESPONSE_SHA256 =
  'dd7fdb69139220e151775e9c02d028008273a3e89d45ec0648482da7911cfcb1';
const APPROVED_CHART_RESULT_SHA256 =
  'f37a8ff0e833dd476c51321b94b8c31cde7c53bef13a8c82d02a5a5c82704fea';
const APPROVED_CONFIGURATION_ID =
  'sha256:bd0dbeaae6de1802ebd2001f422648e6cb77ded1ff64c4fbb64ad4c3d8cf36f6';
const MAX_CAPTURE_REQUEST_BYTES = 16 * 1024;
const MAX_CAPTURE_RESPONSE_BYTES = 256 * 1024;
const MAX_REPORT_BYTES = 32 * 1024;
const REPORT_FILENAME = 'WINDOWS_SINGLE_REAL_BROWSER_J2000_E2E_001_RESUME.json';

const APPROVED_KERNEL_NAMES = [
  'de440.bsp',
  'mar099.bsp',
  'jup349.bsp',
  'sat441.bsp',
  'ura111xl-799.bsp',
  'nep097xl-899.bsp',
  'plu060.bsp'
] as const;

export interface VerifiedVaultResearchCapture {
  readonly captureId: typeof APPROVED_VAULT_RESEARCH_CAPTURE_ID;
  readonly chartRequest: ChartRequest;
  readonly presentation: ChartResultV2;
  readonly snapshot: VaultResearchSnapshot;
  readonly engineVersion: string;
  readonly engineSchemaVersion: string;
  readonly presentationSchemaVersion: string;
  readonly astronomyConfigurationId: string;
}

export interface VaultResearchCaptureService {
  loadForAccount(
    userId: string,
    captureId: string
  ): Promise<VerifiedVaultResearchCapture | null>;
}

export class VaultResearchCaptureUnavailableError extends Error {
  public constructor() {
    super('Approved Vault research capture is unavailable.');
    this.name = 'VaultResearchCaptureUnavailableError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function parseUtf8Json(bytes: Buffer): unknown {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return JSON.parse(text) as unknown;
}

function assert(condition: unknown): asserts condition {
  if (!condition) {
    throw new VaultResearchCaptureUnavailableError();
  }
}

async function readBoundedRegularFile(
  directory: string,
  filename: string,
  maximumBytes: number
): Promise<Buffer> {
  const path = resolve(directory, filename);
  const pathStat = await lstat(path);
  assert(pathStat.isFile() && !pathStat.isSymbolicLink());
  assert(pathStat.size > 0 && pathStat.size <= maximumBytes);

  const handle = await open(path, 'r');
  try {
    const openedStat = await handle.stat();
    assert(openedStat.isFile());
    assert(openedStat.size === pathStat.size);
    assert(openedStat.ino === pathStat.ino && openedStat.dev === pathStat.dev);
    const bytes = await handle.readFile();
    assert(bytes.length === openedStat.size && bytes.length <= maximumBytes);
    return bytes;
  } finally {
    await handle.close();
  }
}

function assertApprovedReport(
  reportBytes: Buffer,
  requestSha256: string,
  responseSha256: string
): Record<string, unknown> {
  assert(sha256(reportBytes) === APPROVED_REPORT_SHA256);
  const parsed = parseUtf8Json(reportBytes);
  assert(isRecord(parsed));
  assert(parsed.taskId === APPROVED_TASK_ID);
  assert(parsed.status === 'PASS');
  assert(parsed.engineHead === APPROVED_ENGINE_HEAD);
  assert(parsed.runId === APPROVED_RUN_ID);
  assert(parsed.browserSubmissionCount === 1);
  assert(parsed.bffCalculationRequestCount === 1);
  assert(parsed.validEngineChartHttpRequestCount === 1);
  assert(parsed.runtimeIdentity === APPROVED_RUNTIME_IDENTITY);
  assert(parsed.runtimeManifestSha256 === APPROVED_RUNTIME_MANIFEST_SHA256);
  assert(parsed.serviceInstanceId === APPROVED_SERVICE_INSTANCE_ID);
  assert(parsed.requestExecutionId === APPROVED_REQUEST_EXECUTION_ID);
  assert(parsed.boundFilesVerifiedByActualValidator === 404);
  assert(parsed.kernelIdentitiesVerifiedByActualValidator === 7);
  assert(isRecord(parsed.localEvidenceSha256));
  assert(parsed.localEvidenceSha256['browser-request-1.json'] === requestSha256);
  assert(parsed.localEvidenceSha256['browser-response-1.json'] === responseSha256);
  assert(isRecord(parsed.canonicalResult));
  assert(parsed.canonicalResult.jsonStringifySha256 === APPROVED_CHART_RESULT_SHA256);
  assert(isRecord(parsed.r5Regression));
  assert(parsed.r5Regression.completeCanonicalObjectExactMatch === true);
  assert(parsed.formalP1 === 'NO-GO');
  assert(parsed.level2 === 'NOT ESTABLISHED');
  assert(parsed.provider === 'RESEARCH_ONLY');
  assert(parsed.provenance === 'INCOMPLETE_RESEARCH');
  assert(parsed.production === 'NOT APPROVED');
  assert(Array.isArray(parsed.kernelNames));
  assert(
    JSON.stringify([...parsed.kernelNames].sort()) ===
      JSON.stringify([...APPROVED_KERNEL_NAMES].sort())
  );
  return parsed;
}

function assertApprovedRequest(
  requestBytes: Buffer,
  report: Record<string, unknown>
): ChartRequest {
  assert(sha256(requestBytes) === APPROVED_REQUEST_SHA256);
  const parsed = parseUtf8Json(requestBytes);
  assert(isRecord(parsed));
  assert(parsed.runId === APPROVED_RUN_ID && parsed.requestCount === 1);
  assert(isRecord(parsed.request) && isRecord(parsed.request.chart));
  const chart = parsed.request.chart;
  assert(isChartRequest(chart));
  assert(chart.birth.localDate === '2000-01-01');
  assert(chart.birth.localTime === '12:00');
  assert(chart.birth.resolvedUtcInstant === '2000-01-01T12:00:00.000Z');
  assert(chart.birth.latitude === 51.4779 && chart.birth.longitude === -0.0015);
  assert(chart.birth.ianaTimeZone === 'Europe/London');
  assert(chart.birth.locationResolutionId === 'r5-j2000-greenwich-fixture');
  assert(chart.houseSystem === 'Placidus');
  assert(isRecord(report.wireRequest));
  return chart;
}

function assertApprovedResponse(
  responseBytes: Buffer,
  report: Record<string, unknown>,
  chartRequest: ChartRequest
): {
  readonly presentation: ChartResultV2;
  readonly engineVersion: string;
  readonly engineSchemaVersion: string;
  readonly presentationSchemaVersion: string;
  readonly astronomyConfigurationId: string;
} {
  assert(sha256(responseBytes) === APPROVED_RESPONSE_SHA256);
  const responseText = new TextDecoder('utf-8', { fatal: true }).decode(responseBytes);
  assert(!/(?:[A-Za-z]:\\|\\\\[^\\]+\\|\/Users\/|\/home\/|Bearer\s|-----BEGIN [A-Z ]*PRIVATE KEY-----)/iu.test(responseText));
  const parsed = JSON.parse(responseText) as unknown;
  assert(isRecord(parsed) && parsed.status === 200 && parsed.runId === APPROVED_RUN_ID);
  assert(isRecord(parsed.payload) && isRecord(parsed.payload.receipt));
  const receipt = parsed.payload.receipt;
  assert(isRecord(receipt.execution));
  assert(receipt.execution.serviceInstanceId === APPROVED_SERVICE_INSTANCE_ID);
  assert(receipt.execution.requestExecutionId === APPROVED_REQUEST_EXECUTION_ID);
  assert(receipt.execution.runtimeIdentity === APPROVED_RUNTIME_IDENTITY);
  assert(receipt.execution.status === 'RESEARCH_ONLY');
  assert(receipt.execution.provenance === 'INCOMPLETE_RESEARCH');
  assert(isRecord(receipt.assessment));
  assert(receipt.assessment.providerScientificAdmission === 'NOT_ADMITTED');
  assert(receipt.assessment.productionResultCertification === 'NOT_CERTIFIED');
  assert(isRecord(receipt.source) && isRecord(receipt.source.engineResult));
  const engineResult = receipt.source.engineResult;
  assert(
    createHash('sha256').update(JSON.stringify(engineResult), 'utf8').digest('hex') ===
      APPROVED_CHART_RESULT_SHA256
  );
  assert(engineResult.schemaVersion === '1.0.0');
  assert(typeof engineResult.engineVersion === 'string');
  assert(isRecord(engineResult.modelVersions));
  const modelVersions = Object.values(engineResult.modelVersions);
  const kernelNames = [...new Set(
    modelVersions.flatMap((value) =>
      typeof value === 'string' ? [value.split('+')[0]] : []
    )
  )].sort();
  assert(JSON.stringify(kernelNames) === JSON.stringify([...APPROVED_KERNEL_NAMES].sort()));
  assert(isRecord(engineResult.input));
  assert(engineResult.input.instant === '2000-01-01T12:00:00Z');
  assert(engineResult.input.latitude === chartRequest.birth.latitude);
  assert(engineResult.input.longitude === chartRequest.birth.longitude);
  assert(isRecord(engineResult.metadata));
  assert(engineResult.metadata.astronomyConfigurationStatus === 'COMPLETE');
  assert(engineResult.metadata.astronomyConfigurationId === APPROVED_CONFIGURATION_ID);
  assert(engineResult.metadata.provenanceEnvelopeStatus === 'INCOMPLETE_RESEARCH');
  assert(isRecord(receipt.chart));
  const presentation = receipt.chart;
  assert(presentation.schemaVersion === '2.0.0');
  assert(typeof presentation.engineVersion === 'string');
  assert(Array.isArray(presentation.bodies) && presentation.bodies.length === 10);
  assert(Array.isArray(presentation.angles) && presentation.angles.length === 2);
  assert(isRecord(presentation.houses));
  assert(Array.isArray(presentation.houses.cusps) && presentation.houses.cusps.length === 12);
  assert(Array.isArray(presentation.aspects) && presentation.aspects.length === 11);
  assert(Array.isArray(presentation.warnings));
  assert(report.runId === parsed.runId);
  return {
    presentation: presentation as unknown as ChartResultV2,
    engineVersion: engineResult.engineVersion,
    engineSchemaVersion: engineResult.schemaVersion,
    presentationSchemaVersion: presentation.schemaVersion,
    astronomyConfigurationId: APPROVED_CONFIGURATION_ID
  };
}

export function assertVaultResearchSnapshotIntegrity(
  snapshot: VaultResearchSnapshot,
  normalizedChartRequest: ChartRequest
): ChartResultV2 {
  try {
    assert(snapshot.schemaVersion === '1');
    assert(snapshot.captureId === APPROVED_VAULT_RESEARCH_CAPTURE_ID);
    for (const digest of [
      snapshot.captureReportSha256,
      snapshot.requestSha256,
      snapshot.responseSha256,
      snapshot.canonicalChartResultSha256,
      snapshot.runtimeManifestSha256
    ]) {
      assert(typeof digest === 'string' && /^[0-9a-f]{64}$/u.test(digest));
    }
    for (const identity of [
      snapshot.runId,
      snapshot.serviceInstanceId,
      snapshot.requestExecutionId,
      snapshot.runtimeIdentity
    ]) {
      assert(typeof identity === 'string' && identity.length > 0 && identity.length <= 128);
    }
    const requestBytes = Buffer.from(snapshot.requestUtf8Base64, 'base64');
    const responseBytes = Buffer.from(snapshot.responseUtf8Base64, 'base64');
    assert(requestBytes.toString('base64') === snapshot.requestUtf8Base64);
    assert(responseBytes.toString('base64') === snapshot.responseUtf8Base64);
    assert(requestBytes.length <= MAX_CAPTURE_REQUEST_BYTES);
    assert(responseBytes.length <= MAX_CAPTURE_RESPONSE_BYTES);
    assert(sha256(requestBytes) === snapshot.requestSha256);
    assert(sha256(responseBytes) === snapshot.responseSha256);
    const parsedRequest = parseUtf8Json(requestBytes);
    assert(isRecord(parsedRequest) && isRecord(parsedRequest.request));
    assert(isRecord(parsedRequest.request.chart));
    assert(isChartRequest(parsedRequest.request.chart));
    assert(parsedRequest.runId === snapshot.runId);
    assert(isDeepStrictEqual(parsedRequest.request.chart, normalizedChartRequest));
    const responseText = new TextDecoder('utf-8', { fatal: true }).decode(responseBytes);
    const response = JSON.parse(responseText) as unknown;
    assert(isRecord(response) && response.status === 200 && response.runId === snapshot.runId);
    assert(isRecord(response.payload));
    assert(isRecord(response.payload.receipt));
    const receipt = response.payload.receipt;
    assert(isRecord(receipt.execution));
    assert(receipt.execution.serviceInstanceId === snapshot.serviceInstanceId);
    assert(receipt.execution.requestExecutionId === snapshot.requestExecutionId);
    assert(receipt.execution.runtimeIdentity === snapshot.runtimeIdentity);
    assert(receipt.execution.status === 'RESEARCH_ONLY');
    assert(receipt.execution.provenance === 'INCOMPLETE_RESEARCH');
    assert(isRecord(receipt.source) && isRecord(receipt.source.engineResult));
    assert(
      createHash('sha256').update(JSON.stringify(receipt.source.engineResult), 'utf8').digest('hex') ===
        snapshot.canonicalChartResultSha256
    );
    assert(isRecord(receipt.chart));
    assert(receipt.chart.schemaVersion === '2.0.0');
    return receipt.chart as unknown as ChartResultV2;
  } catch (_error) {
    throw new VaultResearchCaptureUnavailableError();
  }
}

export function createApprovedVaultResearchCaptureService(options: {
  readonly ownerUserId: string;
  readonly sourceDirectory: string;
}): VaultResearchCaptureService {
  if (
    options.ownerUserId.trim() === '' ||
    options.ownerUserId.length > 128 ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(options.ownerUserId) ||
    !isAbsolute(options.sourceDirectory)
  ) {
    throw new VaultResearchCaptureUnavailableError();
  }

  return {
    async loadForAccount(userId, captureId) {
      if (
        userId !== options.ownerUserId ||
        captureId !== APPROVED_VAULT_RESEARCH_CAPTURE_ID
      ) {
        return null;
      }

      try {
        const [reportBytes, requestBytes, responseBytes] = await Promise.all([
          readBoundedRegularFile(
            resolve(options.sourceDirectory, '..', '..', 'docs', 'operations'),
            REPORT_FILENAME,
            MAX_REPORT_BYTES
          ),
          readBoundedRegularFile(
            options.sourceDirectory,
            'browser-request-1.json',
            MAX_CAPTURE_REQUEST_BYTES
          ),
          readBoundedRegularFile(
            options.sourceDirectory,
            'browser-response-1.json',
            MAX_CAPTURE_RESPONSE_BYTES
          )
        ]);
        const requestSha256 = sha256(requestBytes);
        const responseSha256 = sha256(responseBytes);
        const report = assertApprovedReport(reportBytes, requestSha256, responseSha256);
        const chartRequest = assertApprovedRequest(requestBytes, report);
        const result = assertApprovedResponse(responseBytes, report, chartRequest);
        const snapshot: VaultResearchSnapshot = {
          schemaVersion: '1',
          captureId,
          captureReportSha256: sha256(reportBytes),
          requestSha256,
          responseSha256,
          canonicalChartResultSha256: APPROVED_CHART_RESULT_SHA256,
          requestUtf8Base64: requestBytes.toString('base64'),
          responseUtf8Base64: responseBytes.toString('base64'),
          runId: APPROVED_RUN_ID,
          serviceInstanceId: APPROVED_SERVICE_INSTANCE_ID,
          requestExecutionId: APPROVED_REQUEST_EXECUTION_ID,
          runtimeIdentity: APPROVED_RUNTIME_IDENTITY,
          runtimeManifestSha256: APPROVED_RUNTIME_MANIFEST_SHA256
        };
        assertVaultResearchSnapshotIntegrity(snapshot, chartRequest);
        return {
          captureId,
          chartRequest,
          presentation: result.presentation,
          snapshot,
          engineVersion: result.engineVersion,
          engineSchemaVersion: result.engineSchemaVersion,
          presentationSchemaVersion: result.presentationSchemaVersion,
          astronomyConfigurationId: result.astronomyConfigurationId
        };
      } catch (_error) {
        throw new VaultResearchCaptureUnavailableError();
      }
    }
  };
}
