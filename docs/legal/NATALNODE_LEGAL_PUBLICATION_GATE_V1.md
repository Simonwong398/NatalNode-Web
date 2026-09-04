# NatalNode Legal Publication Gate V1

Status: PRECOMMERCIAL_NOT_LAUNCH_FINAL

This document records the repository-owned publication metadata for the
Product Owner-approved NatalNode Privacy Policy V1 and Terms of Service V1.
It is an implementation and release gate, not a replacement for either legal
document and not a statement that the product is ready for commercial launch.

## Authority and provenance

- Canonical semantic locale: en
- Policy version: V1
- Canonical Privacy authority: NATALNODE_PRIVACY_POLICY_V1
- Canonical Terms authority: NATALNODE_TERMS_OF_SERVICE_V1
- Non-English pages: presentation translations derived from the English
  authority
- Translation review status:
  PRODUCT_TRANSLATION_NOT_LEGAL_COUNSEL_CERTIFIED
- Frozen runtime locales: en, es, fr, de, ja, ko, zh-Hant
- zh-Hans is not a runtime locale

The structured execution representation is maintained in:

- apps/web/src/lib/legal-canonical-content.ts
- apps/web/src/lib/legal-localization.ts
- apps/web/src/lib/legal-content.ts
- apps/web/src/lib/legal-metadata.ts

The English documents in this directory are the human-readable semantic
authority. The application files provide structured formatting, deterministic
localization, safe development presentation of unresolved values, and
machine-readable checks; they do not create a second legal policy.

## Current operator state

- Development ownership: FOUNDER-HELD
- Current PRC company: NOT USED FOR NATALNODE
- Public production operator: DEFERRED UNTIL COMMERCIALIZATION
- Planned commercialization direction: an independent U.S. operating entity
  before material commercialization

No company name, EIN, registered address, state of formation, governing
jurisdiction, arbitration forum, or other production legal identity is inferred
by this gate.

## Unresolved production variables

The following variables remain intentionally unresolved and are retained in the
canonical source documents:

- LEGAL_OPERATOR_IDENTITY (represented in approved copy as
  [OPERATOR_LEGAL_NAME])
- OPERATOR_ADDRESS
- EFFECTIVE_DATE
- PRIVACY_CONTACT_EMAIL
- SUPPORT_CONTACT_EMAIL
- LEGAL_CONTACT_EMAIL
- GOVERNING_LAW_AND_FORUM_CLAUSE

Development and owner-QA pages use truthful, localized neutral statements that
these values will be finalized before public commercial launch. The pages do
not expose raw placeholder tokens as if they were real legal values.

## Service registry

Only known or explicitly deferred service classes are recorded:

| Class | Status |
| --- | --- |
| GeoNames | Existing real location integration; attribution required where applicable |
| Authentication provider | Provider not named |
| Email delivery | Provider not named |
| Hosting | Provider not named |
| Database | Provider not named |
| Security infrastructure | Provider not named |
| Future licensed astronomy provider | PROVIDER DECISION DEFERRED |
| Future payment processor | Not currently offered |

No concrete production astronomy vendor is named by this V1 gate.

## Production-commercial launch gate

All items below are blocking and must be satisfied before the legal package is
treated as production-commercial-launch-final:

- [ ] Moon production-ready
- [ ] Production astronomy provider commercially licensed
- [ ] U.S. operating entity established
- [ ] NatalNode IP/domain assigned as required
- [ ] Production legal/contact email channels active
- [ ] Operator identity finalized
- [ ] Operator address finalized
- [ ] Effective date finalized
- [ ] Governing law/forum clause approved
- [ ] Production subprocessor/provider registry reviewed
- [ ] Final legal localization review complete

This gate is intentionally machine-readable in
apps/web/src/lib/legal-metadata.ts and remains unsatisfied in V1.
