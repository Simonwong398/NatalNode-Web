import { isIP } from 'node:net';

export const TRUSTED_EDGE_CLIENT_IP_HEADER = 'X-NatalNode-Client-IP';
export const DIRECT_OR_UNKNOWN_CLIENT_IDENTITY = 'direct-or-unknown';

function normalizeIpv6Address(address: string): string | null {
  try {
    const hostname = new URL(`http://[${address}]/`).hostname;
    const normalized = hostname.startsWith('[') && hostname.endsWith(']')
      ? hostname.slice(1, -1)
      : hostname;

    return isIP(normalized) === 6 ? normalized.toLowerCase() : null;
  } catch (_error) {
    return null;
  }
}

/**
 * Reads only the private edge-to-API identity header. Generic forwarding
 * headers are intentionally outside this P0 staging trust boundary.
 */
export function parseTrustedEdgeClientIp(headers: Headers): string | null {
  const value = headers.get(TRUSTED_EDGE_CLIENT_IP_HEADER);

  if (
    value === null ||
    value.length === 0 ||
    value !== value.trim() ||
    value.includes(',')
  ) {
    return null;
  }

  const version = isIP(value);

  if (version === 4) {
    return value;
  }

  return version === 6 ? normalizeIpv6Address(value) : null;
}

export function resolveRateLimitClientIdentity(headers: Headers): string {
  return parseTrustedEdgeClientIp(headers) ?? DIRECT_OR_UNKNOWN_CLIENT_IDENTITY;
}
