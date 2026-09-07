import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SERVER_ROOT = fileURLToPath(new URL('../', import.meta.url));
const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SERVER_RUNTIME_INDEX = pathToFileURL(
  join(SERVER_ROOT, 'dist', 'runtime', 'index.js')
).href;
const LOCAL_ENV_OPTION = '--env-file-if-exists=../.env';

const LOCAL_ENVIRONMENT_VARIABLES = [
  'DATABASE_URL',
  'DATABASE_SSL_ENABLED',
  'AUTH_MAGIC_LINK_TTL_SECONDS',
  'AUTH_SESSION_TTL_SECONDS',
  'AUTH_SESSION_COOKIE_NAME',
  'AUTH_SESSION_COOKIE_SECURE',
  'PUBLIC_WEB_ORIGIN',
  'HOST',
  'PORT',
  'LOCAL_PUBLIC_PORT',
  'RESEND_API_KEY',
  'AUTH_EMAIL_FROM',
  'ENGINE_CLIENT_MODE'
];

function readJson(relativePath) {
  return JSON.parse(
    readFileSync(join(REPOSITORY_ROOT, relativePath), 'utf8')
  );
}

function environmentWithoutLocalConfiguration(overrides = {}) {
  return {
    PATH: process.env.PATH ?? '',
    ...overrides
  };
}

function runNodeWithLocalEnvironment(script, overrides = {}) {
  return spawnSync(
    process.execPath,
    [LOCAL_ENV_OPTION, '--input-type=module', '-e', script],
    {
      cwd: SERVER_ROOT,
      env: environmentWithoutLocalConfiguration(overrides),
      encoding: 'utf8'
    }
  );
}

test('local and migration entrypoints load the repository-root .env only', () => {
  const serverPackage = readJson('server/package.json');
  const rootPackage = readJson('package.json');

  assert.equal(
    serverPackage.scripts.local,
    'node --env-file-if-exists=../.env dist/executable/local-main.js'
  );
  assert.equal(
    serverPackage.scripts.migrate,
    'node --env-file-if-exists=../.env dist/executable/migration-main.js'
  );
  assert.equal(serverPackage.scripts.start, 'node dist/executable/server-main.js');
  assert.equal(rootPackage.scripts['server:start'], 'npm run start --workspace=server');
  assert.equal(rootPackage.scripts['db:migrate'], 'npm run migrate --workspace=server');
  assert.equal(rootPackage.scripts['dev:local'], 'npm run local --workspace=server');
});

test('a fresh child process loads the root .env without mutating its parent', () => {
  const parentSnapshot = Object.fromEntries(
    LOCAL_ENVIRONMENT_VARIABLES.map((name) => [name, process.env[name]])
  );
  const child = runNodeWithLocalEnvironment(`
    process.stdout.write(JSON.stringify({
      databaseUrlPresent: typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.length > 0,
      host: process.env.HOST,
      portPresent: typeof process.env.PORT === 'string' && process.env.PORT.length > 0,
      localPublicPortPresent: typeof process.env.LOCAL_PUBLIC_PORT === 'string' && process.env.LOCAL_PUBLIC_PORT.length > 0,
      engineClientMode: process.env.ENGINE_CLIENT_MODE
    }));
  `);

  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout), {
    databaseUrlPresent: true,
    host: '127.0.0.1',
    portPresent: true,
    localPublicPortPresent: true,
    engineClientMode: 'development-mock'
  });

  for (const name of LOCAL_ENVIRONMENT_VARIABLES) {
    assert.equal(process.env[name], parentSnapshot[name], `${name} leaked into the parent process`);
  }
});

test('explicit process environment values win over the root .env', () => {
  const child = runNodeWithLocalEnvironment(`
    process.stdout.write(JSON.stringify({
      host: process.env.HOST,
      port: process.env.PORT,
      engineClientMode: process.env.ENGINE_CLIENT_MODE,
      databaseUrlPresent: typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.length > 0
    }));
  `, {
    HOST: 'operator-provided-host',
    PORT: '4987',
    ENGINE_CLIENT_MODE: 'operator-provided-mode'
  });

  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout), {
    host: 'operator-provided-host',
    port: '4987',
    engineClientMode: 'operator-provided-mode',
    databaseUrlPresent: true
  });
});

test('a missing .env reaches the existing migration environment validator', () => {
  const missingEnvironmentFile = join(
    SERVER_ROOT,
    'test',
    '.missing-local-environment-for-regression.test.env'
  );
  const child = spawnSync(
    process.execPath,
    [
      `--env-file-if-exists=${missingEnvironmentFile}`,
      '--input-type=module',
      '-e',
      `
        import { loadPostgresPoolRuntimeEnvironment } from ${JSON.stringify(SERVER_RUNTIME_INDEX)};
        try {
          loadPostgresPoolRuntimeEnvironment();
          process.exitCode = 2;
        } catch (error) {
          process.stdout.write(JSON.stringify({ name: error.name, message: error.message }));
        }
      `
    ],
    {
      cwd: SERVER_ROOT,
      env: environmentWithoutLocalConfiguration(),
      encoding: 'utf8'
    }
  );

  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout), {
    name: 'ServerEnvironmentConfigurationError',
    message: 'Missing required environment variable: DATABASE_URL'
  });
});

test('the production entrypoint remains explicit-environment only', () => {
  const serverMainSource = readFileSync(
    join(SERVER_ROOT, 'src', 'executable', 'server-main.ts'),
    'utf8'
  );
  const serverPackage = readJson('server/package.json');

  assert.equal(serverPackage.scripts.start, 'node dist/executable/server-main.js');
  assert.doesNotMatch(serverMainSource, /env-file|\.env|loadEnvFile/u);
});
