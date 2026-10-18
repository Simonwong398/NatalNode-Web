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
import type { FoundationsLearningService } from '../learning/foundations/postgres-foundations-learning-service.js';
import type { ServerOperationalConfig } from '../runtime/server-runtime-config.js';
import type { RuntimeHealthStatus } from '../runtime/server-runtime-config.js';
import type { LocationResolutionService } from '../location-resolution/location-resolution-service.js';
import type { BirthTimeResolutionService } from '../time-resolution/index.js';
import type { VaultResearchCaptureService } from '../vault/vault-research-capture.js';

export interface ServerDependencies {
  readonly publicWebOrigin: string;
  readonly operationalConfig?: ServerOperationalConfig;
  /** Runtime-owned liveness/readiness state; omitted test/public harnesses use a safe local default. */
  readonly runtimeHealth?: RuntimeHealthStatus;
  readonly authenticator: RequestAuthenticator;
  readonly accountErasure: AccountErasureRepository;
  readonly accountDataExport: AccountDataExportRepository;
  readonly postgresConnectionTimeoutMillis?: number;
  readonly emailMagicLinkAuthLifecycle: EmailMagicLinkAuthLifecycle;
  readonly idGenerator: IdGenerator;
  readonly persistence: PersistenceRepositories;
  readonly engineClient: EngineClient;
  readonly chartCalculator: ChartCalculationService;
  /** Omitted unless the explicit isolated local research-capture gate is on. */
  readonly vaultResearchCapture?: VaultResearchCaptureService;
  readonly clock: Clock;
  /** Omitted until an approved geocoding provider is bound. */
  readonly locationResolutionService?: LocationResolutionService;
  /** Explicitly bound by a future caller; does not open production Engine admission. */
  readonly birthTimeResolutionService?: BirthTimeResolutionService;
  /** Omitted by public-development so authenticated notification use fails closed. */
  readonly notificationAccountService?: NotificationAccountService;
  /** Omitted by public-development until the authenticated learning store is configured. */
  readonly foundationsLearningService?: FoundationsLearningService;
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
