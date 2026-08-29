import type { WebPushVapidReadiness } from '../notification-platform/web-push-vapid.js';

export interface ServerRuntimeConfig {
  readonly publicWebOrigin: string;
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
