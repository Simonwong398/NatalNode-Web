export interface EmailMagicLinkMessageRequest {
  readonly magicLinkUrl: string;
  readonly expiresAt: string;
}

export interface EmailMagicLinkMessage {
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

const HTML_ESCAPE_MAP: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => HTML_ESCAPE_MAP[character] ?? character);
}

function formatExpirationForEmail(expiresAt: string): string {
  const timestamp = Date.parse(expiresAt);

  if (Number.isNaN(timestamp)) {
    throw new Error('Magic-link expiration must be a valid timestamp.');
  }

  return new Date(timestamp).toISOString();
}

export function buildEmailMagicLinkMessage(
  request: EmailMagicLinkMessageRequest
): EmailMagicLinkMessage {
  const expiration = formatExpirationForEmail(request.expiresAt);
  const escapedMagicLinkUrl = escapeHtml(request.magicLinkUrl);
  const escapedExpiration = escapeHtml(expiration);

  return {
    subject: 'Sign in to NatalNode',
    text: [
      'Use this link to sign in to NatalNode:',
      request.magicLinkUrl,
      '',
      `This link expires at ${expiration} UTC.`,
      'If you did not request this email, you can ignore it.'
    ].join('\n'),
    html: [
      '<!doctype html>',
      '<html lang="en">',
      '<body>',
      '<p>Use this link to sign in to NatalNode:</p>',
      `<p><a href="${escapedMagicLinkUrl}">Sign in to NatalNode</a></p>`,
      `<p>This link expires at <time datetime="${escapedExpiration}">${escapedExpiration} UTC</time>.</p>`,
      '<p>If you did not request this email, you can ignore it.</p>',
      '</body>',
      '</html>'
    ].join('')
  };
}
