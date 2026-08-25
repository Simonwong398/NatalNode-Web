import { Resend } from 'resend';
import type { EmailMagicLinkDelivery } from '../../../auth-runtime/email-magic-link-delivery.js';
import { ResendEmailMagicLinkDelivery } from './resend-email-magic-link-delivery.js';

const RESEND_CONFIGURATION_ERROR = 'Resend email delivery configuration is invalid.';

export interface ResendEmailMagicLinkDeliveryConfig {
  readonly apiKey: string;
  readonly from: string;
}

function requireNonBlank(value: unknown): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(RESEND_CONFIGURATION_ERROR);
  }
}

export function createResendEmailMagicLinkDelivery(
  config: ResendEmailMagicLinkDeliveryConfig
): EmailMagicLinkDelivery {
  if (config === null || typeof config !== 'object') {
    throw new Error(RESEND_CONFIGURATION_ERROR);
  }

  requireNonBlank(config.apiKey);
  requireNonBlank(config.from);

  let resend: Resend;

  try {
    resend = new Resend(config.apiKey);
  } catch {
    throw new Error(RESEND_CONFIGURATION_ERROR);
  }

  return new ResendEmailMagicLinkDelivery(resend, config.from);
}
