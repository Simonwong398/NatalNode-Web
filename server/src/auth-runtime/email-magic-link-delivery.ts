export interface EmailMagicLinkDeliveryRequest {
  readonly emailNormalized: string;
  readonly magicLinkUrl: string;
  readonly expiresAt: string;
}

/** Provider-neutral handoff for a persisted magic-link challenge. */
export interface EmailMagicLinkDelivery {
  sendMagicLink(request: EmailMagicLinkDeliveryRequest): Promise<void>;
}
