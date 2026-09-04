/**
 * Repository-owned legal publication metadata. The values that are not yet
 * known are deliberately represented as null rather than inferred or faked.
 */

export const LEGAL_POLICY_VERSION = 'V1' as const;
export const LEGAL_CANONICAL_LOCALE = 'en' as const;
export const LEGAL_TRANSLATION_REVIEW_STATUS =
  'PRODUCT_TRANSLATION_NOT_LEGAL_COUNSEL_CERTIFIED' as const;
export const LEGAL_PUBLICATION_STATUS =
  'PRECOMMERCIAL_NOT_LAUNCH_FINAL' as const;

export const LEGAL_UNRESOLVED_VARIABLES = Object.freeze({
  LEGAL_OPERATOR_IDENTITY: null,
  OPERATOR_ADDRESS: null,
  EFFECTIVE_DATE: null,
  PRIVACY_CONTACT_EMAIL: null,
  SUPPORT_CONTACT_EMAIL: null,
  LEGAL_CONTACT_EMAIL: null,
  GOVERNING_LAW_AND_FORUM_CLAUSE: null
} as const);

export type LegalServiceRegistryEntry = {
  readonly id: string;
  readonly category: string;
  readonly provider: string | null;
  readonly status: string;
  readonly attributionRequired?: boolean;
};

/** Only currently known or explicitly deferred provider classes are listed. */
export const LEGAL_SERVICE_REGISTRY: readonly LegalServiceRegistryEntry[] = Object.freeze([
  Object.freeze({
    id: 'geonames',
    category: 'location resolution',
    provider: 'GeoNames',
    status: 'CURRENT_REAL_INTEGRATION',
    attributionRequired: true
  }),
  Object.freeze({
    id: 'authentication-provider',
    category: 'authentication',
    provider: null,
    status: 'PROVIDER_NOT_NAMED'
  }),
  Object.freeze({
    id: 'email-delivery',
    category: 'email delivery',
    provider: null,
    status: 'PROVIDER_NOT_NAMED'
  }),
  Object.freeze({
    id: 'hosting',
    category: 'hosting',
    provider: null,
    status: 'PROVIDER_NOT_NAMED'
  }),
  Object.freeze({
    id: 'database',
    category: 'database',
    provider: null,
    status: 'PROVIDER_NOT_NAMED'
  }),
  Object.freeze({
    id: 'security-infrastructure',
    category: 'security infrastructure',
    provider: null,
    status: 'PROVIDER_NOT_NAMED'
  }),
  Object.freeze({
    id: 'astronomy-provider',
    category: 'future licensed astronomy provider',
    provider: null,
    status: 'PROVIDER DECISION DEFERRED'
  }),
  Object.freeze({
    id: 'payment-processor',
    category: 'future payment processor',
    provider: null,
    status: 'NOT CURRENTLY OFFERED'
  })
]);

export interface LegalLaunchGateItem {
  readonly id: string;
  readonly requirement: string;
  readonly satisfied: false;
  readonly blocking: true;
}

/** The commercial publication gate is intentionally unsatisfied in V1. */
export const LEGAL_PRODUCTION_LAUNCH_GATE: readonly LegalLaunchGateItem[] = Object.freeze([
  Object.freeze({
    id: 'moon-production-ready',
    requirement: 'Moon production-ready',
    satisfied: false,
    blocking: true
  }),
  Object.freeze({
    id: 'production-astronomy-provider-licensed',
    requirement: 'Production astronomy provider commercially licensed',
    satisfied: false,
    blocking: true
  }),
  Object.freeze({
    id: 'us-operating-entity-established',
    requirement: 'U.S. operating entity established',
    satisfied: false,
    blocking: true
  }),
  Object.freeze({
    id: 'natalnode-ip-domain-assigned',
    requirement: 'NatalNode IP/domain assigned as required',
    satisfied: false,
    blocking: true
  }),
  Object.freeze({
    id: 'production-contact-channels-active',
    requirement: 'Production legal/contact email channels active',
    satisfied: false,
    blocking: true
  }),
  Object.freeze({
    id: 'operator-identity-finalized',
    requirement: 'Operator identity finalized',
    satisfied: false,
    blocking: true
  }),
  Object.freeze({
    id: 'operator-address-finalized',
    requirement: 'Operator address finalized',
    satisfied: false,
    blocking: true
  }),
  Object.freeze({
    id: 'effective-date-finalized',
    requirement: 'Effective date finalized',
    satisfied: false,
    blocking: true
  }),
  Object.freeze({
    id: 'governing-law-approved',
    requirement: 'Governing law/forum clause approved',
    satisfied: false,
    blocking: true
  }),
  Object.freeze({
    id: 'provider-registry-reviewed',
    requirement: 'Production subprocessor/provider registry reviewed',
    satisfied: false,
    blocking: true
  }),
  Object.freeze({
    id: 'legal-localization-reviewed',
    requirement: 'Final legal localization review complete',
    satisfied: false,
    blocking: true
  })
]);

export const LEGAL_METADATA = Object.freeze({
  policyVersion: LEGAL_POLICY_VERSION,
  canonicalLocale: LEGAL_CANONICAL_LOCALE,
  translationReviewStatus: LEGAL_TRANSLATION_REVIEW_STATUS,
  publicationStatus: LEGAL_PUBLICATION_STATUS,
  unresolvedVariables: LEGAL_UNRESOLVED_VARIABLES,
  productionLaunchFinal: false
});
