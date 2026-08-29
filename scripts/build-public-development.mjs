import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PUBLIC_DEVELOPMENT_PREVIEW_ENVIRONMENT =
  'NATALNODE_LOCAL_DEV_PREVIEW';

export function createPublicDevelopmentBuildEnvironment(environment = process.env) {
  return {
    ...environment,
    [PUBLIC_DEVELOPMENT_PREVIEW_ENVIRONMENT]: 'true'
  };
}

function getNpmInvocation() {
  if (process.env.npm_execpath) {
    return {
      command: process.execPath,
      args: [process.env.npm_execpath, 'run', 'build']
    };
  }

  if (process.platform === 'win32') {
    return {
      command: process.env.ComSpec ?? 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm.cmd run build']
    };
  }

  return {
    command: 'npm',
    args: ['run', 'build']
  };
}

export function runPublicDevelopmentBuild() {
  const npmInvocation = getNpmInvocation();

  try {
    execFileSync(npmInvocation.command, npmInvocation.args, {
      cwd: fileURLToPath(new URL('../', import.meta.url)),
      env: createPublicDevelopmentBuildEnvironment(),
      stdio: 'inherit'
    });
  } catch (error) {
    const status =
      error && typeof error === 'object' && 'status' in error &&
      typeof error.status === 'number'
        ? error.status
        : 1;

    process.exitCode = status || 1;
  }
}

const invokedScript = process.argv[1];
if (invokedScript && pathToFileURL(invokedScript).href === import.meta.url) {
  runPublicDevelopmentBuild();
}
