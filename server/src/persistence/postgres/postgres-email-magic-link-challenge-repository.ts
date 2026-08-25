import type { EmailMagicLinkChallengeRecord } from '../../auth-runtime/types.js';
import type { SqlExecutor } from '../../db/index.js';
import type { EmailMagicLinkChallengeRepository } from '../email-magic-link-challenge-repository.js';

interface EmailMagicLinkChallengeRow {
  challenge_id: string;
  token_hash: string;
  email_normalized: string;
  created_at: Date | string;
  expires_at: Date | string;
  consumed_at: Date | string | null;
}

const INSERT_EMAIL_MAGIC_LINK_CHALLENGE_SQL = `
  INSERT INTO email_magic_link_challenges (
    challenge_id,
    token_hash,
    email_normalized,
    created_at,
    expires_at,
    consumed_at
  )
  VALUES ($1, $2, $3, $4, $5, $6)
`;

const CONSUME_VALID_EMAIL_MAGIC_LINK_CHALLENGE_SQL = `
  UPDATE email_magic_link_challenges
  SET consumed_at = $3
  WHERE token_hash = $1
    AND consumed_at IS NULL
    AND expires_at > $2
  RETURNING
    challenge_id,
    token_hash,
    email_normalized,
    created_at,
    expires_at,
    consumed_at
`;

function toTimestampString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function mapEmailMagicLinkChallengeRow(
  row: EmailMagicLinkChallengeRow
): EmailMagicLinkChallengeRecord {
  return {
    challengeId: row.challenge_id,
    tokenHash: row.token_hash,
    emailNormalized: row.email_normalized,
    createdAt: toTimestampString(row.created_at),
    expiresAt: toTimestampString(row.expires_at),
    consumedAt: row.consumed_at === null ? null : toTimestampString(row.consumed_at)
  };
}

export class PostgresEmailMagicLinkChallengeRepository
  implements EmailMagicLinkChallengeRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async create(record: EmailMagicLinkChallengeRecord): Promise<void> {
    await this.executor.query<never>(INSERT_EMAIL_MAGIC_LINK_CHALLENGE_SQL, [
      record.challengeId,
      record.tokenHash,
      record.emailNormalized,
      record.createdAt,
      record.expiresAt,
      record.consumedAt
    ]);
  }

  public async consumeValidByTokenHash(
    tokenHash: string,
    now: string,
    consumedAt: string
  ): Promise<EmailMagicLinkChallengeRecord | null> {
    const result = await this.executor.query<EmailMagicLinkChallengeRow>(
      CONSUME_VALID_EMAIL_MAGIC_LINK_CHALLENGE_SQL,
      [tokenHash, now, consumedAt]
    );
    const row = result.rows[0];

    return row ? mapEmailMagicLinkChallengeRow(row) : null;
  }
}
