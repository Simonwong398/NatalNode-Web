import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = fileURLToPath(new URL('../', import.meta.url));
const MANIFEST_PATH = join(
  REPOSITORY_ROOT,
  'docs',
  'operations',
  'PRODUCTION_RELEASE_GATES_V1.json'
);
const RUNBOOK_PATH = join(
  REPOSITORY_ROOT,
  'docs',
  'operations',
  'NATALNODE_PRODUCTION_RUNBOOK_V1.md'
);
const RELEASE_CHECK_PATH = join(REPOSITORY_ROOT, 'scripts', 'release-check.mjs');

const REQUIRED_CATEGORIES = new Set([
  'RUNTIME',
  'DATABASE',
  'BACKUP_RESTORE',
  'RATE_LIMIT',
  'EMAIL',
  'AUTH',
  'SECRETS',
  'OBSERVABILITY',
  'ALERTING',
  'RETENTION',
  'LEGAL_CONFIG',
  'DNS_TLS',
  'ENGINE',
  'SCIENTIFIC_AUTHORITY',
  'FINAL_RELEASE_CERTIFICATION'
]);

function readManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

test('release manifest has unique complete gates and every required category', () => {
  const manifest = readManifest();
  const ids = manifest.gates.map((gate) => gate.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(
    new Set(manifest.gates.map((gate) => gate.category)),
    new Set([...REQUIRED_CATEGORIES, 'RUNTIME', 'DATABASE'])
  );

  for (const gate of manifest.gates) {
    assert.deepEqual(Object.keys(gate).sort(), [
      'category',
      'codeStatus',
      'description',
      'evidence',
      'externalStatus',
      'id',
      'launchBlocking',
      'notes',
      'ownerType'
    ]);
    assert.equal(gate.codeStatus, 'PASS');
    assert.equal(typeof gate.launchBlocking, 'boolean');
    assert.ok(gate.evidence.length > 0);
  }
});

test('code readiness and external readiness remain separate and public release is blocked', () => {
  const manifest = readManifest();
  assert.ok(manifest.gates.every((gate) => gate.codeStatus === 'PASS'));
  assert.ok(manifest.gates.some((gate) => gate.externalStatus === 'INCOMPLETE'));
  assert.equal(
    manifest.gates.find((gate) => gate.id === 'ENGINE-001').externalStatus,
    'BLOCKED'
  );
  assert.equal(
    manifest.gates.find((gate) => gate.id === 'SCIENTIFIC-AUTHORITY-001').externalStatus,
    'BLOCKED'
  );
  assert.match(JSON.stringify(manifest), /PROVIDER DECISION DEFERRED/u);
});

test('release check is deterministic and has no listener, network, database, email, or Engine path', () => {
  const source = readFileSync(RELEASE_CHECK_PATH, 'utf8');
  assert.doesNotMatch(source, /process\.env/u);
  assert.doesNotMatch(source, /\bfetch\s*\(/u);
  assert.doesNotMatch(
    source,
    /@hono\/node-server|from ['"]pg['"]|new Resend|ENGINE_CLIENT_MODE|ENGINE_CLIENT/u
  );

  const result = spawnSync(process.execPath, [RELEASE_CHECK_PATH], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^RELEASE_CHECK=PASS\n/u);
  assert.match(result.stdout, /CODE_GATES=PASS/u);
  assert.match(result.stdout, /EXTERNAL_GATES=INCOMPLETE/u);
  assert.match(result.stdout, /PUBLIC_RELEASE=BLOCKED/u);
  assert.doesNotMatch(result.stdout, /DATABASE_URL|RESEND_API_KEY|postgres(?:ql)?:\/\//u);
});

test('runbook contains controlled lifecycle, non-production restore verification, and ownership boundaries', () => {
  const runbook = readFileSync(RUNBOOK_PATH, 'utf8');
  for (const requiredText of [
    'BUILD',
    'CONFIG VALIDATION',
    'MIGRATION',
    'VERIFY',
    'START',
    'LIVENESS',
    'READINESS',
    'TRAFFIC',
    'NON_PRODUCTION_ISOLATED_DATABASE',
    'RPO=OWNER_DECISION_REQUIRED_LATER',
    'RTO=OWNER_DECISION_REQUIRED_LATER',
    'LOG != ALERT',
    'process-local',
    'distributed',
    'cache hit',
    'rollback'
  ]) {
    assert.ok(runbook.includes(requiredText), requiredText);
  }
  assert.match(runbook, /PROVIDER DECISION DEFERRED/u);
  assert.match(runbook, /onboarding@resend\.dev/u);
  assert.doesNotMatch(runbook, /re_[A-Za-z0-9]{8,}/u);
});

test('environment example and operational records do not expose real secrets or sensitive fields', () => {
  const environmentExample = readFileSync(
    join(REPOSITORY_ROOT, '.env.example'),
    'utf8'
  );
  assert.match(environmentExample, /RESEND_API_KEY=<required-secret>/u);
  assert.match(environmentExample, /AUTH_EMAIL_FROM=<required-sender>/u);
  assert.doesNotMatch(environmentExample, /postgres(?:ql)?:\/\/[^<\s]+/u);
  assert.doesNotMatch(environmentExample, /RESEND_API_KEY=re_[A-Za-z0-9]+/u);

  const observability = readFileSync(
    join(REPOSITORY_ROOT, 'server', 'src', 'app', 'observability', 'api-request-observability.ts'),
    'utf8'
  );
  for (const forbiddenField of [
    'DATABASE_URL',
    'RESEND_API_KEY',
    'sessionToken',
    'emailNormalized',
    'password',
    'cookie',
    'token'
  ]) {
    assert.doesNotMatch(observability, new RegExp(`\\b${forbiddenField}\\b`, 'u'));
  }
});

test('existing production boundaries and ownership sources remain present', () => {
  const requiredPaths = [
    'server/src/runtime/production-runtime-config.ts',
    'server/src/runtime/runtime-preflight.ts',
    'server/src/app/security/api-rate-limiting.ts',
    'server/src/app/observability/api-request-observability.ts',
    'server/test/production-runtime-hardening.test.mjs',
    'scripts/test-production-architecture-boundaries.test.mjs',
    'scripts/test-production-build-boundaries.test.mjs'
  ];

  for (const relativePath of requiredPaths) {
    assert.equal(existsSync(join(REPOSITORY_ROOT, relativePath)), true, relativePath);
  }

  const releaseCheck = readFileSync(RELEASE_CHECK_PATH, 'utf8');
  assert.doesNotMatch(releaseCheck, /natalnode-app|astronomy-provider|@natalnode\/engine-client/u);
});
