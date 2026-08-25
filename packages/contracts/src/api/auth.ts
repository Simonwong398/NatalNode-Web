export interface RequestEmailMagicLinkApiRequest {
  readonly email: string;
}

export interface RequestEmailMagicLinkApiResponse {
  readonly accepted: true;
}

export interface CompleteEmailMagicLinkApiRequest {
  readonly token: string;
}

export interface CompleteEmailMagicLinkApiResponse {
  readonly authenticated: true;
}

export interface LogoutApiResponse {
  readonly signedOut: true;
}

export interface CurrentSessionApiResponse {
  readonly authenticated: boolean;
}

export type AuthApiErrorCode = 'INVALID_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_ERROR';

export interface AuthApiErrorResponse {
  readonly error: {
    readonly code: AuthApiErrorCode;
    readonly message: string;
  };
}
