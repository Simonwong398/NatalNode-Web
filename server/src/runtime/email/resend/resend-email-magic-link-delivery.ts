import { Resend } from 'resend';
import type {
  EmailMagicLinkDelivery,
  EmailMagicLinkDeliveryRequest
} from '../../../auth-runtime/email-magic-link-delivery.js';
import { buildEmailMagicLinkMessage } from '../../../auth-runtime/email-magic-link-message.js';

const RESEND_DELIVERY_ERROR = 'Resend email delivery failed.';

export class ResendEmailMagicLinkDelivery implements EmailMagicLinkDelivery {
  public constructor(
    private readonly resend: Resend,
    private readonly from: string
  ) {}

  public async sendMagicLink(request: EmailMagicLinkDeliveryRequest): Promise<void> {
    const message = buildEmailMagicLinkMessage({
      magicLinkUrl: request.magicLinkUrl,
      expiresAt: request.expiresAt
    });

    let response: Awaited<ReturnType<Resend['emails']['send']>>;

    try {
      response = await this.resend.emails.send({
        from: this.from,
        to: request.emailNormalized,
        subject: message.subject,
        text: message.text,
        html: message.html
      });
    } catch {
      throw new Error(RESEND_DELIVERY_ERROR);
    }

    if (
      response === null ||
      typeof response !== 'object' ||
      response.error !== null ||
      typeof response.data?.id !== 'string' ||
      response.data.id.trim().length === 0
    ) {
      throw new Error(RESEND_DELIVERY_ERROR);
    }
  }
}
