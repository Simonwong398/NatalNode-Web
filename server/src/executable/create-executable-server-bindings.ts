import {
  MockEngineClient,
  type EngineClient
} from '@natalnode/engine-client';
import {
  createResendEmailMagicLinkDelivery,
  type ServerBootstrapBindings
} from '../runtime/index.js';
import {
  DEVELOPMENT_MOCK_ENGINE_CLIENT_MODE,
  type ExecutableServerConfig
} from './executable-server-config.js';

const DEVELOPMENT_MOCK_CHART_RESULT_CACHE_IDENTITY = {
  runtimeNamespace: 'development-mock',
  engineResultGeneration: 'UI_FIXTURE_V1',
  chartResultContractVersion: '1.0.0'
} as const;

function createDevelopmentMockEngineClient(
  mode: typeof DEVELOPMENT_MOCK_ENGINE_CLIENT_MODE
): EngineClient {
  if (mode !== DEVELOPMENT_MOCK_ENGINE_CLIENT_MODE) {
    throw new Error('Development EngineClient mode is invalid.');
  }

  return new MockEngineClient();
}

export function createExecutableServerBindings(
  config: ExecutableServerConfig
): ServerBootstrapBindings {
  return {
    engineClient: createDevelopmentMockEngineClient(config.engineClientMode),
    chartResultCacheIdentity: DEVELOPMENT_MOCK_CHART_RESULT_CACHE_IDENTITY,
    emailMagicLinkDelivery: createResendEmailMagicLinkDelivery({
      apiKey: config.resendApiKey,
      from: config.authEmailFrom
    })
  };
}
