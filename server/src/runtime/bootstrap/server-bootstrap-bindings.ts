import type { EmailMagicLinkDelivery } from '../../auth-runtime/email-magic-link-delivery.js';
import type { EngineClient } from '@natalnode/engine-client';
import type { ChartResultCacheIdentity } from '../../app/cache/chart-result-cache-key.js';
import type { GoogleOidcProvider } from '../../auth-runtime/google-oidc-provider.js';

export interface ServerBootstrapBindings {
  readonly engineClient: EngineClient;
  readonly chartResultCacheIdentity: ChartResultCacheIdentity;
  readonly emailMagicLinkDelivery: EmailMagicLinkDelivery;
  /** Optional external-gated provider; absent runtimes keep Google unavailable. */
  readonly googleOidcProvider?: GoogleOidcProvider;
  /** Explicit local security policy used only with an injected provider. */
  readonly googleOAuthTransactionTtlSeconds?: number;
}
