/** The only external identity provider represented by the P0 Google boundary. */
export const GOOGLE_OIDC_PROVIDER = 'GOOGLE' as const;

export interface GoogleOidcAuthorizationRequestInput {
  readonly state: string;
  readonly codeChallenge: string;
  readonly nonce: string;
  /** The exact environment-specific callback URI selected by the server. */
  readonly redirectUri: string;
}

export interface GoogleOidcAuthorizationRequest {
  /** A provider authorization URL created inside the provider adapter. */
  readonly authorizationUrl: string;
}

export interface GoogleOidcAuthorizationCodeExchangeInput {
  /** The one-time code received at the server callback boundary. */
  readonly code: string;
  /** The exact redirect URI used when the authorization request was created. */
  readonly redirectUri: string;
  /** The server-only verifier recovered from the pending transaction. */
  readonly pkceVerifier: string;
  /** The server-side nonce digest used by the adapter's verification step. */
  readonly expectedNonceHash: string;
}

/**
 * The only identity data that may cross from a verified Google adapter into
 * application Auth code. The Google subject, not the email, is authoritative.
 */
export interface VerifiedGoogleIdentity {
  readonly provider: typeof GOOGLE_OIDC_PROVIDER;
  readonly providerSubject: string;
  readonly verifiedEmail: string;
}

export type GoogleOidcProviderErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'INVALID_RESPONSE'
  | 'VERIFICATION_FAILED';

const GOOGLE_OIDC_PROVIDER_ERROR_MESSAGES: Readonly<
  Record<GoogleOidcProviderErrorCode, string>
> = {
  CONFIGURATION: 'Google OIDC provider configuration is unavailable.',
  NETWORK: 'Google OIDC provider communication failed.',
  INVALID_RESPONSE: 'Google OIDC provider response was invalid.',
  VERIFICATION_FAILED: 'Google OIDC identity verification failed.'
};

/**
 * Bounded provider failure information. Raw provider responses and bodies are
 * intentionally not accepted by this error type.
 */
export class GoogleOidcProviderError extends Error {
  public readonly code: GoogleOidcProviderErrorCode;

  public constructor(code: GoogleOidcProviderErrorCode) {
    super(
      GOOGLE_OIDC_PROVIDER_ERROR_MESSAGES[code] ??
        'Google OIDC provider error code is invalid.'
    );
    if (!Object.prototype.hasOwnProperty.call(GOOGLE_OIDC_PROVIDER_ERROR_MESSAGES, code)) {
      throw new Error('Google OIDC provider error code is invalid.');
    }
    this.name = 'GoogleOidcProviderError';
    this.code = code;
  }
}

/**
 * Internal application/provider boundary. Provider SDK and wire response
 * shapes remain private to a future adapter implementation.
 */
export interface GoogleOidcProvider {
  createAuthorizationRequest(
    input: GoogleOidcAuthorizationRequestInput
  ): GoogleOidcAuthorizationRequest;
  exchangeAuthorizationCode(
    input: GoogleOidcAuthorizationCodeExchangeInput
  ): Promise<VerifiedGoogleIdentity>;
}
