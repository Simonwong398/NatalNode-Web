import type { CreateChartNoteApiRequest } from '@natalnode/contracts';
import { isRecord } from './chart-request.js';

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function isChartNoteContentRequest(
  value: unknown
): value is CreateChartNoteApiRequest {
  return (
    isRecord(value) &&
    Object.keys(value).length === 1 &&
    hasOwn(value, 'content') &&
    typeof value.content === 'string'
  );
}
