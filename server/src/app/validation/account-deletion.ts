import { isRecord } from './chart-request.js';

export interface AccountDeletionApiRequest {
  readonly confirmation: 'DELETE';
}

export function isAccountDeletionApiRequest(
  value: unknown
): value is AccountDeletionApiRequest {
  return (
    isRecord(value) &&
    Object.keys(value).length === 1 &&
    Object.prototype.hasOwnProperty.call(value, 'confirmation') &&
    value.confirmation === 'DELETE'
  );
}
