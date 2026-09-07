# My Chart Personal Content POC 001 Review

| Field | Value |
| --- | --- |
| Task | `WEB-P2-MY-CHART-CONTENT-001` |
| Baseline | `a5667cce3da8dd6b17736234efe9f19d3be83bc5` |
| Route | `/dev/my-chart-contextual-learn/` |
| Authority | `DEVELOPMENT_ONLY` |
| Production runtime admission | `NO` |
| Browser review state | Engineering-ready; Product Owner review required |

This review covers the bounded dev-only integration from the accepted
deterministic Personal Synthesis POC into the existing My Chart contextual
Learn route. It evaluates content value, not production astrology authority.

## 1. Scope and architecture boundary

The route remains the existing development-only surface:

```text
/dev/my-chart-contextual-learn/
    -> CASE_B_MEANINGFUL_TENSION or CASE_D_UNKNOWN_BIRTH_TIME
    -> synthesizePersonalThemes(...)
    -> My Chart personal editorial projection
    -> reader-first theme cards
```

The new presentation adapter is:

```text
apps/web/src/features/my-chart/my-chart-personal-content-poc.ts
```

It reuses the existing Personal Synthesis fixture registry, deterministic
selection, editorial fields, provenance, and Foundation lesson registry. It
does not calculate astronomy, call an Engine or provider, access the BFF,
persist data, call an LLM, or change production My Chart/Vault semantics.

The component continues to render through the existing:

```text
apps/web/src/pages/dev/my-chart-contextual-learn.astro
```

The route remains noindex and unavailable in production builds unless the
existing explicit local preview switch is present. The page is a development
reading POC, not a production correctness authority.

## 2. Content composition decision

The page uses progressive disclosure in this order:

```text
READING
  -> CORE PERSONAL THEMES
      -> WHY THIS SHOWS UP
          -> LEARN NEXT
              -> ASTROLOGER / TECHNICAL DEPTH
```

The initial reading shows the selected themes and their:

- Recognition;
- Strength;
- Pattern;
- Tension; and
- Lever.

WHY, evidence labels, convergence, birth-time boundaries, and contextual
Foundation lessons are available inside each theme disclosure. Raw fact paths,
semantic basis IDs, and composition rule references are kept in the nested
technical depth view rather than the primary reading.

The UI does not show ranking numbers, normalized scores, confidence math,
percentages, primitive fact lists, invented degrees, houses, angles, aspects,
transits, or pseudo-data.

## 3. Fixture evidence

### A. Known-time personal chart

Fixture: `CASE_B_MEANINGFUL_TENSION`

The fixture is explicitly `DEVELOPMENT_FIXTURE` and `KNOWN` birth-time
authority. Its supplied evidence includes:

| Supplied evidence | Role in the reading |
| --- | --- |
| Aries sign layer | Initiation / first useful move |
| Fixed modality layer | Continuation / pacing trade-off |
| Moon placement | Relationship response and emotional rhythm |

The two action factors converge into one `ACTION_DECISION` theme with a mixed
direction. The Moon evidence supports two different bounded life questions:
relationship boundaries and emotional pacing. They are rendered as distinct
editorial themes, not as a list of primitive placements.

### B. Unknown-time personal chart

Fixture: `CASE_D_UNKNOWN_BIRTH_TIME`

The fixture is explicitly `DEVELOPMENT_FIXTURE` and `UNKNOWN` birth-time
authority. Mercury and Moon placement-level factors remain available for the
bounded reading. Candidates requiring time-dependent authority are skipped by
the existing signal prerequisite path.

The page uses concise disclosure:

> Some time-sensitive chart layers are unavailable. The reading below uses
> only the remaining available placement-level factors in this development
> fixture.

No ASC, MC, house, or house-derived theme is emitted into the core personal
content. Noon or midnight substitution is not used.

## 4. Selected personal themes

### Known-time result

| Theme | Domain | Direction | Evidence | Personal reading value |
| --- | --- | --- | --- | --- |
| Initiation and pacing | Action and decisions | Meaningful tension | Aries + Fixed modality | Holds momentum and continuation together, then offers a reversible-step lever. |
| Connection with clear boundaries | Relationships | Supportive pattern | Moon placement | Frames closeness and boundaries as a question without predicting another person. |
| A responsive emotional rhythm | Emotional patterns | Supportive pattern | Moon placement | Frames response and pacing without diagnosis or a complete personality claim. |

The first theme proves constructive asymmetry: it contains a constructive
capacity, an honest trade-off, and a useful lever. The other themes retain the
same bounded shape rather than becoming praise or doom.

### Unknown-time result

| Theme | Domain | Direction | Evidence | Personal reading value |
| --- | --- | --- | --- | --- |
| Clear exchange, with room for response | Communication | Supportive pattern | Mercury placement | Names a bounded communication question and a pause-before-overexplaining lever. |
| A responsive emotional rhythm | Emotional patterns | Supportive pattern | Moon placement | Retains useful response and pacing content without time-dependent chart layers. |

The unknown-time result remains useful but smaller. It does not invent a house,
angle, or time-dependent personal claim to make the page feel complete.

## 5. WHY traceability

Every rendered theme has a readable WHY layer containing:

```text
personal theme
  -> supplied evidence labels
  -> how independent evidence converges, if it does
  -> what supportive/challenging directions remain visible
  -> birth-time boundary
  -> why this theme was retained rather than repeated alternatives
  -> contextual Foundation lesson
  -> optional source paths / semantic basis / composition references
```

The machine trace remains attached to the model through source fact references,
semantic basis IDs, composition rule references, and the original deterministic
Personal Synthesis result. The primary UI translates that trace into ordinary
language and keeps implementation identifiers behind progressive disclosure.

## 6. Learn bridge

Learn follows personal relevance rather than leading the page. The adapter maps
the existing Personal Synthesis references to admitted Foundation lessons:

| Semantic reference | Foundation destination |
| --- | --- |
| `body.moon` | The Sun and Moon |
| `body.mercury` | Mercury, Venus, and Mars |
| `sign.aries` | The Zodiac: Elements and Modes |
| `modality.fixed` | The Zodiac: Elements and Modes |

Each selected theme exposes the lesson title and existing route only when the
Foundation registry reports the content as available. No My Chart-only lesson
set was created.

## 7. Old versus new experience

### Old / naive experience

```text
one supplied placement
    -> generic meaning paragraph
        -> one lesson link
```

This is fact/primitive-centered. It makes the reader do the synthesis and does
not show why multiple supplied factors belong together.

### New POC

```text
selected personal themes
    -> recognition / strength / pattern
    -> tension / lever
    -> WHY evidence and selection trace
    -> contextual Foundation learning
```

The page now gives the reader a coherent bounded reading before asking them to
study planets, signs, or modes. It visibly demonstrates convergence in the
known-time fixture and graceful authority reduction in the unknown-time
fixture.

## 8. Targeted acceptance results

| Gate | Result | Evidence |
| --- | --- | --- |
| `PERSONAL_CONTENT_DENSITY` | **PASS** | Three known-time themes and two unknown-time themes carry R/S/P/T/L structure; no primitive card loop. |
| `PERSONAL_RELEVANCE` | **PASS** | Reader-facing content is selected from PersonalTheme editorial output before Learn content. |
| `THEME_SYNTHESIS` | **PASS** | Existing deterministic themes are projected without a second synthesis engine. |
| `WHY_TRACEABILITY` | **PASS** | Every theme carries evidence, convergence/tension, birth-time, selection, and technical trace. |
| `LEARN_BRIDGE` | **PASS** | Learn references resolve through the existing Foundation registry and follow the reading. |
| `UNKNOWN_TIME_AUTHORITY` | **PASS** | Unknown-time output contains no ASC/MC/house-derived personal theme and uses no noon/midnight substitution. |
| `NO_FACT_DUMP` | **PASS** | Primary content is theme-based; raw references are progressive technical detail. |
| `DEV_ONLY_ISOLATION` | **PASS** | Existing noindex dev route only; no production route, BFF, Engine, provider, or Auth/Vault changes. |
| `READY_FOR_OWNER_BROWSER_REVIEW` | **YES** | Engineering preview is available at the route listed below; Product Owner acceptance remains open. |
| Production runtime admission | **NO** | This POC remains explicitly development-only. |

## 9. Validation performed

Targeted command:

```text
npm run test:my-chart-contextual-learn --workspace=@natalnode/web
```

Result:

```text
8 tests passed
0 tests failed
```

The test covers:

- final model uses deterministic selected themes;
- maximum five core themes;
- no primitive/fact dump;
- known-time convergence and mixed tension;
- unknown-time usefulness and zero ASC/MC/house leakage from core content;
- WHY evidence for every theme;
- contextual Learn references;
- no internal scores or fake percentages in reader content;
- stable repeated output;
- no LLM or transport dependency;
- dev-only route isolation; and
- accessible progressive disclosure / mobile-safe visual behavior.

Additional targeted validation:

```text
npm run test:personal-synthesis-poc --workspace=@natalnode/web
9 tests passed

npm run check --workspace=@natalnode/web
0 errors, 0 warnings, 1 pre-existing hint

npm run build:local
successful local-integration build; dev route emitted
```

The local integration build was then exercised through the running local
server at both URLs below. No production build or unrelated broad suite was
run because the change is confined to the development POC route, its adapter,
and its focused regression coverage.

## 10. Browser review boundary

Engineering preview route:

```text
http://localhost:4321/dev/my-chart-contextual-learn/
```

Known-time reading:

```text
http://localhost:4321/dev/my-chart-contextual-learn/?scenario=known-time
```

Unknown-time reading:

```text
http://localhost:4321/dev/my-chart-contextual-learn/?scenario=unknown-time
```

`READY_FOR_OWNER_BROWSER_REVIEW` means the engineering route and targeted
checks are ready. It does not claim `OWNER_BROWSER_PASS` or Product Owner
acceptance.

## 11. Remaining gaps

- The source remains a synthetic Personal Synthesis fixture, not an
  authoritative production ChartFacts result.
- Production per-fact identity, astronomy configuration, provenance, and
  unknown-time authority propagation remain separate gates.
- Theme titles and bounded editorial templates remain POC content and require
  Product Owner review before any product admission.
- No My Chart production route, Vault integration, BFF contract, Engine change,
  provider change, Auth change, or persistence change was attempted.
- Browser review is still required for content density, mobile rhythm, and
  human perceived relevance.
