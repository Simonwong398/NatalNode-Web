import type { FeedbackCategory } from '../feedback.js';

export interface CreateFeedbackApiRequest {
  readonly category: FeedbackCategory;
  readonly message: string;
}

export interface CreateFeedbackApiResponse {
  readonly submitted: true;
}

export type FeedbackApiErrorCode =
  | 'INVALID_REQUEST'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface FeedbackApiErrorResponse {
  readonly error: {
    readonly code: FeedbackApiErrorCode;
    readonly message: string;
  };
}
