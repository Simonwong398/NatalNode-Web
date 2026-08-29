export interface ServerRuntimeConfig {
  readonly publicWebOrigin: string;
  readonly webPush: {
    readonly applicationServerKey: string | null;
  };
  readonly authentication: {
    readonly magicLinkTtlSeconds: number;
    readonly sessionTtlSeconds: number;
    readonly sessionCookieName: string;
    readonly sessionCookieSecure: boolean;
  };
}
