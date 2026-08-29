export const PUBLIC_DEVELOPMENT_RUNTIME_IDENTITY = 'public-development';

export const PUBLIC_DEVELOPMENT_PUBLIC_ORIGIN = 'http://localhost:4321';
export const PUBLIC_DEVELOPMENT_PUBLIC_PORT = 4_321;
export const PUBLIC_DEVELOPMENT_API_HOSTNAME = '127.0.0.1';
export const PUBLIC_DEVELOPMENT_API_PORT = 4_322;

export const PUBLIC_DEVELOPMENT_SESSION_COOKIE_POLICY = {
  name: 'nn_session',
  secure: false
} as const;

export const PUBLIC_DEVELOPMENT_AUTHENTICATION_TTLS = {
  magicLinkTtlSeconds: 10 * 60,
  sessionTtlSeconds: 60 * 60
} as const;

export const PUBLIC_DEVELOPMENT_CHART_RESULT_CACHE_IDENTITY = {
  runtimeNamespace: 'development-mock',
  engineResultGeneration: 'UI_FIXTURE_V1',
  chartResultContractVersion: '1.0.0'
} as const;

export interface PublicDevelopmentEnvironment {
  readonly NODE_ENV?: string;
}

export function assertPublicDevelopmentEnvironment(
  environment: PublicDevelopmentEnvironment = process.env
): void {
  if (environment.NODE_ENV?.trim().toLowerCase() === 'production') {
    throw new Error(
      `The ${PUBLIC_DEVELOPMENT_RUNTIME_IDENTITY} runtime cannot start with NODE_ENV=production.`
    );
  }
}
