export interface ServerRuntimeConfig {
  readonly authentication: {
    readonly magicLinkTtlSeconds: number;
    readonly sessionTtlSeconds: number;
    readonly sessionCookieName: string;
    readonly sessionCookieSecure: boolean;
  };
}
