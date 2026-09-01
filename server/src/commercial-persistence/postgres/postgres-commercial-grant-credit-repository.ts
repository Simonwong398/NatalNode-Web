import type { SqlExecutor } from '../../db/index.js';
import {
  assertCommercialIdentifier,
  assertCommercialRevision,
  assertCommercialSourceType
} from '../commercial-domain.js';
import { assertReferralTimestamp } from '../referral-domain.js';
import {
  CommercialPersistenceIntegrityError,
  mapCommercialPersistenceFailure,
  postgresErrorCode
} from '../commercial-persistence-errors.js';
import type {
  CommercialGrantCreditRecord,
  CommercialGrantCreditRepository,
  CreateCommercialGrantCreditInput
} from '../repositories.js';

interface GrantCreditRow {
  readonly grant_credit_id: string;
  readonly commercial_authority_id: string;
  readonly source_class: string;
  readonly source_entity_id: string;
  readonly starts_at: string;
  readonly ends_at: string;
  readonly source_revision: string | number | bigint;
  readonly event_id: string;
  readonly created_at: string;
}

const GRANT_CREDIT_COLUMNS_SQL = `
  grant_credit_id,
  commercial_authority_id,
  source_class,
  source_entity_id,
  to_char(starts_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS starts_at,
  to_char(ends_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS ends_at,
  source_revision,
  event_id,
  to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at
`;

const INSERT_GRANT_CREDIT_SQL = `
  INSERT INTO commercial_grant_credits (
    grant_credit_id,
    commercial_authority_id,
    source_class,
    source_entity_id,
    starts_at,
    ends_at,
    source_revision,
    event_id
  )
  VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7::bigint, $8)
  ON CONFLICT (grant_credit_id) DO NOTHING
  RETURNING ${GRANT_CREDIT_COLUMNS_SQL}
`;

const FIND_GRANT_CREDIT_SQL = `
  SELECT ${GRANT_CREDIT_COLUMNS_SQL}
  FROM commercial_grant_credits
  WHERE grant_credit_id = $1
`;

const LIST_GRANT_CREDITS_SQL = `
  SELECT ${GRANT_CREDIT_COLUMNS_SQL}
  FROM commercial_grant_credits
  WHERE commercial_authority_id = $1
  ORDER BY starts_at ASC, grant_credit_id ASC
`;

function mapGrantCreditRow(row: GrantCreditRow): CommercialGrantCreditRecord {
  const sourceClass = assertCommercialSourceType(row.source_class);
  const startsAt = assertReferralTimestamp(row.starts_at, 'startsAt');
  const endsAt = assertReferralTimestamp(row.ends_at, 'endsAt');

  if (startsAt >= endsAt) {
    throw new CommercialPersistenceIntegrityError();
  }

  return Object.freeze({
    grantCreditId: assertCommercialIdentifier(row.grant_credit_id, 'grantCreditId'),
    commercialAuthorityId: assertCommercialIdentifier(
      row.commercial_authority_id,
      'commercialAuthorityId'
    ),
    sourceClass,
    sourceEntityId: assertCommercialIdentifier(
      row.source_entity_id,
      'sourceEntityId'
    ),
    startsAt,
    endsAt,
    sourceRevision: assertCommercialRevision(row.source_revision),
    eventId: assertCommercialIdentifier(row.event_id, 'eventId'),
    createdAt: assertReferralTimestamp(row.created_at, 'createdAt')
  });
}

function normalizeCreateInput(input: CreateCommercialGrantCreditInput): readonly unknown[] {
  const startsAt = assertReferralTimestamp(input.startsAt, 'startsAt');
  const endsAt = assertReferralTimestamp(input.endsAt, 'endsAt');
  if (startsAt >= endsAt) {
    throw new CommercialPersistenceIntegrityError();
  }

  return [
    assertCommercialIdentifier(input.grantCreditId, 'grantCreditId'),
    assertCommercialIdentifier(input.commercialAuthorityId, 'commercialAuthorityId'),
    assertCommercialSourceType(input.sourceClass),
    assertCommercialIdentifier(input.sourceEntityId, 'sourceEntityId'),
    startsAt,
    endsAt,
    assertCommercialRevision(input.sourceRevision),
    assertCommercialIdentifier(input.eventId, 'eventId')
  ];
}

/** Transaction-scoped repository for generic finite commercial grant credits. */
export class PostgresCommercialGrantCreditRepository
  implements CommercialGrantCreditRepository
{
  public constructor(private readonly executor: SqlExecutor) {}

  public async create(
    input: CreateCommercialGrantCreditInput
  ): Promise<CommercialGrantCreditRecord> {
    const params = normalizeCreateInput(input);

    try {
      const inserted = await this.executor.query<GrantCreditRow>(
        INSERT_GRANT_CREDIT_SQL,
        params
      );
      const row = inserted.rows[0];
      if (row !== undefined) {
        return mapGrantCreditRow(row);
      }

      const existing = await this.executor.query<GrantCreditRow>(
        FIND_GRANT_CREDIT_SQL,
        [params[0]]
      );
      const existingRow = existing.rows[0];
      if (existingRow === undefined) {
        throw new CommercialPersistenceIntegrityError();
      }
      const record = mapGrantCreditRow(existingRow);
      if (
        record.commercialAuthorityId !== params[1] ||
        record.sourceClass !== params[2] ||
        record.sourceEntityId !== params[3] ||
        record.startsAt !== params[4] ||
        record.endsAt !== params[5] ||
        record.sourceRevision !== params[6] ||
        record.eventId !== params[7]
      ) {
        throw new CommercialPersistenceIntegrityError();
      }
      return record;
    } catch (error) {
      if (postgresErrorCode(error) === '23505') {
        throw new CommercialPersistenceIntegrityError();
      }
      throw mapCommercialPersistenceFailure(error);
    }
  }

  public async listByAuthority(
    commercialAuthorityIdInput: string
  ): Promise<readonly CommercialGrantCreditRecord[]> {
    const commercialAuthorityId = assertCommercialIdentifier(
      commercialAuthorityIdInput,
      'commercialAuthorityId'
    );

    try {
      const result = await this.executor.query<GrantCreditRow>(
        LIST_GRANT_CREDITS_SQL,
        [commercialAuthorityId]
      );
      return Object.freeze(result.rows.map(mapGrantCreditRow));
    } catch (error) {
      throw mapCommercialPersistenceFailure(error);
    }
  }
}
