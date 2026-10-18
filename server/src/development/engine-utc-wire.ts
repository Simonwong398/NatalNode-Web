/** Serialize an already resolved UTC instant using the Engine's millisecond wire format. */
export function serializeEngineUtcInstant(instant: string): string {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/u.exec(instant);
  if (match === null) {
    throw new TypeError('The Engine wire instant requires UTC Z and at most millisecond precision.');
  }
  const iso = `${match[1]}.${(match[2] ?? '').padEnd(3, '0')}Z`;
  const milliseconds = Date.parse(iso);
  if (!Number.isFinite(milliseconds) || new Date(milliseconds).toISOString() !== iso) {
    throw new TypeError('The Engine wire instant is not a valid UTC date and time.');
  }
  return iso.replace('.000Z', 'Z');
}
