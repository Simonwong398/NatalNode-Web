import type { EngineClient } from '@natalnode/engine-client';
import type { EmailMagicLinkDelivery } from '../auth-runtime/email-magic-link-delivery.js';
import type { SqlExecutor } from '../db/index.js';

export interface ServerRuntimeBindings {
  readonly sqlExecutor: SqlExecutor;
  readonly engineClient: EngineClient;
  readonly emailMagicLinkDelivery: EmailMagicLinkDelivery;
}
