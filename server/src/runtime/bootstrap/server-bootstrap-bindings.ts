import type { EmailMagicLinkDelivery } from '../../auth-runtime/email-magic-link-delivery.js';
import type { EngineClient } from '@natalnode/engine-client';

export interface ServerBootstrapBindings {
  readonly engineClient: EngineClient;
  readonly emailMagicLinkDelivery: EmailMagicLinkDelivery;
}
