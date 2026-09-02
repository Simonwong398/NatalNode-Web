import { Resend } from 'resend';
import type {
  EmailMagicLinkDelivery,
  EmailMagicLinkDeliveryRequest
} from '../../../auth-runtime/email-magic-link-delivery.js';
import { buildEmailMagicLinkMessage } from '../../../auth-runtime/email-magic-link-message.js';

const RESEND_DELIVERY_ERROR = 'Resend email delivery failed.';
export const RESEND_EXTERNAL_DEADLINE_MS = 10_000;

function awaitWithDeadline<Result>(
  operation: PromiseLike<Result>,
  timeoutMs: number
): Promise<Result> {
  return new Promise<Result>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      settled = true;
      reject(new Error('Resend delivery deadline exceeded.'));
    }, timeoutMs);

    Promise.resolve(operation).then(
      (result) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        resolve(result);
      },
      (error: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

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
      response = await awaitWithDeadline(
        this.resend.emails.send({
          from: this.from,
          to: request.emailNormalized,
          subject: message.subject,
          text: message.text,
          html: message.html
        }),
        RESEND_EXTERNAL_DEADLINE_MS
      );
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
