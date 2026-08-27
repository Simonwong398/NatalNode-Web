import type {
  SkyEventsRequest,
  SkySnapshotRequest
} from '@natalnode/contracts';
import { isRecord } from './chart-request.js';

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function isCanonicalUtcTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value;
}

export function isSkySnapshotRequest(
  value: unknown
): value is SkySnapshotRequest {
  return (
    isRecord(value) &&
    Object.keys(value).length === 1 &&
    hasOwn(value, 'atUtc') &&
    isCanonicalUtcTimestamp(value.atUtc)
  );
}

export function isSkyEventsRequest(value: unknown): value is SkyEventsRequest {
  if (
    !isRecord(value) ||
    Object.keys(value).length !== 2 ||
    !hasOwn(value, 'startUtc') ||
    !hasOwn(value, 'endUtc') ||
    !isCanonicalUtcTimestamp(value.startUtc) ||
    !isCanonicalUtcTimestamp(value.endUtc)
  ) {
    return false;
  }

  return Date.parse(value.startUtc) < Date.parse(value.endUtc);
}
