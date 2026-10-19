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
  /** Optional server-side provider account for local location UI testing. */
  readonly GEONAMES_USERNAME?: string;
  /** Optional loopback preview ports for running beside another local checkout. */
  readonly NATALNODE_PUBLIC_DEVELOPMENT_PUBLIC_PORT?: string;
  readonly NATALNODE_PUBLIC_DEVELOPMENT_API_PORT?: string;
}

export interface PublicDevelopmentNetworkConfig {
  readonly publicOrigin: string;
  readonly publicPort: number;
  readonly apiHostname: typeof PUBLIC_DEVELOPMENT_API_HOSTNAME;
  readonly apiPort: number;
}

function parseDevelopmentPort(
  value: string | undefined,
  fallback: number,
  label: string
): number {
  if (value === undefined || value.trim() === '') return fallback;
  if (!/^\d{1,5}$/u.test(value.trim())) {
    throw new Error(`${label} must be a valid loopback port.`);
  }
  const parsed = Number(value.trim());
  if (!Number.isSafeInteger(parsed) || parsed < 1024 || parsed > 65_535) {
    throw new Error(`${label} must be a valid loopback port.`);
  }
  return parsed;
}

export function resolvePublicDevelopmentNetworkConfig(
  environment: PublicDevelopmentEnvironment = process.env
): PublicDevelopmentNetworkConfig {
  const publicPort = parseDevelopmentPort(
    environment.NATALNODE_PUBLIC_DEVELOPMENT_PUBLIC_PORT,
    PUBLIC_DEVELOPMENT_PUBLIC_PORT,
    'NATALNODE_PUBLIC_DEVELOPMENT_PUBLIC_PORT'
  );
  const apiPort = parseDevelopmentPort(
    environment.NATALNODE_PUBLIC_DEVELOPMENT_API_PORT,
    PUBLIC_DEVELOPMENT_API_PORT,
    'NATALNODE_PUBLIC_DEVELOPMENT_API_PORT'
  );
  if (publicPort === apiPort) {
    throw new Error('Public-development Web and API ports must be different.');
  }
  return Object.freeze({
    publicOrigin: `http://localhost:${publicPort}`,
    publicPort,
    apiHostname: PUBLIC_DEVELOPMENT_API_HOSTNAME,
    apiPort
  });
}

export function assertPublicDevelopmentEnvironment(
  environment: PublicDevelopmentEnvironment = process.env
): void {
  if (environment.NODE_ENV?.trim().toLowerCase() === 'production') {
    throw new Error(
      `The ${PUBLIC_DEVELOPMENT_RUNTIME_IDENTITY} runtime cannot start with NODE_ENV=production.`
    );
  }
  resolvePublicDevelopmentNetworkConfig(environment);
}
