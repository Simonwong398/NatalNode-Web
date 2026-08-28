import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  runAuthLifecycleMaintenance,
  runAuthLifecycleMaintenanceWithRuntime
} from '../dist/maintenance/index.js';
import {
  runAuthLifecycleMaintenanceMain
} from '../dist/executable/auth-lifecycle-maintenance-main.js';
import {
  runAuthLifecycleMaintenanceExecutable
} from '../dist/executable/run-auth-lifecycle-maintenance-executable.js';

const NOW = '2026-08-28T12:00:00.000Z';
const NEXT_NOW = '2026-08-28T12:00:01.000Z';

const PHASES = [
  'expiredSessions',
  'expiredUnconsumedChallenges',
  'consumedChallenges'
];

function createCleanup({ results = {}, failurePhase, failureMessage = 'private database detail' } = {}) {
  const calls = [];
  const methodByPhase = {
    expiredSessions: 'cleanupExpiredSessions',
    expiredUnconsumedChallenges: 'cleanupExpiredUnconsumedChallenges',
    consumedChallenges: 'cleanupConsumedChallenges'
  };

  const cleanup = {};

  for (const phase of PHASES) {
    cleanup[methodByPhase[phase]] = async () => {
      calls.push(phase);

      if (phase === failurePhase) {
        throw new Error(failureMessage);
      }

      return results[phase] ?? { moreWork: false };
    };
  }

  return { calls, cleanup };
}

function createRepository({ results = {}, failurePhase, failureMessage = 'private database detail' } = {}) {
  const calls = [];
  const methodByPhase = {
    expiredSessions: 'cleanupExpiredSessions',
    expiredUnconsumedChallenges: 'cleanupExpiredUnconsumedChallenges',
    consumedChallenges: 'cleanupConsumedChallenges'
  };
  const repository = {};

  for (const phase of PHASES) {
    repository[methodByPhase[phase]] = async (input) => {
      calls.push({ phase, input });

      if (phase === failurePhase) {
        throw new Error(failureMessage);
      }

      return results[phase] ?? { moreWork: false };
    };
  }

  return { calls, repository };
}

function createRuntime(repository, { closeError } = {}) {
  const runtime = {
    authLifecycleCleanupRepository: repository,
    closeCalls: 0,
    async close() {
      this.closeCalls += 1;

      if (closeError !== undefined) {
        throw new Error(closeError);
      }
    }
  };

  return runtime;
}

function createOutput() {
  const output = {
    stdout: [],
    stderr: [],
    writers: {
      stdout: {
        write(chunk) {
          output.stdout.push(chunk);
        }
      },
      stderr: {
        write(chunk) {
          output.stderr.push(chunk);
        }
      }
    }
  };

  return output;
}

function parseSingleLine(chunks) {
  assert.equal(chunks.length, 1);
  assert.match(chunks[0], /\n$/u);
  return JSON.parse(chunks[0]);
}

test('runs each cleanup phase exactly once in deterministic order without looping on moreWork', async () => {
  const { calls, cleanup } = createCleanup({
    results: {
      expiredSessions: { moreWork: true },
      expiredUnconsumedChallenges: { moreWork: true },
      consumedChallenges: { moreWork: true }
    }
  });

  const result = await runAuthLifecycleMaintenance(cleanup);

  assert.deepEqual(calls, PHASES);
  assert.deepEqual(result, {
    status: 'ok',
    phases: {
      expiredSessions: { moreWork: true },
      expiredUnconsumedChallenges: { moreWork: true },
      consumedChallenges: { moreWork: true }
    }
  });
  assert.deepEqual(
    JSON.parse(JSON.stringify(result)),
    result
  );
  assert.doesNotMatch(
    JSON.stringify(result),
    /email|token|hash|user.?id|session.?id|challenge.?id|sql/iu
  );
});

test('fails fast when expired-session cleanup fails and does not retry or invoke later phases', async () => {
  const { calls, cleanup } = createCleanup({
    failurePhase: 'expiredSessions',
    failureMessage: 'SQL parameters contain a private token hash'
  });

  const result = await runAuthLifecycleMaintenance(cleanup);

  assert.deepEqual(calls, ['expiredSessions']);
  assert.deepEqual(result, {
    status: 'error',
    failedPhase: 'expiredSessions',
    error: 'cleanup_failed'
  });
  assert.doesNotMatch(JSON.stringify(result), /private token hash|SQL parameters/iu);
});

test('preserves an earlier successful phase when the next phase fails and stops before the third phase', async () => {
  const { calls, cleanup } = createCleanup({
    results: {
      expiredSessions: { moreWork: true }
    },
    failurePhase: 'expiredUnconsumedChallenges',
    failureMessage: 'connection detail with challenge id'
  });

  const result = await runAuthLifecycleMaintenance(cleanup);

  assert.deepEqual(calls, [
    'expiredSessions',
    'expiredUnconsumedChallenges'
  ]);
  assert.deepEqual(result, {
    status: 'error',
    failedPhase: 'expiredUnconsumedChallenges',
    error: 'cleanup_failed'
  });
  assert.doesNotMatch(JSON.stringify(result), /connection detail|challenge id/iu);
});

test('wires the existing Clock through B1 and closes the runtime after bounded success', async () => {
  const { calls, repository } = createRepository({
    results: {
      expiredSessions: { moreWork: true },
      expiredUnconsumedChallenges: { moreWork: true },
      consumedChallenges: { moreWork: true }
    }
  });
  const runtime = createRuntime(repository);
  const clockValues = [NOW, NEXT_NOW, NOW];
  let clockCalls = 0;

  const result = await runAuthLifecycleMaintenanceWithRuntime(runtime, {
    now() {
      const value = clockValues[clockCalls];
      clockCalls += 1;
      return value;
    }
  });

  assert.deepEqual(result, {
    status: 'ok',
    phases: {
      expiredSessions: { moreWork: true },
      expiredUnconsumedChallenges: { moreWork: true },
      consumedChallenges: { moreWork: true }
    }
  });
  assert.equal(clockCalls, 3);
  assert.deepEqual(
    calls.map(({ phase, input }) => ({ phase, input })),
    [
      { phase: 'expiredSessions', input: { now: NOW, batchSize: 100 } },
      {
        phase: 'expiredUnconsumedChallenges',
        input: { now: NEXT_NOW, batchSize: 100 }
      },
      {
        phase: 'consumedChallenges',
        input: { now: NOW, batchSize: 100 }
      }
    ]
  );
  assert.equal(runtime.closeCalls, 1);
});

test('closes the runtime after a cleanup failure and reports only the bounded failed phase', async () => {
  const { calls, repository } = createRepository({
    failurePhase: 'consumedChallenges',
    failureMessage: 'raw PostgreSQL row and token details'
  });
  const runtime = createRuntime(repository);

  const result = await runAuthLifecycleMaintenanceWithRuntime(runtime, {
    now: () => NOW
  });

  assert.deepEqual(calls.map(({ phase }) => phase), PHASES);
  assert.deepEqual(result, {
    status: 'error',
    failedPhase: 'consumedChallenges',
    error: 'cleanup_failed'
  });
  assert.equal(runtime.closeCalls, 1);
  assert.doesNotMatch(JSON.stringify(result), /raw PostgreSQL|token details/iu);
});

test('reports shutdown failure as bounded operational output', async () => {
  const { repository } = createRepository();
  const runtime = createRuntime(repository, {
    closeError: 'pool connection details must remain private'
  });

  const result = await runAuthLifecycleMaintenanceWithRuntime(runtime, {
    now: () => NOW
  });

  assert.deepEqual(result, {
    status: 'error',
    failedPhase: 'shutdown',
    error: 'shutdown_failed'
  });
  assert.equal(runtime.closeCalls, 1);
  assert.doesNotMatch(JSON.stringify(result), /pool connection details/iu);
});

test('reuses the existing environment PostgreSQL configuration and remains fail-closed', async () => {
  const environmentConfig = {
    postgresPoolRuntimeConfig: {
      connectionString: 'postgresql://internal.example.test/natalnode'
    },
    serverRuntimeConfig: {},
    nodeHttpListenerConfig: {}
  };
  const { repository } = createRepository();
  const runtime = createRuntime(repository);
  const receivedConfigs = [];

  const result = await runAuthLifecycleMaintenanceExecutable({
    loadEnvironment() {
      return environmentConfig;
    },
    createRuntime(config) {
      receivedConfigs.push(config);
      return runtime;
    },
    clock: { now: () => NOW }
  });

  assert.deepEqual(receivedConfigs, [environmentConfig.postgresPoolRuntimeConfig]);
  assert.deepEqual(result, {
    status: 'ok',
    phases: {
      expiredSessions: { moreWork: false },
      expiredUnconsumedChallenges: { moreWork: false },
      consumedChallenges: { moreWork: false }
    }
  });
  assert.equal(runtime.closeCalls, 1);

  const configurationFailure = await runAuthLifecycleMaintenanceExecutable({
    loadEnvironment() {
      throw new Error('DATABASE_URL=private-connection-string');
    },
    createRuntime() {
      throw new Error('runtime must not be created');
    },
    clock: { now: () => NOW }
  });

  assert.deepEqual(configurationFailure, {
    status: 'error',
    failedPhase: 'configuration',
    error: 'configuration_invalid'
  });
  assert.doesNotMatch(
    JSON.stringify(configurationFailure),
    /private-connection-string/iu
  );
});

test('writes success to stdout with exit code zero and failure to stderr with exit code one', async () => {
  const successRepository = createRepository().repository;
  const successRuntime = createRuntime(successRepository);
  const successOutput = createOutput();

  const successExitCode = await runAuthLifecycleMaintenanceMain(
    {
      loadEnvironment() {
        return { postgresPoolRuntimeConfig: { connectionString: 'internal' } };
      },
      createRuntime() {
        return successRuntime;
      },
      clock: { now: () => NOW }
    },
    successOutput.writers
  );

  assert.equal(successExitCode, 0);
  assert.deepEqual(parseSingleLine(successOutput.stdout), {
    status: 'ok',
    phases: {
      expiredSessions: { moreWork: false },
      expiredUnconsumedChallenges: { moreWork: false },
      consumedChallenges: { moreWork: false }
    }
  });
  assert.deepEqual(successOutput.stderr, []);

  const failureRepository = createRepository({
    failurePhase: 'expiredSessions',
    failureMessage: 'raw database password and session hash'
  }).repository;
  const failureRuntime = createRuntime(failureRepository);
  const failureOutput = createOutput();

  const failureExitCode = await runAuthLifecycleMaintenanceMain(
    {
      loadEnvironment() {
        return { postgresPoolRuntimeConfig: { connectionString: 'internal' } };
      },
      createRuntime() {
        return failureRuntime;
      },
      clock: { now: () => NOW }
    },
    failureOutput.writers
  );

  assert.equal(failureExitCode, 1);
  assert.deepEqual(parseSingleLine(failureOutput.stderr), {
    status: 'error',
    failedPhase: 'expiredSessions',
    error: 'cleanup_failed'
  });
  assert.deepEqual(failureOutput.stdout, []);
  assert.equal(failureRuntime.closeCalls, 1);
  assert.doesNotMatch(
    failureOutput.stderr.join(''),
    /raw database password|session hash/iu
  );
});

test('maintenance sources contain no HTTP surface, selector arguments, scheduler, or duplicated SQL', async () => {
  const sourcePaths = [
    '../src/maintenance/auth-lifecycle-maintenance.ts',
    '../src/executable/run-auth-lifecycle-maintenance-executable.ts',
    '../src/executable/auth-lifecycle-maintenance-main.ts'
  ];
  const sources = await Promise.all(
    sourcePaths.map((path) =>
      readFile(new URL(path, import.meta.url), 'utf8')
    )
  );
  const source = sources.join('\n');

  assert.doesNotMatch(
    source,
    /createApp|startNodeHttpListener|runServerProcess|Hono|listen\(/iu
  );
  assert.doesNotMatch(
    source,
    /setInterval|setTimeout|node-cron|cron|scheduler|SIGINT|SIGTERM/iu
  );
  assert.doesNotMatch(
    source,
    /process\.argv|--now|--date|--timestamp|account selector|email selector/iu
  );
  assert.doesNotMatch(
    source,
    /\/api\/auth\/cleanup|DELETE FROM|FOR UPDATE|auth_sessions|email_magic_link_challenges/iu
  );
});
