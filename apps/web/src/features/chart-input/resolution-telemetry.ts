export type CoordinateAxis = 'latitude' | 'longitude';

/** Formats an existing resolver coordinate for display without changing its value. */
export function formatCoordinate(
  value: number | null | undefined,
  axis: CoordinateAxis
): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  if (value === 0) {
    return '0°';
  }

  const direction = value < 0
    ? axis === 'latitude' ? 'S' : 'W'
    : axis === 'latitude' ? 'N' : 'E';

  return `${Math.abs(value)}° ${direction}`;
}
