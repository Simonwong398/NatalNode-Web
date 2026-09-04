import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const LOCAL_INTEGRATION_BUILD_STEPS = Object.freeze([
  Object.freeze(['run', 'build', '--workspace=packages/contracts']),
  Object.freeze(['run', 'build', '--workspace=packages/test-fixtures']),
  Object.freeze(['run', 'build', '--workspace=packages/engine-client']),
  Object.freeze(['run', 'build:local-integration', '--workspace=apps/web']),
  Object.freeze(['run', 'build', '--workspace=server'])
]);

function getNpmInvocation(args) {
  if (process.env.npm_execpath) {
    return {
      command: process.execPath,
      args: [process.env.npm_execpath, ...args]
    };
  }

  return {
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args
  };
}

export function runLocalDevelopmentBuild() {
  const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

  for (const step of LOCAL_INTEGRATION_BUILD_STEPS) {
    const npmInvocation = getNpmInvocation(step);
    execFileSync(npmInvocation.command, npmInvocation.args, {
      cwd: repositoryRoot,
      env: process.env,
      stdio: 'inherit'
    });
  }
}

const invokedScript = process.argv[1];
if (
  invokedScript !== undefined &&
  resolve(invokedScript) === fileURLToPath(import.meta.url)
) {
  runLocalDevelopmentBuild();
}
