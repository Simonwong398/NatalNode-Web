# NatalNode Chart-Level PersonalTheme Selector V1

Status: development/research POC only. Runtime admission is explicitly `NO`.

This contract defines how a deterministic set of already-admitted PersonalTheme
candidate objects becomes a small editorial set. It is a display-role selector,
not an astrology-strength calculator, a new synthesis engine, or a source of
ChartFacts.

## Frozen policy

- Policy ID: `NATALNODE_CHART_LEVEL_PERSONAL_THEME_SELECTOR_POC_V1`
- Policy version: `1.0.0`
- Selection mode: ordinal rules with stable identity tie-break
- Preferred core range: 3–5 when legitimate candidates support it
- Hard minimum: none; 0, 1, or 2 are legal outputs
- Maximum core themes: 5
- Automatic Sun, Moon, ASC, or body priority: forbidden
- One-theme-per-domain quota: forbidden
- Numeric theme ranking, weights, percentages, and intensity aggregation: forbidden
- Runtime, production My Chart, and broad-scale admission: `NO`

Editorial selection is not astrological strength. A `CORE` role does not alter
the candidate's `direction`, `intensity`, `confidence`, evidence count, or
authority. A non-core candidate remains inspectable as a `SUPPORTING_THREAD`,
`SUBSUMED`, or `SUPPRESSED` result with a reason and provenance.

## Input boundary

The selector accepts repository-equivalent, already-admitted research
candidates. Each candidate must retain:

- a stable candidate/theme identity;
- source Signal IDs, semantic unit IDs, and astronomical root keys;
- closed-domain, direction, intensity, and confidence values;
- a personal-relevance basis, semantic identity, and reader-meaning key;
- relational enrichment and explicit subsumption metadata;
- authority and unknown-time eligibility;
- semantic-basis IDs;
- source fact references plus WHY/LEARN readiness.

The POC consumes representative Signal semantics from the bounded Body × Sign
and Aspect inventories. It does not fabricate ChartFacts or invoke an
astronomy provider.

## Ordered selector gates

The implementation applies these gates in order. Coherence is a chart-scope
safety check: a same-body/different-sign placement conflict fails closed rather
than allowing authority or deduplication logic to hide it.

1. Authority eligibility and unknown-time safety.
2. Coherence/conflict check for same natal body, placement type, and scope.
3. Semantic validity of identity, units, roots, domain, and placement shape.
4. Exact duplicate control by fact identity.
5. Redundancy control by reader meaning; a different candidate identity with
   the same meaning is suppressed as redundant.
6. Explicit relational subsumption. A relational candidate may own placement
   themes, while preserving their source provenance.
7. Personal relevance as an ordinal preference.
8. Semantic distinctness after duplicate and redundancy control.
9. Relational enrichment value as an ordinal preference.
10. Domain breadth as a tie-break only. It never creates a domain quota.
11. WHY/LEARN and source-provenance completeness.
12. Stable candidate identity tie-break, then `CORE`/`SUPPORTING_THREAD`
    assignment under the five-theme ceiling.

An eligible candidate that misses the core ceiling becomes a
`SUPPORTING_THREAD`; it is not silently dropped. A candidate intentionally
owned by an admitted relational theme becomes `SUBSUMED`. Exact duplicates and
equivalent reader meanings become `SUPPRESSED` with distinct reasons.

## Output contract

Every result includes:

```text
selectorPolicyId
selectorPolicyVersion
inputCandidateIds
eligibleCandidateIds
coreThemeIds
supportingThemeIds
subsumedThemeIds
suppressedThemeIds
failureState
decisionTrace[]
```

Each decision trace records `candidateId`, `gate`, `outcome`, `reason`, and
related candidate IDs. A conflict result uses
`CONFLICTING_BODY_SIGN_PLACEMENT`, returns no selected themes, and does not
choose an arbitrary sign.

## Selection invariants

- `Moon × Aries` and `Mercury × Aries` remain distinct semantic candidates;
  shared sign is not redundancy.
- Two candidates may share a domain; domain identity alone is not redundancy.
- Moon placement + Mercury placement + a compatible relational theme may yield
  one relational core theme plus subsumed placement themes, not three core
  slots.
- Repeated references do not increase confidence, intensity, or evidence.
- Unknown-time selection admits only candidates explicitly marked
  `UNKNOWN_TIME_SAFE`; no ASC, MC, houses, or fabricated time may enter.
- Counterevidence promotion is not implemented. Qualification metadata may be
  preserved, but no negative numeric weighting is introduced.
