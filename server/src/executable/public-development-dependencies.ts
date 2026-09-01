import { MockEngineClient } from '@natalnode/engine-client';
import type {
  AccountDataExportRepository,
  AccountErasureRepository,
  AuthSessionRepository,
  ChartNoteRepository,
  EmailMagicLinkAuthLifecycle,
  EmailMagicLinkChallengeRepository,
  FeedbackSubmissionRepository,
  NotificationPreferenceRepository,
  PersistenceRepositories,
  PushSubscriptionRepository,
  UserRepository,
  VaultChartRepository
} from '../persistence/index.js';
import type { CommunityRepository } from '../community/community-repository.js';
import type {
  AccountDataExportSnapshotOpenOptions,
  AccountDataExportSnapshotOpenResult
} from '../persistence/account-data-export-repository.js';
import type {
  ConsumeEmailMagicLinkChallengeInput,
  ConsumedEmailMagicLinkTransactionContext
} from '../persistence/email-magic-link-auth-lifecycle.js';
import type { AuthIdentityRepository } from '../persistence/auth-identity-repository.js';
import type { AuthIdentityProvisioningRepository } from '../persistence/auth-identity-provisioning-repository.js';
import type { ServerDependencies } from '../app/dependencies.js';
import type { RequestAuthenticator } from '../app/auth/request-authenticator.js';
import { createApp } from '../app/create-app.js';
import { CachedChartCalculator } from '../app/cache/cached-chart-calculator.js';
import type { IdGenerator } from '../app/creation-boundaries.js';
import {
  DurationAuthenticationExpirationPolicy
} from '../runtime/duration-authentication-expiration-policy.js';
import { SystemClock } from '../runtime/system-clock.js';
import {
  PublicWebOriginMagicLinkUrlBuilder,
  Sha256TokenHasher,
  type EmailMagicLinkDelivery,
  type SecureTokenGenerator
} from '../auth-runtime/index.js';
import type { Hono } from 'hono';
import {
  assertPublicDevelopmentEnvironment,
  PUBLIC_DEVELOPMENT_AUTHENTICATION_TTLS,
  PUBLIC_DEVELOPMENT_CHART_RESULT_CACHE_IDENTITY,
  PUBLIC_DEVELOPMENT_PUBLIC_ORIGIN,
  PUBLIC_DEVELOPMENT_SESSION_COOKIE_POLICY,
  type PublicDevelopmentEnvironment
} from './public-development-config.js';

const PUBLIC_DEVELOPMENT_UNAVAILABLE_MESSAGE =
  'This operation is unavailable in the public-development runtime.';

function unavailable(): never {
  throw new Error(PUBLIC_DEVELOPMENT_UNAVAILABLE_MESSAGE);
}

async function unavailableAsync(): Promise<never> {
  return unavailable();
}

/** Never resolves a request to an authenticated principal. */
export class PublicDevelopmentRequestAuthenticator
  implements RequestAuthenticator
{
  public async authenticate(_request: Request): Promise<null> {
    return null;
  }
}

const publicDevelopmentIdGenerator: IdGenerator = {
  generate: unavailable
};

const publicDevelopmentSecureTokenGenerator: SecureTokenGenerator = {
  generate: unavailable
};

const publicDevelopmentEmailMagicLinkDelivery: EmailMagicLinkDelivery = {
  sendMagicLink: unavailableAsync
};

const publicDevelopmentEmailMagicLinkAuthLifecycle: EmailMagicLinkAuthLifecycle =
  {
    createChallenge: unavailableAsync,
    async withConsumedChallenge<Result>(
      _input: ConsumeEmailMagicLinkChallengeInput,
      _complete: (
        context: ConsumedEmailMagicLinkTransactionContext
      ) => Promise<Result>
    ): Promise<Result | null> {
      return null;
    }
  };

const publicDevelopmentAccountErasure: AccountErasureRepository = {
  eraseAccount: unavailableAsync
};

const publicDevelopmentAccountDataExport: AccountDataExportRepository = {
  openSnapshot: (
    _userId: string,
    _options?: AccountDataExportSnapshotOpenOptions
  ): Promise<AccountDataExportSnapshotOpenResult> => unavailableAsync()
};

function createUnavailableUserRepository(): UserRepository {
  return {
    create: unavailableAsync,
    findById: unavailableAsync
  };
}

function createUnavailableAuthIdentityRepository(): AuthIdentityRepository {
  return {
    create: unavailableAsync,
    findByProviderSubject: unavailableAsync,
    listForUser: unavailableAsync
  };
}

function createUnavailableAuthIdentityProvisioningRepository(): AuthIdentityProvisioningRepository {
  return {
    resolveOrCreate: unavailableAsync
  };
}

function createPublicDevelopmentAuthSessionRepository(): AuthSessionRepository {
  return {
    create: unavailableAsync,
    findActiveByTokenHash: unavailableAsync,
    async deleteByTokenHash(_sessionTokenHash: string): Promise<boolean> {
      // Logout only needs to clear the browser cookie in this stateless mode.
      return false;
    }
  };
}

function createUnavailableEmailMagicLinkChallengeRepository(): EmailMagicLinkChallengeRepository {
  return {
    create: unavailableAsync,
    consumeValidByTokenHash: unavailableAsync
  };
}

function createUnavailableFeedbackSubmissionRepository(): FeedbackSubmissionRepository {
  return {
    create: unavailableAsync
  };
}

function createUnavailableVaultChartRepository(): VaultChartRepository {
  return {
    create: unavailableAsync,
    findById: unavailableAsync,
    listForUser: unavailableAsync,
    updateMetadata: unavailableAsync,
    deleteById: unavailableAsync
  };
}

function createUnavailableChartNoteRepository(): ChartNoteRepository {
  return {
    create: unavailableAsync,
    listForChart: unavailableAsync,
    updateContent: unavailableAsync,
    deleteById: unavailableAsync
  };
}

function createUnavailableNotificationPreferenceRepository(): NotificationPreferenceRepository {
  return {
    findChannelPreference: unavailableAsync,
    findCategoryPreference: unavailableAsync,
    setChannelPreference: unavailableAsync,
    setCategoryPreference: unavailableAsync
  };
}

function createUnavailablePushSubscriptionRepository(): PushSubscriptionRepository {
  return {
    register: unavailableAsync,
    listActiveForOwner: unavailableAsync,
    removeForOwner: unavailableAsync,
    invalidate: unavailableAsync
  };
}

function createUnavailableCommunityRepository(): CommunityRepository {
  return {
    getProfile: unavailableAsync,
    saveProfile: unavailableAsync,
    listVisibleQuestions: unavailableAsync,
    getQuestion: unavailableAsync,
    getQuestionRecord: unavailableAsync,
    getAnswerRecord: unavailableAsync,
    createQuestion: unavailableAsync,
    updateQuestion: unavailableAsync,
    deleteQuestion: unavailableAsync,
    createAnswer: unavailableAsync,
    updateAnswer: unavailableAsync,
    deleteAnswer: unavailableAsync,
    setAcceptedAnswer: unavailableAsync,
    createReport: unavailableAsync,
    isModerator: unavailableAsync,
    listOpenReports: unavailableAsync,
    moderate: unavailableAsync,
    purgeExpiredRetention: unavailableAsync
  };
}

/**
 * Provides no persistence substitute: public routes never need these methods,
 * and every protected or unsupported operation fails closed if it is reached.
 */
function createPublicDevelopmentPersistenceRepositories(): PersistenceRepositories {
  return {
    users: createUnavailableUserRepository(),
    authIdentities: createUnavailableAuthIdentityRepository(),
    authIdentityProvisioning:
      createUnavailableAuthIdentityProvisioningRepository(),
    authSessions: createPublicDevelopmentAuthSessionRepository(),
    emailMagicLinkChallenges:
      createUnavailableEmailMagicLinkChallengeRepository(),
    feedbackSubmissions: createUnavailableFeedbackSubmissionRepository(),
    vaultCharts: createUnavailableVaultChartRepository(),
    chartNotes: createUnavailableChartNoteRepository(),
    notificationPreferences: createUnavailableNotificationPreferenceRepository(),
    pushSubscriptions: createUnavailablePushSubscriptionRepository(),
    community: createUnavailableCommunityRepository()
  };
}

export function createPublicDevelopmentDependencies(
  environment?: PublicDevelopmentEnvironment
): ServerDependencies {
  assertPublicDevelopmentEnvironment(environment);

  const clock = new SystemClock();
  const engineClient = new MockEngineClient();

  return {
    publicWebOrigin: PUBLIC_DEVELOPMENT_PUBLIC_ORIGIN,
    authenticator: new PublicDevelopmentRequestAuthenticator(),
    accountErasure: publicDevelopmentAccountErasure,
    accountDataExport: publicDevelopmentAccountDataExport,
    emailMagicLinkAuthLifecycle:
      publicDevelopmentEmailMagicLinkAuthLifecycle,
    idGenerator: publicDevelopmentIdGenerator,
    persistence: createPublicDevelopmentPersistenceRepositories(),
    engineClient,
    chartCalculator: new CachedChartCalculator({
      engineClient,
      clock,
      cacheIdentity: PUBLIC_DEVELOPMENT_CHART_RESULT_CACHE_IDENTITY
    }),
    clock,
    secureTokenGenerator: publicDevelopmentSecureTokenGenerator,
    tokenHasher: new Sha256TokenHasher(),
    authenticationExpirationPolicy:
      new DurationAuthenticationExpirationPolicy(
        PUBLIC_DEVELOPMENT_AUTHENTICATION_TTLS.magicLinkTtlSeconds,
        PUBLIC_DEVELOPMENT_AUTHENTICATION_TTLS.sessionTtlSeconds
      ),
    emailMagicLinkDelivery: publicDevelopmentEmailMagicLinkDelivery,
    magicLinkUrlBuilder: new PublicWebOriginMagicLinkUrlBuilder(
      PUBLIC_DEVELOPMENT_PUBLIC_ORIGIN
    ),
    sessionCookiePolicy: PUBLIC_DEVELOPMENT_SESSION_COOKIE_POLICY
  };
}

export function createPublicDevelopmentApp(
  environment?: PublicDevelopmentEnvironment
): Hono {
  return createApp(createPublicDevelopmentDependencies(environment));
}
