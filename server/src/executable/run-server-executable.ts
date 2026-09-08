import { parseServerOperationalConfig } from '../runtime/index.js';

const PRODUCTION_ENGINE_NOT_ADMITTED =
  'Production EngineClient composition is not admitted.';
const NON_PRODUCTION_ENTRYPOINT_MESSAGE =
  'server:start is production-only; use dev:local or dev:public for development.';

/** Production entrypoint remains fail-closed until Engine admission is reviewed. */
export async function runServerExecutable(): Promise<never> {
  const operationalConfig = parseServerOperationalConfig(process.env);

  if (operationalConfig.runtimeMode !== 'production') {
    throw new Error(NON_PRODUCTION_ENTRYPOINT_MESSAGE);
  }

  throw new Error(PRODUCTION_ENGINE_NOT_ADMITTED);
}
