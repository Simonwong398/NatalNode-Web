/** The versioned envelope used by the account-export boundary. */
export const ACCOUNT_DATA_EXPORT_SCHEMA_VERSION = '1.0' as const;

export type JsonPrimitive = null | boolean | number | string;

export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export interface AccountDataExportAccountMetadata {
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AccountDataExportIdentity {
  readonly type: 'EMAIL_MAGIC_LINK';
  readonly email: string;
  readonly linkedAt: string;
  readonly updatedAt: string;
}

export interface AccountDataExportAccount
  extends AccountDataExportAccountMetadata {
  readonly identities: readonly AccountDataExportIdentity[];
}

export interface AccountDataExportChartCalculation {
  readonly engineVersion: string;
  readonly chartSchemaVersion: string;
  readonly astronomyConfigurationId: string | null;
  readonly provenanceEnvelopeId: string | null;
}

export interface AccountDataExportChartMetadata {
  readonly displayName: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly favorite: boolean;
  readonly normalizedChartRequest: JsonValue;
  readonly canonicalChartResult: JsonValue;
  readonly calculation: AccountDataExportChartCalculation;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AccountDataExportNote {
  readonly content: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AccountDataExportChart extends AccountDataExportChartMetadata {
  readonly notes: readonly AccountDataExportNote[];
}

export interface AccountDataExportFeedback {
  readonly category: string;
  readonly message: string;
  readonly createdAt: string;
}

export interface AccountDataExportV1 {
  readonly exportSchemaVersion: typeof ACCOUNT_DATA_EXPORT_SCHEMA_VERSION;
  readonly exportedAt: string;
  readonly account: AccountDataExportAccount;
  readonly charts: readonly AccountDataExportChart[];
  readonly feedback: readonly AccountDataExportFeedback[];
}

/**
 * Explicit presentation input for the account root. It is deliberately not
 * a persistence-row type so the export shape cannot grow by raw spreading.
 */
export interface AccountDataExportAccountPresentationSource {
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Explicit presentation input for an identity read inside the snapshot. */
export interface AccountDataExportIdentityPresentationSource {
  readonly provider: string;
  readonly providerSubject: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Explicit presentation input for a persisted chart snapshot. */
export interface AccountDataExportChartPresentationSource {
  readonly displayName: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly favorite: boolean;
  readonly normalizedChartRequest: unknown;
  readonly canonicalChartResult: unknown;
  readonly engineVersion: string;
  readonly chartSchemaVersion: string;
  readonly astronomyConfigurationId: string | null;
  readonly provenanceEnvelopeId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly notes?: readonly AccountDataExportNotePresentationSource[];
}

/** Explicit presentation input for a nested chart note. */
export interface AccountDataExportNotePresentationSource {
  readonly content: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Explicit presentation input for private Feedback. */
export interface AccountDataExportFeedbackPresentationSource {
  readonly category: string;
  readonly message: string;
  readonly createdAt: string;
}

export class UnsupportedAccountDataExportIdentityError extends Error {
  public readonly provider: string;

  public constructor(provider: string) {
    super('Account export cannot safely present this identity provider.');
    this.name = 'UnsupportedAccountDataExportIdentityError';
    this.provider = provider;
  }
}

export class UnsafeAccountDataExportValueError extends Error {
  public readonly fieldName: string;

  public constructor(fieldName: string) {
    super(`Account export contains an unsafe value in ${fieldName}.`);
    this.name = 'UnsafeAccountDataExportValueError';
    this.fieldName = fieldName;
  }
}

function isPlainObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function cloneJsonValue(
  value: unknown,
  fieldName: string,
  ancestors: WeakSet<object>
): JsonValue {
  if (value === null) {
    return null;
  }

  switch (typeof value) {
    case 'boolean':
    case 'string':
      return value;
    case 'number':
      if (Number.isFinite(value)) {
        return value;
      }
      throw new UnsafeAccountDataExportValueError(fieldName);
    case 'object':
      break;
    default:
      throw new UnsafeAccountDataExportValueError(fieldName);
  }

  if (ancestors.has(value)) {
    throw new UnsafeAccountDataExportValueError(fieldName);
  }

  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      const symbolKeys = Object.getOwnPropertySymbols(value);

      if (symbolKeys.length !== 0) {
        throw new UnsafeAccountDataExportValueError(fieldName);
      }

      const clone: JsonValue[] = [];

      for (let index = 0; index < value.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));

        if (descriptor === undefined || !('value' in descriptor)) {
          throw new UnsafeAccountDataExportValueError(fieldName);
        }

        clone.push(cloneJsonValue(descriptor.value, fieldName, ancestors));
      }

      for (const key of Object.keys(value)) {
        if (!/^\d+$/u.test(key) || Number(key) >= value.length) {
          throw new UnsafeAccountDataExportValueError(fieldName);
        }
      }

      return clone;
    }

    if (!isPlainObject(value)) {
      throw new UnsafeAccountDataExportValueError(fieldName);
    }

    const clone: Record<string, JsonValue> = {};

    for (const symbolKey of Object.getOwnPropertySymbols(value)) {
      void symbolKey;
      throw new UnsafeAccountDataExportValueError(fieldName);
    }

    for (const key of Object.keys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);

      if (descriptor === undefined || !('value' in descriptor)) {
        throw new UnsafeAccountDataExportValueError(fieldName);
      }

      Object.defineProperty(clone, key, {
        configurable: true,
        enumerable: true,
        value: cloneJsonValue(descriptor.value, fieldName, ancestors),
        writable: true
      });
    }

    return clone;
  } finally {
    ancestors.delete(value);
  }
}

/**
 * Validates and copies persisted JSONB-shaped data without applying current
 * scientific contracts, normalization, or recalculation.
 */
export function assertAccountDataExportJsonValue(
  value: unknown,
  fieldName: string
): JsonValue {
  return cloneJsonValue(value, fieldName, new WeakSet<object>());
}

export function presentAccountDataExportAccount(
  source: AccountDataExportAccountPresentationSource
): AccountDataExportAccountMetadata {
  return {
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  };
}

export function presentAccountDataExportIdentity(
  source: AccountDataExportIdentityPresentationSource
): AccountDataExportIdentity {
  if (source.provider !== 'EMAIL_MAGIC_LINK') {
    throw new UnsupportedAccountDataExportIdentityError(source.provider);
  }

  return {
    type: 'EMAIL_MAGIC_LINK',
    email: source.providerSubject,
    linkedAt: source.createdAt,
    updatedAt: source.updatedAt
  };
}

function assertStringArray(
  value: readonly string[],
  fieldName: string
): readonly string[] {
  return value.map((item) => {
    if (typeof item !== 'string') {
      throw new UnsafeAccountDataExportValueError(fieldName);
    }

    return item;
  });
}

export function presentAccountDataExportChartMetadata(
  source: AccountDataExportChartPresentationSource
): AccountDataExportChartMetadata {
  return {
    displayName: source.displayName,
    category: source.category,
    tags: assertStringArray(source.tags, 'tags'),
    favorite: source.favorite,
    normalizedChartRequest: assertAccountDataExportJsonValue(
      source.normalizedChartRequest,
      'normalizedChartRequest'
    ),
    canonicalChartResult: assertAccountDataExportJsonValue(
      source.canonicalChartResult,
      'canonicalChartResult'
    ),
    calculation: {
      engineVersion: source.engineVersion,
      chartSchemaVersion: source.chartSchemaVersion,
      astronomyConfigurationId: source.astronomyConfigurationId,
      provenanceEnvelopeId: source.provenanceEnvelopeId
    },
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  };
}

export function presentAccountDataExportNote(
  source: AccountDataExportNotePresentationSource
): AccountDataExportNote {
  return {
    content: source.content,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt
  };
}

export function presentAccountDataExportChart(
  source: AccountDataExportChartPresentationSource
): AccountDataExportChart {
  return {
    ...presentAccountDataExportChartMetadata(source),
    notes: (source.notes ?? []).map(presentAccountDataExportNote)
  };
}

export function presentAccountDataExportFeedback(
  source: AccountDataExportFeedbackPresentationSource
): AccountDataExportFeedback {
  return {
    category: source.category,
    message: source.message,
    createdAt: source.createdAt
  };
}

/** Names used by the product contract remain available at this boundary. */
export type NatalNodeAccountDataExportV1 = AccountDataExportV1;
export type EmailMagicLinkExportIdentityV1 = AccountDataExportIdentity;
export type AccountChartExportV1 = AccountDataExportChart;
export type ChartNoteExportV1 = AccountDataExportNote;
export type FeedbackExportV1 = AccountDataExportFeedback;
