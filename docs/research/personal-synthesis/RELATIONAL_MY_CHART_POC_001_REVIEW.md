# RELATIONAL MY CHART POC 001 REVIEW

Status: `RESEARCH_READER_POC_PASS`

Baseline: `524028cfc5344836f9adc473c6b40b41997b02fc`

This document records the bounded, development-only reader projection for
relationally enriched My Chart content. It does not admit the result to the
production My Chart route, the production Signal runtime, or the astronomy
Engine.

## Route and scope

The isolated route is:

`/dev/my-chart-relational/`

It reuses the accepted My Chart contextual-learn visual rhythm and CSS, while
keeping the accepted `/dev/my-chart-contextual-learn/` route unchanged. The
new route is selected only in the development/local-integration path and is
marked `DEVELOPMENT ONLY / RESEARCH PREVIEW`.

The route consumes the accepted shared-root synthesis result. It does not
create ChartFacts, calculate positions or degrees, infer an orb, call the
production Engine, or fetch a provider result.

## Scenario matrix

| Scenario | Input | Reader output | Accounting | Time boundary |
| --- | --- | --- | --- | --- |
| A: `relational-known-time` | Moon in Aries + Mercury in Aries + Moon conjunct Mercury | One relationally enriched PersonalTheme; the two placement themes are subsumed | 3 semantic units, 2 unique astronomical roots | Known-time research scope only; no astronomy calculation |
| B: `placement-only` | Moon in Aries + Mercury in Aries | Two fair placement themes; no relational card | 2 semantic units, 2 unique roots | Known-time research scope only |
| C: `unknown-time` | Moon in Taurus + Mercury in Aries | Two useful placement themes; no Aspect enrichment | 2 semantic units, 2 unique roots | No ASC, MC, houses, fabricated time, or Aspect relation |

Scenario A is deliberately coherent: each body has one placement. Scenario C
is also coherent and demonstrates that unknown time reduces the admitted layer
without making the placement reading useless.

## Reader comparison

The comparison is intentionally bounded rather than a claim that one reading
is universally better.

| Dimension | Placement-only (B) | Relationally enriched (A) |
| --- | --- | --- |
| Specificity | Keeps Moon and Mercury as two separate, recognizable themes | Names the interaction: response and naming can arrive close together |
| Explanatory depth | Explains each placement on its own | Adds why the two functions may be experienced as one quick sequence |
| Personal relevance | Offers two possible recognition points | Offers one integrated recognition point without claiming a defining trait |
| Astrology recognition | Shows Moon/Aries and Mercury/Aries placement language | Preserves both placements and explicitly explains Moon conjunct Mercury |
| Actionability | Each card has its own useful lever | The lever adds one more pass before making the first explanation final |
| Content density | Two cards, two placement threads | One card with a denser interaction account; no third card |
| Epistemic restraint | `NEUTRAL`, `SUBTLE`, `LOW` | The same `NEUTRAL`, `SUBTLE`, `LOW`; the Aspect adds explanation, not confidence |

The relational projection is more specific about interaction and explanatory
depth than the placement-only comparison. It is not treated as more certain,
more important, or more predictive.

## Reader experience boundary

Each theme follows the accepted reader rhythm:

`YOUR CHART` → recognition → constructive capacity → pattern → tension →
useful lever → collapsed `WHY` → Learn bridge → collapsed `ASTROLOGER'S VIEW`.

The primary copy is human and conditional. It does not expose semantic-unit
accounting, root keys, compatibility identifiers, research authority labels,
or engineering adapter terminology. The collapsed technical view preserves
those details for inspection, including:

- all three source semantic-unit IDs;
- both unique astronomical roots;
- both placement Signal IDs and the Aspect Signal ID;
- the compatibility rule and subsumed placement theme IDs;
- `NEUTRAL` direction, `SUBTLE` intensity, and `LOW` confidence;
- research/development authority and birth-time boundaries;
- the absence of a numeric orb in this POC.

The relational `WHY` explicitly names and explains:

- Moon in Aries: response, receptivity, and need under initiation and immediacy;
- Mercury in Aries: naming, interpretation, and exchange under a first move;
- Moon conjunct Mercury: close coupling and concentration between those functions;
- their interaction: experience can become words quickly, so the first explanation
  can benefit from one more pass before it becomes final.

Learn destinations are resolved through the existing Foundations registry and
deduplicated by lesson destination. The relational case bridges Moon, Mercury,
Aries, and conjunction/aspects without inventing new content destinations.

## Validation gates

The following targeted gates pass:

- `RELATIONAL_THEME_RENDERING PASS`
- `SHARED_ROOT_ACCOUNTING PASS`
- `SUBSUMPTION_RENDERING PASS`
- `PERSONAL_RELEVANCE PASS`
- `EXPLANATORY_DEPTH PASS`
- `SEMANTIC_FIDELITY PASS`
- `NO_CONTENT_INFLATION PASS`
- `NO_EVIDENCE_PROMOTION PASS`
- `WHY_ASTROLOGY_DEPTH PASS`
- `USEFUL_LEVER PASS`
- `LEARN_BRIDGE PASS`
- `UNKNOWN_TIME_AUTHORITY PASS`
- `RESEARCH_LANGUAGE_ISOLATION PASS`
- `TECHNICAL_TRACE_NON_DOMINANCE PASS`
- `DEV_ONLY_ISOLATION PASS`

Validation level: `MODULE_PASS` plus `BUILT_RUNTIME_PASS` for the local
development build. Owner browser review remains a separate gate.

## Readiness

`READY_FOR_OWNER_BROWSER_REVIEW YES`

`READY_FOR_PRODUCTION_MY_CHART NO`

`READY_FOR_SHARED_ROOT_PRODUCTION_RUNTIME NO`

`READY_FOR_BROAD_SCALE NO`

`RUNTIME_ADMISSION NO`

The route is suitable for owner comparison at the supplied local URLs only.
It is not a production admission decision.
