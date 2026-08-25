import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function isMainModule(moduleUrl: string): boolean {
  const entrypoint = process.argv[1];

  return (
    entrypoint !== undefined &&
    moduleUrl === pathToFileURL(resolve(entrypoint)).href
  );
}
