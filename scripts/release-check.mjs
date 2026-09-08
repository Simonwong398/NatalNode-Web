import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

const REQUIRED_CATEGORIES = [
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
];

const REQUIRED_GATE_FIELDS = [
  'id',
  'category',
  'description',
  'ownerType',
  'codeStatus',
  'externalStatus',
  'launchBlocking',
  'evidence',
  'notes'
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readManifest() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  assert(manifest.schemaVersion === 'PRODUCTION_RELEASE_GATES_V1', 'manifest schema version is invalid');
  assert(Array.isArray(manifest.gates) && manifest.gates.length > 0, 'manifest gates are missing');
  assert(Array.isArray(manifest.externalPrelaunchChecklist), 'external checklist is missing');
  return manifest;
}

function validateManifest(manifest) {
  const ids = new Set();
  const categories = new Set();

  for (const gate of manifest.gates) {
    for (const field of REQUIRED_GATE_FIELDS) {
      assert(Object.prototype.hasOwnProperty.call(gate, field), `gate ${gate.id ?? '<unknown>'} is missing ${field}`);
    }

    assert(typeof gate.id === 'string' && gate.id.length > 0, 'gate id is invalid');
    assert(!ids.has(gate.id), `duplicate gate id: ${gate.id}`);
    ids.add(gate.id);
    categories.add(gate.category);
    assert(gate.codeStatus === 'PASS', `code gate is not PASS: ${gate.id}`);
    assert(typeof gate.launchBlocking === 'boolean', `launchBlocking is invalid: ${gate.id}`);
    assert(Array.isArray(gate.evidence) && gate.evidence.length > 0, `evidence is missing: ${gate.id}`);
  }

  for (const category of REQUIRED_CATEGORIES) {
    assert(categories.has(category), `required gate category is missing: ${category}`);
  }

  assert(
    manifest.gates.some((gate) => gate.id === 'ENGINE-001' && gate.externalStatus === 'BLOCKED' && gate.launchBlocking === true),
    'Engine external block is missing'
  );
  assert(
    manifest.gates.some((gate) => gate.id === 'SCIENTIFIC-AUTHORITY-001' && gate.externalStatus === 'BLOCKED' && gate.launchBlocking === true),
    'scientific authority external block is missing'
  );
  assert(
    manifest.gates.some((gate) => gate.externalStatus !== 'PASS'),
    'external gate status must remain incomplete for this repository-only check'
  );
  assert(
    manifest.externalPrelaunchChecklist.some((item) => item.status === 'BLOCKED'),
    'external checklist must preserve a blocked authority item'
  );
  assert(
    manifest.externalPrelaunchChecklist.every((item) => typeof item.launchBlocking === 'boolean'),
    'external checklist launchBlocking fields are invalid'
  );
}

function validateRunbook() {
  const runbook = readFileSync(RUNBOOK_PATH, 'utf8');
  for (const requiredText of [
    'BUILD',
    'CONFIG VALIDATION',
    'MIGRATION',
    'LIVENESS',
    'READINESS',
    'TRAFFIC',
    'NON_PRODUCTION_ISOLATED_DATABASE',
    'RPO=OWNER_DECISION_REQUIRED_LATER',
    'RTO=OWNER_DECISION_REQUIRED_LATER',
    'LOG != ALERT',
    'PROVIDER DECISION DEFERRED',
    'onboarding@resend.dev',
    'cache hit',
    'rollback'
  ]) {
    assert(runbook.includes(requiredText), `runbook is missing: ${requiredText}`);
  }
}

try {
  const manifest = readManifest();
  validateManifest(manifest);
  validateRunbook();

  const externalIncomplete = manifest.gates.filter(
    (gate) => gate.externalStatus !== 'PASS'
  ).length;
  const launchBlockingExternal = manifest.gates.filter(
    (gate) => gate.launchBlocking && gate.externalStatus !== 'PASS'
  ).length;

  process.stdout.write('RELEASE_CHECK=PASS\n');
  process.stdout.write('CODE_GATES=PASS\n');
  process.stdout.write(`EXTERNAL_GATES=${externalIncomplete > 0 ? 'INCOMPLETE' : 'PASS'}\n`);
  process.stdout.write(`PUBLIC_RELEASE=${launchBlockingExternal > 0 ? 'BLOCKED' : 'READY'}\n`);
  process.stdout.write(`GATES_TOTAL=${manifest.gates.length}\n`);
  process.stdout.write(`LAUNCH_BLOCKING_EXTERNAL_GATES=${launchBlockingExternal}\n`);
} catch (error) {
  process.stderr.write('RELEASE_CHECK=FAIL\n');
  process.stderr.write(`DETAIL=${error instanceof Error ? error.message : 'unknown failure'}\n`);
  process.exitCode = 1;
}
