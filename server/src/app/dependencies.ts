import type { EngineClient } from '@natalnode/engine-client';
import type {
  AuthenticationExpirationPolicy,
  EmailMagicLinkDelivery,
  MagicLinkUrlBuilder,
  SecureTokenGenerator,
  SessionCookiePolicy,
  TokenHasher
} from '../auth-runtime/index.js';
import type {
  AccountErasureRepository,
  EmailMagicLinkAuthLifecycle,
  PersistenceRepositories
} from '../persistence/index.js';
import type { RequestAuthenticator } from './auth/index.js';
import type { Clock, IdGenerator } from './creation-boundaries.js';

export interface ServerDependencies {
  readonly publicWebOrigin: string;
  readonly authenticator: RequestAuthenticator;
  readonly accountErasure: AccountErasureRepository;
  readonly emailMagicLinkAuthLifecycle: EmailMagicLinkAuthLifecycle;
  readonly idGenerator: IdGenerator;
  readonly persistence: PersistenceRepositories;
  readonly engineClient: EngineClient;
  readonly clock: Clock;
  readonly secureTokenGenerator: SecureTokenGenerator;
  readonly tokenHasher: TokenHasher;
  readonly authenticationExpirationPolicy: AuthenticationExpirationPolicy;
  readonly emailMagicLinkDelivery: EmailMagicLinkDelivery;
  readonly magicLinkUrlBuilder: MagicLinkUrlBuilder;
  readonly sessionCookiePolicy: SessionCookiePolicy;
}
