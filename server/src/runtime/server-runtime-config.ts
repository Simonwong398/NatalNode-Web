import type { WebPushVapidReadiness } from '../notification-platform/web-push-vapid.js';

export type ServerRuntimeMode = 'local' | 'staging' | 'production';

export type RateLimitAuthorityKind = 'process-local' | 'distributed';

export interface ServerOperationalConfig {
  readonly runtimeMode: ServerRuntimeMode;
  readonly authentication: {
    readonly emailEnabled: boolean;
    readonly googleEnabled: boolean;
  };
  readonly community: {
    readonly enabled: boolean;
    readonly operatorConfigured: boolean;
  };
  readonly practitioner: {
    readonly enabled: boolean;
    readonly operatorConfigured: boolean;
  };
  readonly rateLimiting: {
    readonly authority: RateLimitAuthorityKind;
    readonly singleReplicaConfirmed: boolean;
  };
  readonly observability: {
    readonly durableSinkConfigured: boolean;
  };
  readonly privacyAccessAuditRequired: boolean;
}

export interface ServerRuntimeConfig {
  readonly publicWebOrigin: string;
  readonly locationResolution: {
    /** Server-only GeoNames account name; null keeps the provider unavailable. */
    readonly geonamesUsername: string | null;
  };
  readonly operational: ServerOperationalConfig;
  readonly webPush: {
    readonly applicationServerKey: string | null;
    /** Server-only readiness; never projected into browser-facing responses. */
    readonly deliveryReadiness: WebPushVapidReadiness;
  };
  readonly authentication: {
    readonly magicLinkTtlSeconds: number;
    readonly sessionTtlSeconds: number;
    readonly sessionCookieName: string;
    readonly sessionCookieSecure: boolean;
  };
}
