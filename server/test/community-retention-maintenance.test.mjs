import assert from 'node:assert/strict';
import test from 'node:test';

import {
  runCommunityRetentionMaintenance,
  runCommunityRetentionMaintenanceWithRuntime
} from '../dist/maintenance/index.js';
import {
  runCommunityRetentionMaintenanceExecutable
} from '../dist/executable/run-community-retention-maintenance-executable.js';
import {
  runCommunityRetentionMaintenanceMain
} from '../dist/executable/community-retention-maintenance-main.js';

const NOW = '2026-09-01T12:00:00.000Z';
const PURGE = {
  deletedAnswers: 2,
  deletedQuestions: 1,
  deletedReports: 3,
  deletedModerationEvents: 4
};

function createOutput() {
  const output = { stdout: [], stderr: [] };
  return {
    output,
    writers: {
      stdout: { write(chunk) { output.stdout.push(chunk); } },
      stderr: { write(chunk) { output.stderr.push(chunk); } }
    }
  };
}

test('runs one Community retention purge with the server clock', async () => {
  const calls = [];
  const repository = {
    async purgeExpiredRetention(now) {
      calls.push(now);
      return PURGE;
    }
  };

  const result = await runCommunityRetentionMaintenance(repository, {
    now() { return NOW; }
  });

  assert.deepEqual(calls, [NOW]);
  assert.deepEqual(result, { status: 'ok', now: NOW, purge: PURGE });
});

test('fails closed on clock or purge failure without exposing private details', async () => {
  const clockFailure = await runCommunityRetentionMaintenance(
    { async purgeExpiredRetention() { throw new Error('private'); } },
    { now() { throw new Error('clock failure'); } }
  );
  assert.deepEqual(clockFailure, {
    status: 'error',
    failedPhase: 'configuration',
    error: 'configuration_invalid'
  });

  const purgeFailure = await runCommunityRetentionMaintenance(
    { async purgeExpiredRetention() { throw new Error('private database detail'); } },
    { now() { return NOW; } }
  );
  assert.deepEqual(purgeFailure, {
    status: 'error',
    failedPhase: 'purge',
    error: 'purge_failed'
  });
  assert.doesNotMatch(JSON.stringify(purgeFailure), /private|database/iu);
});

test('always closes the short-lived runtime', async () => {
  let closeCalls = 0;
  const result = await runCommunityRetentionMaintenanceWithRuntime(
    {
      communityRepository: {
        async purgeExpiredRetention() { return PURGE; }
      },
      async close() { closeCalls += 1; }
    },
    { now() { return NOW; } }
  );

  assert.equal(closeCalls, 1);
  assert.equal(result.status, 'ok');
});

test('executable handles configuration, runtime, and result output boundaries', async () => {
  const config = {
    postgresPoolRuntimeConfig: {
      connectionString: 'postgresql://example.invalid/natalnode'
    }
  };
  const calls = [];
  const runtime = {
    communityRepository: {
      async purgeExpiredRetention(now) {
        calls.push(now);
        return PURGE;
      }
    },
    async close() {}
  };

  const result = await runCommunityRetentionMaintenanceExecutable({
    loadEnvironment() { return config; },
    createRuntime(receivedConfig) {
      assert.deepEqual(receivedConfig, config.postgresPoolRuntimeConfig);
      return runtime;
    },
    clock: { now() { return NOW; } }
  });
  assert.equal(result.status, 'ok');
  assert.deepEqual(calls, [NOW]);

  const configurationFailure = await runCommunityRetentionMaintenanceExecutable({
    loadEnvironment() { throw new Error('private configuration'); },
    createRuntime() { throw new Error('must not run'); },
    clock: { now() { return NOW; } }
  });
  assert.deepEqual(configurationFailure, {
    status: 'error',
    failedPhase: 'configuration',
    error: 'configuration_invalid'
  });

  const output = createOutput();
  const exitCode = await runCommunityRetentionMaintenanceMain(
    {
      loadEnvironment() { return config; },
      createRuntime() { return runtime; },
      clock: { now() { return NOW; } }
    },
    output.writers
  );
  assert.equal(exitCode, 0);
  assert.equal(output.output.stderr.length, 0);
  assert.deepEqual(JSON.parse(output.output.stdout[0]), {
    status: 'ok',
    now: NOW,
    purge: PURGE
  });
});
