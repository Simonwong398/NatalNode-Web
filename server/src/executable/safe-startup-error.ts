const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const SENSITIVE_STARTUP_TERMS =
  /\b(?:api[\s_-]?key|authorization|bearer|cookie|credential(?:s)?|database[\s_-]?url|password|secret|token)\b/i;
const URL_CREDENTIALS = /\b[a-z][a-z\d+.-]*:\/\/[^/\s:@]+(?::[^/\s@]*)?@/i;
const SAFE_ERROR_NAME = /^[A-Za-z][A-Za-z0-9 .:_-]{0,63}$/;
const MAX_SAFE_STARTUP_MESSAGE_LENGTH = 240;

function getSafeErrorName(error: unknown): string {
  if (error instanceof Error && SAFE_ERROR_NAME.test(error.name)) {
    return error.name;
  }

  return 'Error';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return '';
}

export function formatSafeStartupError(error: unknown): string {
  const name = getSafeErrorName(error);
  const rawMessage = getErrorMessage(error);
  const message = rawMessage.replace(/\s+/g, ' ').trim();

  if (
    message.length === 0 ||
    message.length > MAX_SAFE_STARTUP_MESSAGE_LENGTH ||
    CONTROL_CHARACTERS.test(rawMessage) ||
    SENSITIVE_STARTUP_TERMS.test(rawMessage) ||
    URL_CREDENTIALS.test(rawMessage)
  ) {
    return `${name}: details redacted.`;
  }

  return `${name}: ${message}`;
}
