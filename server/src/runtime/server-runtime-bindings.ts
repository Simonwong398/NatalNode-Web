import type { EngineClient } from '@natalnode/engine-client';
import type { EmailMagicLinkDelivery } from '../auth-runtime/email-magic-link-delivery.js';
import type { SqlExecutor } from '../db/index.js';
import type {
  AccountDataExportRepository,
  AccountErasureRepository,
  EmailMagicLinkAuthLifecycle
} from '../persistence/index.js';

export interface ServerRuntimeBindings {
  readonly sqlExecutor: SqlExecutor;
  readonly accountErasure: AccountErasureRepository;
  readonly accountDataExport: AccountDataExportRepository;
  readonly postgresConnectionTimeoutMillis?: number;
  readonly emailMagicLinkAuthLifecycle: EmailMagicLinkAuthLifecycle;
  readonly engineClient: EngineClient;
  readonly emailMagicLinkDelivery: EmailMagicLinkDelivery;
}
