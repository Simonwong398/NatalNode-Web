import {
  assertProductionRuntimeAdmission,
  loadProductionRuntimeConfig
} from '../runtime/production-runtime-config.js';

/** Production entrypoint remains fail-closed until Engine admission is reviewed. */
export async function runServerExecutable(): Promise<never> {
  const productionConfig = loadProductionRuntimeConfig();
  assertProductionRuntimeAdmission(productionConfig);
}
