import type { EmailMagicLinkDelivery } from '../../auth-runtime/email-magic-link-delivery.js';
import type { EngineClient } from '@natalnode/engine-client';
import type { ChartResultCacheIdentity } from '../../app/cache/chart-result-cache-key.js';

export interface ServerBootstrapBindings {
  readonly engineClient: EngineClient;
  readonly chartResultCacheIdentity: ChartResultCacheIdentity;
  readonly emailMagicLinkDelivery: EmailMagicLinkDelivery;
}
