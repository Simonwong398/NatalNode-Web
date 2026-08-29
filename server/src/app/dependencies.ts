import type { EngineClient } from '@natalnode/engine-client';
import type {
  AuthenticationExpirationPolicy,
  EmailMagicLinkDelivery,
  GoogleOidcProvider,
  GoogleOAuthTransactionService,
  MagicLinkUrlBuilder,
  SecureTokenGenerator,
  SessionCookiePolicy,
  TokenHasher
} from '../auth-runtime/index.js';
import type {
  AccountErasureRepository,
  AccountDataExportRepository,
  EmailMagicLinkAuthLifecycle,
  GoogleAuthAccountSessionLifecycle,
  PersistenceRepositories
} from '../persistence/index.js';
import type { RequestAuthenticator } from './auth/index.js';
import type { ChartCalculationService } from './cache/cached-chart-calculator.js';
import type { Clock, IdGenerator } from './creation-boundaries.js';
import type { NotificationAccountService } from '../notification-platform/notification-account-service.js';

export interface ServerDependencies {
  readonly publicWebOrigin: string;
  readonly authenticator: RequestAuthenticator;
  readonly accountErasure: AccountErasureRepository;
  readonly accountDataExport: AccountDataExportRepository;
  readonly postgresConnectionTimeoutMillis?: number;
  readonly emailMagicLinkAuthLifecycle: EmailMagicLinkAuthLifecycle;
  readonly idGenerator: IdGenerator;
  readonly persistence: PersistenceRepositories;
  readonly engineClient: EngineClient;
  readonly chartCalculator: ChartCalculationService;
  readonly clock: Clock;
  /** Omitted by public-development so authenticated notification use fails closed. */
  readonly notificationAccountService?: NotificationAccountService;
  readonly secureTokenGenerator: SecureTokenGenerator;
  readonly tokenHasher: TokenHasher;
  readonly authenticationExpirationPolicy: AuthenticationExpirationPolicy;
  readonly emailMagicLinkDelivery: EmailMagicLinkDelivery;
  readonly magicLinkUrlBuilder: MagicLinkUrlBuilder;
  readonly sessionCookiePolicy: SessionCookiePolicy;
  /** Optional until the externally gated Google provider is configured. */
  readonly googleOidcProvider?: GoogleOidcProvider;
  readonly googleOAuthTransactionService?: GoogleOAuthTransactionService;
  readonly googleAuthAccountSessionLifecycle?: GoogleAuthAccountSessionLifecycle;
}
