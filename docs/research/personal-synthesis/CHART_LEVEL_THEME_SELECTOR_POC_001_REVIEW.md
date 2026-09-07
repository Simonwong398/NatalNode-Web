# WEB-P2-CHART-LEVEL-SELECTOR-001 Review

## Status

`PASS` for the bounded development/research POC.

This review covers the ordinal chart-level PersonalTheme selector only. It does
not admit a production selector, My Chart runtime wiring, or broad-scale
interpretation.

## Policy result

The selector is `NATALNODE_CHART_LEVEL_PERSONAL_THEME_SELECTOR_POC_V1@1.0.0`.
It consumes existing representative Body × Sign and Aspect candidate semantics
and exposes separate editorial roles:

- `CORE`
- `SUPPORTING_THREAD`
- `SUBSUMED`
- `SUPPRESSED`

Editorial role is separate from direction, intensity, confidence, authority,
semantic units, and evidence roots. No numeric rank, weight, percentage, body
priority, domain quota, confidence promotion, intensity promotion, or evidence
inflation is present.

## Ordered decisions

The implementation records traces for authority/time eligibility, coherence,
semantic validity, duplicate handling, redundancy handling, explicit
subsumption, relevance, distinctness, relational enrichment, domain breadth,
provenance completeness, stable identity, and final editorial role.

Coherence is fail-closed at chart scope. A same-body/different-sign natal
placement pair returns `CONFLICTING_BODY_SIGN_PLACEMENT`; it is never resolved
by arbitrary deduplication. Exact duplicate fact identities and different
candidate identities with equivalent reader meaning remain separate outcomes.

## Scenario evidence

| Scenario | Input | Result |
| --- | --- | --- |
| A | Sun Aries, Moon Taurus, Mercury Aries, Venus Taurus, Mars Aries | Five distinct core themes; repeated signs do not collapse candidates. |
| B | Scenario A plus two supporting projections and one exact duplicate | Five core, two `SUPPORTING_THREAD`, one suppressed duplicate; every input is accounted for. |
| C | Moon Taurus, Mercury Aries | Exactly two core; no hard minimum and no filler. |
| D | Moon Aries, Mercury Aries, compatible Moon–Mercury conjunction, Venus Taurus, Mars Aries | Relational theme is core; Moon and Mercury placement themes are subsumed; Venus and Mars remain core. |
| E | Exact Moon Taurus duplicate plus equivalent projection | One visible core; duplicate and redundancy each receive their own suppression trace and provenance. |
| F | Moon Aries plus Moon Taurus | Selection fails closed with `CONFLICTING_BODY_SIGN_PLACEMENT`; no sign is chosen. |
| G | Time-safe placement-only five-candidate chart | Useful core output without aspects, ASC, MC, houses, or fabricated time. |

Scenario B uses alternate projections of existing admitted semantic units, not
new natal placements. Scenario D reuses the accepted relational semantic unit
and root model. Scenario G remains placement-only because the current Aspect
policy is unknown-time fail-closed without authoritative certification.

## Gates

| Gate | Result |
| --- | --- |
| CHART_LEVEL_SELECTOR_CONTRACT | PASS |
| ORDINAL_SELECTION | PASS |
| NO_NUMERIC_RANKING | PASS |
| PREFERRED_THEME_BUDGET | PASS |
| FEWER_THAN_THREE_ALLOWED | PASS |
| NO_FILLER | PASS |
| SEMANTIC_DISTINCTNESS | PASS |
| NO_SIGN_SHORTCUT | PASS |
| NO_DOMAIN_QUOTA | PASS |
| RELATIONAL_SUBSUMPTION | PASS |
| REDUNDANCY_CONTROL | PASS |
| DUPLICATE_CONTROL | PASS |
| CONFLICT_FAIL_CLOSED | PASS |
| SUPPORTING_THREAD_ASSIGNMENT | PASS |
| EDITORIAL_PRIORITY_SEPARATION | PASS |
| UNKNOWN_TIME_SELECTION | PASS |
| DETERMINISTIC_SELECTION | PASS |
| PROVENANCE_PRESERVATION | PASS |

## Readiness

- `READY_FOR_TARGETED_ASPECT_EXPANSION YES`
- `READY_FOR_PRODUCTION_SELECTOR NO`
- `READY_FOR_PRODUCTION_MY_CHART NO`
- `READY_FOR_BROAD_SCALE NO`
- `RUNTIME_ADMISSION NO`
