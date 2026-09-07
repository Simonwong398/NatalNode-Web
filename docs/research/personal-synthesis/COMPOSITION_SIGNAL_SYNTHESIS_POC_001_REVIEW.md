# Composition Signal → Personal Synthesis POC 001 Review

| Field | Value |
| --- | --- |
| Task | `WEB-P2-SIGNAL-SYNTHESIS-001` |
| Baseline | `f6a3de578dd1dadff939075eafef9e38db57ccde` |
| Review result | `BOUNDED_SIGNAL_SYNTHESIS_POC_PASS` |
| Upstream Signal policy | `BOUNDED_SIGNAL_ADMISSION = PASS` |
| Input authority | `RESEARCH_REPRESENTATIVE_SIGNAL` / `INCOMPLETE_RESEARCH` |
| Personal Synthesis authority | `DEVELOPMENT_ONLY` |
| Runtime | `RUNTIME_NOT_ADMITTED` |

This dossier proves the downstream bridge from already-structured admitted
representative Signals into the existing deterministic Personal Synthesis POC.
It does not evaluate ChartFacts, create Signals from fixtures, create a
PersonalTheme in production, or authorize My Chart, Weekly, Engine, BFF,
provider, AI, or runtime wiring.

## 1. Authority boundary

The upstream production path remains unimplemented here:

```text
REAL AUTHORITATIVE ChartFact
  -> admitted composition
  -> admitted Signal rule
  -> Signal
  -> later Personal Synthesis
```

The adapter starts after the Signal boundary. Its source type is explicitly
`RESEARCH_REPRESENTATIVE_SIGNAL`; provenance uses `INCOMPLETE_RESEARCH`, and
the resulting synthesis remains `DEVELOPMENT_ONLY`. It rejects a structured
input that claims `AUTHORITATIVE_ENGINE` and never constructs one.

The research placement reference is typed as `OTHER` under a
`/research/composition-signals/` path. It is a trace key, not a fabricated
ChartFact. The representative JSON is read by the targeted Node test; the
TypeScript adapter does not import the docs artifact and no production bundle
depends on it.

## 2. Adapter and contract resolution

The adapter is:

```text
structured representative Signal
  -> research-only Personal Synthesis input
  -> existing Personal Synthesis grouping / selection / editorial projection
  -> DEVELOPMENT_ONLY PersonalTheme candidate
```

The following fields survive into each selected theme's
`representativeSignalTraces` and WHY trace:

- Signal ID;
- composition ID;
- rule ID and version;
- eligible domain;
- direction;
- intensity;
- confidence;
- `placementEvidenceKey` and `evidenceUnitCount`;
- semantic claim, constructive capacity, and possible tension;
- semantic basis;
- WHY and LEARN references;
- birth-time eligibility;
- suppression conditions/state; and
- research provenance.

The existing fixture synthesis contract expects `internalStrength`, priority,
and ranking metadata. The representative Signal policy does not provide those
values, so the adapter does not invent them. The downstream POC uses a stable
Signal-identity ordering only as a deterministic selection tie-break, explicitly
annotated `no priority inferred`. No internal strength is derived from
`SUBTLE`, `LOW`, domain, or prose.

## 3. Current PersonalTheme candidates

Each surviving representative Signal produces at most one candidate theme. The
four bounded inputs project to these candidate keys:

| Composition | Candidate key | Domain | Direction | Intensity | Confidence |
| --- | --- | --- | --- | --- | --- |
| Moon × Aries | `moon-aries-response-initiation` | `EMOTIONAL` | `NEUTRAL` | `SUBTLE` | `LOW` |
| Mercury × Aries | `mercury-aries-information-initiation` | `COMMUNICATION` | `NEUTRAL` | `SUBTLE` | `LOW` |
| Moon × Taurus | `moon-taurus-response-embodiment` | `EMOTIONAL` | `NEUTRAL` | `SUBTLE` | `LOW` |
| Mercury × Taurus | `mercury-taurus-information-embodiment` | `COMMUNICATION` | `NEUTRAL` | `SUBTLE` | `LOW` |

The output remains a bounded PersonalTheme candidate, not a final reader
reading. Existing editorial templates provide structure only; the preserved
Signal trace remains the authority for the semantic claim and its limits.

## 4. Scenario results

### Scenario A — Moon in Aries + Mercury in Aries

- two distinct placement evidence keys;
- two eligible Signals and two candidate themes;
- domains remain `EMOTIONAL` and `COMMUNICATION`;
- both remain `NEUTRAL / SUBTLE / LOW`;
- both themes are `SINGLE_EVIDENCE`; and
- shared Aries does not create convergence or an automatic merge.

### Scenario B — Moon in Taurus + Mercury in Aries

- two independent placement evidences;
- two candidate themes with distinct semantic claims;
- no automatic convergence;
- no forced domain-diversity selection; and
- no invented tension between the Signals.

### Scenario C — Moon in Taurus + Mercury in Taurus

- two independent placement evidences;
- Moon and Mercury semantics remain distinct;
- both themes remain separate `SINGLE_EVIDENCE` candidates; and
- shared Taurus does not create convergence.

### Scenario D — duplicate Moon in Aries Signal

- two input references reduce to one eligible Signal;
- one duplicate is reported as `DUPLICATE_SAME_PLACEMENT`;
- one evidence unit and one candidate theme remain;
- confidence stays `LOW`;
- intensity stays `SUBTLE`; and
- no priority or convergence inflation occurs.

### Scenario E — unknown birth time

All four representative Signals remain consumable because they are already
`UNKNOWN_TIME_SAFE`. The synthesis result is marked `UNKNOWN` birth-time
authority, retains no angle/house facts, and creates no ASC, MC, house-derived,
noon, midnight, or fabricated-time content. The four-input result contains four
themes; `maxThemes: 2` produces two deterministic candidates, proving that five
is a ceiling rather than a minimum.

## 5. Convergence, redundancy, and content bounds

The adapter suppresses duplicate placement evidence before synthesis. Distinct
placement keys remain distinct unless the existing synthesis grouping receives
an explicitly shared semantic theme key; shared sign, body, or domain is not
used as a merge key. The current four inputs therefore do not converge.

The existing Personal Synthesis selector remains the owner of selection and
redundancy behavior. No one Signal is split into strength, relationship, work,
or other separate themes. A surviving Signal has one source trace and at most
one primary PersonalTheme candidate.

## 6. Validation gates

| Gate | Result |
| --- | --- |
| `SIGNAL_INPUT_COMPATIBILITY` | `PASS` |
| `SEMANTIC_PRESERVATION` | `PASS` |
| `PROVENANCE_PRESERVATION` | `PASS` |
| `NO_SIGNAL_INFLATION` | `PASS` |
| `NO_FALSE_CONVERGENCE` | `PASS` |
| `DUPLICATE_SUPPRESSION` | `PASS` |
| `UNKNOWN_TIME_AUTHORITY` | `PASS` |
| `NO_FAKE_ENGINE_AUTHORITY` | `PASS` |
| `DETERMINISTIC_SYNTHESIS` | `PASS` |
| `PERSONAL_THEME_COMPATIBILITY` | `PASS` |

## 7. Targeted validation

```text
npm run test:composition-signal-synthesis-poc
9 tests passed, 0 failed

npm run test:personal-synthesis-poc --workspace=apps/web
9 tests passed, 0 failed

npm run check --workspace=apps/web
0 errors
```

Astro check reported one pre-existing repository hint for an unused
`parseFoundationsAssessment` import in `test/learn-foundations.test.mjs`; it is
outside this change. No broad build, browser test, production runtime, or
authority integration was run.

## 8. Readiness

```text
READY_FOR_MY_CHART_SIGNAL_POC: YES
READY_FOR_PRODUCTION_SIGNAL_RUNTIME: NO
READY_FOR_BROAD_SCALE: NO
RUNTIME_ADMISSION: NO
```

This POC is ready for a separately scoped My Chart Signal POC review because
the downstream bridge is bounded and deterministic. Production Signal
emission and production Personal Synthesis remain explicitly unadmitted.

## 9. Source authority

The adapter reuses the existing Personal Synthesis POC implementation,
Interpretation Signal contracts, ranking/grouping/composition boundaries, and
the four-rule Composition Signal artifact. It does not create a parallel
synthesis system or a second Signal taxonomy.
