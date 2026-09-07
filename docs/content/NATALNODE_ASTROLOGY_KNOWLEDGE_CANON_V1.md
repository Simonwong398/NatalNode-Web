# NatalNode Astrology Knowledge + Interpretation Canon V1

**Status:** SUN_TAURUS_POLICY_ADMITTED
**Source status:** SOURCE_RESEARCH_COMPLETE_FOR_BOUNDED_V1_POLICY
**NatalNode policy status:** BOUNDED_PLURAL_LENS_APPROVED
**Core primitive expansion status:** PRIMITIVE_RESEARCH_COMPLETE_WITH_POLICY_GAPS
**Core primitive policy status:** CORE_PRIMITIVE_POLICY_ADMITTED
**Scope:** documentation-only knowledge architecture and content governance
**Canonical source locale:** English (en)
**Runtime / production eligibility:** PRODUCTION_PERSONAL_INTERPRETATION_NOT_ADMITTED
**Runtime admission:** none in this task
**Provider policy:** PROVIDER DECISION DEFERRED

This document defines the first reviewable boundary for NatalNode astrology
knowledge and interpretation content. It is a policy and schema freeze, not a
claim that the repository contains exhaustive scholarship across Western
astrology literature. The accompanying Sun, Taurus, and Sun × Taurus material
is a bounded V1 policy-admitted package. It is not production runtime content
and is not a scientific claim.

## 1. Executive thesis

NatalNode needs a knowledge layer that can explain where a statement comes
from, which kind of statement it is, which tradition it uses, how strongly it
is admitted, and what limits remain visible. The knowledge layer must sit
between calculated chart facts and editorial presentation:

    calculated chart fact
        -> knowledge object and composition policy
        -> bounded interpretation content
        -> audience/depth/localization projection

The knowledge layer must not calculate a chart, select an astronomy provider,
replace the Engine, or turn an interpretation convention into a measured
personality fact. V1 freezes the semantic and review boundaries first. It does
not authorize a full content matrix or a new interpretation runtime.

## 2. Scientific boundary

NatalNode keeps the existing trust boundary:

    Calculated with astronomy. Interpreted through astrology.

The following lanes remain distinct:

| Lane | What it may contain | What it must not imply |
| --- | --- | --- |
| Astronomy / calculation | Positions, geometry, time, timezone, and other returned chart facts | That an astrological meaning has scientific validation |
| Astrology convention | A named symbolic vocabulary or interpretive method | An empirical personality category or guaranteed outcome |
| Interpretation tradition | A school-specific way of discussing possible meaning | A universal doctrine when schools differ |
| NatalNode policy | Product labels, eligibility, limitations, disclosure, and suppression rules | A replacement for astronomy or a hidden school choice |
| Editorial wording | Human-readable explanation derived from admitted inputs | New chart facts or unsupported certainty |
| Scientific claim | Only a claim supported by appropriate scientific sources and within product scope | Astrology interpretations presented as scientific findings |

Any object or composition that crosses from a chart fact into meaning must carry
its lane, epistemic status, source state, and policy state. Localization,
summarization, or AI generation may not strengthen that status.

## 3. Source policy

Every admitted knowledge claim must identify a source class and a review state.
The source record is about traceability, not permission to copy source wording.

| Source class | Meaning | V1 use |
| --- | --- | --- |
| PRIMARY_OR_HISTORICAL_SOURCE | A primary text, historical document, or source close to a named tradition | Use only with historical context and careful attribution |
| ESTABLISHED_REFERENCE | A reputable education/reference text with identifiable authorship and edition or stable publication identity | Suitable for shared beginner vocabulary after review |
| MODERN_SCHOOL | A named modern school, teacher, or method with a stated scope | Must remain tagged to that school or method |
| INTERNAL_POLICY | A NatalNode product or trust decision | Cannot be represented as astrology doctrine |
| EDITORIAL_SYNTHESIS | NatalNode wording that combines already admitted inputs | Must retain input references and may not create a new fact |
| SOURCE_RESEARCH_REQUIRED | A candidate claim whose source basis, school scope, or wording has not been reviewed | Not publishable as canon or production content |

The minimum provenance record for a future admitted claim is: stable claim ID,
source class, title, author or organization where available, edition or
publication date where available, locator, consulted date, tradition or school,
claim scope, reviewer, and content revision. Do not invent a citation to fill a
missing field. A repository file containing a source list is evidence of an
existing editorial reference, not automatic admission of every possible claim
from that source.

## 4. School/tradition policy

Tradition is a first-class field, not an implicit author assumption. A content
record must use one or more explicit tradition labels such as:

- SHARED_BEGINNER_VOCABULARY
- TRADITIONAL_CLASSICAL
- HELLENISTIC_OR_MEDIEVAL
- MODERN_PSYCHOLOGICAL
- HUMANISTIC_OR_ARCHETYPAL
- OTHER_NAMED_SCHOOL

The labels are organizational identifiers, not claims that the schools are
equivalent. When a claim differs by school, the record must preserve the
variants and explain the difference. A broad shared statement may be admitted
only when its scope is genuinely shared and its wording remains qualified.

Each school-specific contribution uses one of these policy states:

| Policy state | Meaning |
| --- | --- |
| ADOPTED | Admitted for the named NatalNode content scope |
| ADOPTED_WITH_CONDITIONS | Admitted only with explicit conditions, inputs, or limitation text |
| SUPPORTED_AS_ALTERNATIVE | Presented as a named alternative, not merged into the default |
| EDUCATIONAL_ONLY | May teach vocabulary or comparison, but is not used for personal interpretation |
| NOT_USED_FOR_PERSONAL_INTERPRETATION | Retained for reference/history only |
| UNRESOLVED | Review has not selected or admitted a policy |

V1 does not claim a single universal doctrine for Sun, Taurus, or their
combination. For this bounded package, modern/psychological Western natal
astrology is the default personal interpretation lens as a NatalNode product
policy, not as a claim that it is the only legitimate tradition or that it is
scientifically validated. Traditional/classical material remains available
for historical context, education, astrologer view, and technical/school
comparison; early-modern material remains named historical interpretive
evidence.

## 5. NatalNode doctrine policy

NatalNode policy is the product-owned layer. It governs safe presentation and
eligibility, not what astrology as a whole must mean.

V1 doctrine rules:

1. A calculated fact is never rewritten as an interpretation.
2. An interpretation is never presented as a scientific result.
3. A personality statement must be bounded, conditional, and open to context.
4. A placement is not a complete personality, diagnosis, prediction, or moral
   judgment.
5. House, angle, aspect, degree, rulership, motion, and birth-time authority
   must be disclosed when they materially change the reading.
6. Unknown or unsupported inputs remain unknown; the content layer does not
   guess them.
7. A fixture, example, or educational chart does not become a user's fact.
8. A locale changes presentation, not semantic authority or provenance.
9. Content may be withheld when source, policy, or required chart evidence is
   missing.
10. PROVIDER DECISION DEFERRED remains in force.

## 6. Knowledge object taxonomy

V1 recognizes these knowledge object classes:

| Class | Stable identity shape | Primary question |
| --- | --- | --- |
| Planet / Body | body.<name> | What function or subject is represented? |
| Sign | sign.<name> | Which sign vocabulary is used? |
| Element | sign_element.<name> | Which conventional element grouping is referenced? |
| Modality | sign_modality.<name> | Which conventional change/continuity grouping is referenced? |
| House | house.<number> | Where is the symbolism considered? |
| Angle | angle.<name> | Which time-and-place-sensitive chart reference is involved? |
| Aspect | aspect.<type> | Which geometric relationship is considered? |
| Rulership | rulership.<subject>.<ruler> | Which named tradition assigns a ruler, and under what rules? |
| Orb / phase | aspect_measurement.* | What technical qualification applies to an aspect? |
| Motion / retrograde | motion.<state> | What returned motion state is being discussed? |
| Birth-time authority | birth_time_authority.<state> | Which time-dependent layers are eligible? |

An object identity is not a meaning by itself. Meaning records reference
objects and retain the distinction between source fact, convention,
interpretive tradition, policy, and editorial expression.

## 7. Planet schema

A Planet / Body record must contain:

| Field | Requirement |
| --- | --- |
| objectId | Stable identity such as body.sun |
| canonicalTerm | Canonical English term and glossary linkage |
| category | Luminary, personal, social, outer, or another explicitly defined category |
| astronomicalIdentity | Only when supported by the calculation/astronomy boundary |
| glyphOrNotation | Optional presentation notation from the glossary |
| symbolicFunctions | Separate tradition-tagged function records |
| sourceRefs | Provenance for every admitted symbolic claim |
| policyState | One of the frozen school policy states |
| limitations | Misconceptions, non-determinism, and missing-context rules |
| contentRevision | Version of the reviewed content record |

The schema must not encode a planet as a fixed personality trait. A planet
function is an interpretive prompt, not a measurement of a person.

## 8. Sign schema

A Sign record must contain:

| Field | Requirement |
| --- | --- |
| objectId | Stable identity such as sign.taurus |
| canonicalTerm | Canonical English term and glossary linkage |
| zodiacModel | Tropical, sidereal, or another explicitly selected model |
| glyphOrNotation | Optional glossary notation |
| elementRef | Nullable until the grouping is admitted for the scope |
| modalityRef | Nullable until the grouping is admitted for the scope |
| polarityRef | Optional and school-scoped; not a moral ranking |
| rulershipRefs | One or more school-scoped records, never an implicit universal |
| operatingLanguage | Qualified conventional wording |
| sourceRefs / policyState | Required for every symbolic association |
| limitations | Context and anti-stereotype guardrails |

The sign schema describes a layer of an astrological framework. It does not
turn the sign sector into a physical constellation or an empirical type.

## 9. Element schema

An Element record must contain:

- stable ID and canonical term;
- member sign references;
- the question or dimension the element is intended to organize;
- named tradition or school;
- conventional associations, each with provenance;
- EDUCATIONAL_ONLY, ADOPTED_WITH_CONDITIONS, or another explicit policy
  state;
- non-determinism and counterexample guidance;
- localization identity independent of translated wording.

The element is a grouping and interpretive lens. It is not a chemical,
biological, psychological, or scientific property of a person.

## 10. Modality schema

A Modality record must contain:

- stable ID and canonical term;
- member sign references;
- the change, continuity, or transition dimension it organizes;
- named tradition or school;
- conventional associations and source references;
- policy state and audience eligibility;
- stereotype defenses and context requirements.

Fixed, for example, may be taught as a conventional organizing vocabulary
only after the source state and scope are visible. It must not be rendered as a
guaranteed trait such as stubbornness or resistance to change.

## 11. House schema

A House record must contain:

- stable house identity and ordinal position;
- canonical domain label and source state;
- house-system dependency;
- whether the claim requires known or sufficiently authoritative birth time;
- allowed domain wording and prohibited deterministic wording;
- tradition or school scope;
- source refs, policy state, limitations, and content revision.

House meaning is time- and method-sensitive. The knowledge layer cannot
manufacture a house, a cusp, or a house-based interpretation when the chart
does not provide the required authority.

## 12. Angle schema

An Angle record must contain:

- stable identity for ASC, DSC, MC, or IC where admitted;
- local-horizon or meridian relationship as a calculation fact only when
  returned by the Engine contract;
- birth-time and location authority requirement;
- sign and house relationships as separate references;
- school-scoped symbolic language;
- limitation and unknown-time behavior;
- provenance, policy state, and revision.

Angles are not extra planets and are not available merely because a user
entered a date. Unknown or unreliable birth time must suppress or qualify
angle-based personal interpretation.

## 13. Aspect schema

An Aspect record must contain:

- participating body IDs;
- aspect type and geometric definition;
- exactness and orb representation when available;
- applying, exact, separating, or other phase state where available;
- calculation provenance separate from interpretive meaning;
- tradition or school rule;
- policy state, source refs, expression, counterevidence, and limitations.

An aspect describes a relationship in chart geometry. It does not carry a
universal emotional or behavioral outcome. The two participating bodies and
their other chart context remain visible.

## 14. Technical concept schema

The following concepts are separate schema objects and must not be collapsed
into prose:

| Concept | Required distinction |
| --- | --- |
| Rulership | A tradition-specific assignment; preserve domicile, traditional/modern variants, and unresolved choices |
| Orb | A measurement or tolerance rule with method, units, and source; not an intensity guarantee |
| Applying / separating / phase | A technical state with calculation or method provenance; do not infer when unavailable |
| Motion / retrograde | Returned motion state and its scope; never use it as a deterministic personality label |
| Birth-time authority | Input quality and eligibility state controlling time-dependent facts |

Each technical record carries calculated, derived, interpreted, or unknown
status where applicable. Technical vocabulary does not become interpretation
simply by appearing in a user-facing card.

## 15. Composition architecture

Compositions are ordered, typed links between admitted objects. A composition
record must state its inputs, rationale, method, school scope, source refs,
policy state, modifiers, limitations, and projections. It must never be a
keyword concatenation.

Composition evaluation stops when required evidence is missing. A composition
may be educationally available while remaining ineligible for a personal
interpretation. The default order is:

    fact -> object meanings -> composition rule -> modifiers
         -> counterevidence -> bounded wording -> audience projection

## 16. Planet x Sign

Planet × Sign is the first composition family. Its minimum record is:

- planetRef;
- signRef;
- the planet question;
- the sign-style question;
- the stated method or tradition;
- the rationale for combining the layers;
- constructive possibilities and tensions, each qualified;
- modifier dependencies;
- limitations and source refs;
- projections for ordinary, learner, and professional audiences;
- quality result and publication state.

The composition must say that the planet and sign answer different questions.
It must not imply that one placement explains a whole person. House, aspects,
degree, rulership, chart emphasis, and personal context may support or
complicate the composition.

## 17. Planet x House

Planet × House requires:

- an authoritative body fact;
- an authoritative house and house system;
- known or eligible birth-time authority;
- a house-domain record;
- a stated method and source state;
- context and counterevidence rules;
- an explicit fallback to educational-only content when the house is not
  available.

No Planet × House personal interpretation is admitted from a guessed time,
unknown time, or a house value supplied only by a fixture.

## 18. Planet x Planet Aspect

Planet × Planet through Aspect requires:

- two body facts;
- a returned aspect type;
- orb and phase when relevant to the chosen method;
- a named tradition or policy;
- the distinct function of each body;
- the relationship quality introduced by the aspect;
- other chart modifiers and counterevidence;
- limitations against prediction or personality certainty.

The composition describes an interaction to explore. It does not resolve the
interaction into a guaranteed outcome or erase either participating body.

## 19. Modifier model

Modifiers are explicit records, not hidden prose exceptions. V1 recognizes:

- house and house system;
- angle and birth-time authority;
- aspect type, orb, and phase;
- dignity or rulership when the relevant tradition is admitted;
- motion state;
- degree or decan only when separately admitted;
- chart prominence and counterevidence;
- user context when intentionally supplied and privacy-safe.

Each modifier carries required, optional, or not_admitted status. A missing
required modifier lowers eligibility or blocks the interpretation; it does not
trigger a guess. A modifier must not be used to intensify language without a
source-backed reason.

## 20. Counterevidence and limitations

Every personal-facing composition includes a limitations block. It must
address, as relevant:

- other chart factors that may reinforce, redirect, or complicate the signal;
- school and method differences;
- unknown or uncertain birth-time effects;
- missing houses, angles, aspects, or rulership data;
- the difference between symbolic reflection and prediction;
- the fact that lived context and agency remain outside the chart record.

Counterevidence is not a disclaimer appended after an overconfident claim. It
is part of the reasoning and must be visible at the same depth as the
interpretation.

## 21. Barnum-defense rules

NatalNode content must resist statements that feel personally flattering or
universally applicable without evidence. Authoring review must:

1. avoid absolute second-person claims;
2. avoid claims that every reader can recognize as true;
3. name the chart input and symbolic layer being discussed;
4. use may, can, or question language where certainty is not supported;
5. include a possible tension or counter-pattern;
6. avoid moral valuation of signs, elements, modalities, or aspects;
7. invite observation rather than demand identification;
8. avoid future certainty, diagnosis, and relationship guarantees;
9. state what additional evidence could change the reading;
10. stop when the source or chart evidence runs out.

These rules protect against persuasive wording being mistaken for stronger
knowledge.

## 22. Content quality gate

Every knowledge-backed composition receives one gate result:

| Result | Meaning |
| --- | --- |
| PASS | Source, policy, inputs, limitations, wording, and projections satisfy all required checks |
| REVISE | The concept is promising but has a correctable source, scope, language, or evidence gap |
| REJECT | The claim is unsupported, misleading, out of scope, or cannot be made safe |

The reviewer checks:

1. object identities are stable;
2. chart facts are separated from meaning;
3. source class and locator exist;
4. school/tradition is named;
5. NatalNode policy is explicit;
6. required modifiers are available;
7. counterevidence is present;
8. wording passes Barnum and determinism defenses;
9. depth projections preserve semantics;
10. localization and provenance metadata are complete.

No PASS is allowed when a required source is marked
SOURCE_RESEARCH_REQUIRED.

## 23. Content-value density

Content value is measured by the number of useful, non-duplicative questions or
decisions a supported input enables, not by prose length. A dense record:

- identifies the fact or object;
- explains why the layer exists;
- gives a bounded interpretation question;
- shows one constructive possibility and one tension;
- identifies a modifier or missing condition;
- points to a relevant learning concept;
- stops before repeating generic personality language.

Thin content is not repaired by adding adjectives. If a record cannot add
distinct value without stronger source support, it remains TOO_SHALLOW or
SOURCE_RESEARCH_REQUIRED.

## 24. Why-explanation model

An explanation must answer four questions in order:

1. What is the chart fact or knowledge object?
2. What conventional role does the object have in the named method?
3. Why does the composition connect these particular layers?
4. What could limit, redirect, or contradict the reading?

The “why” is a traceable bridge between inputs and wording. It is not a
post-hoc rationale for a sentence generated from a stereotype.

## 25. Depth projections

One semantic content record may project to these audience depths:

| Depth | Required shape |
| --- | --- |
| QUICK | Label, one bounded sentence, one limitation cue |
| PLAIN | Fact, conventional meaning, constructive/tension pair, limitation |
| LEARNER | Layer-by-layer explanation, why, glossary links, practice question |
| ASTROLOGER | Tradition, technical modifiers, source state, alternative schools, unresolved issues |
| TECHNICAL | Stable IDs, calculation inputs, method, provenance, revision, eligibility, and exact limitations |

Depth changes explanation density, not epistemic status. A shorter projection
must not sound more certain than the professional record.

## 26. Voice policy

The voice is clear, calm, specific, and non-deterministic. It should use
ordinary language before specialist terminology, then define the term. It may
be warm without being flattering, and professional without pretending to
certainty.

Avoid: “you are,” “you will,” “destined,” “always,” “never,” diagnostic labels,
fear appeals, moral ranking, and universal claims. Prefer: “this placement can
be explored as,” “one traditional reading emphasizes,” “the chart shows,”
“this depends on,” and “another factor may modify this.”

## 27. Personality-claim policy

Personality claims are not a default output class. A personal-facing record
must first establish:

- the actual chart fact;
- the admitted interpretive method;
- relevant modifiers;
- the limits of the claim;
- a wording level proportionate to the evidence.

The preferred form is a reflective possibility or question. Stable identity,
diagnosis, moral character, relationship certainty, and life-outcome claims
are not admitted from a single planet, sign, or composition.

## 28. Practical manifestation/domain policy

Practical domains are optional projections, not automatic meanings. A domain
record must identify why the domain is eligible and must avoid narrowing a
placement into a job, relationship outcome, or health claim.

Allowed domain framing can include questions about habits, values,
communication, creative practice, collaboration, or decision-making when the
source, method, and chart context support them. Health, diagnosis, legal,
financial, and guaranteed predictive claims are outside this canon's default
personal interpretation scope.

## 29. Content provenance

Every content unit must preserve:

- content ID;
- semantic input IDs;
- source references and source class;
- school/tradition;
- policy state;
- epistemic status;
- author/reviewer roles;
- creation and review timestamps;
- canonical locale;
- content revision;
- localization linkage;
- limitation and suppression reasons.

Provenance must remain machine-readable even when the user sees only a short
projection. A translated sentence inherits provenance; it does not create new
provenance.

## 30. Versioning

Use separate versions for:

- knowledge schema;
- semantic object revision;
- source review revision;
- policy revision;
- editorial content revision;
- locale variant revision.

Changing wording alone must not silently change the object identity. Changing
source basis, school scope, policy state, or modifier semantics requires a
reviewable revision. Deprecated records remain traceable and are not silently
reused as current content.

## 31. Localization

The existing V1 locale set remains authoritative: en, es, fr, de, ja, ko, and
zh-Hant. This task does not add zh-Hans and does not translate the full canon.

Localization has three responsibilities:

1. preserve stable semantic IDs and epistemic status;
2. adapt editorial wording with reviewed terminology;
3. expose fallback or unavailable states without hiding them.

Glossary identity, professional content, and ordinary UI copy remain separate
resource planes. A localized interpretation may not strengthen a source,
policy, or certainty state.

## 32. Current-content audit

The audit classifies existing material by its safe role in this canon:

| Existing material | Classification | Canonical treatment |
| --- | --- | --- |
| apps/web/src/core/astrology-taxonomy/astrology-glossary.ts | REUSABLE_CANON_INPUT | Stable IDs, terms, glyphs, families, and notation; no automatic symbolic doctrine |
| apps/web/src/features/interpretation/interpretation-content.ts | REUSABLE_CANON_INPUT; EDITORIAL_ONLY; TOO_SHALLOW for a full knowledge record | Reuse bounded labels and expression patterns; keep current prose out of a source-complete canon until reviewed |
| apps/web/src/features/interpretation/interpretation-ui-content.ts | EDITORIAL_ONLY | Presentation templates; not a knowledge authority |
| apps/web/src/content/learn and docs/content/foundations/v1/en | REUSABLE_CANON_INPUT; NEEDS_POLICY_REVIEW for any promotion | Existing course structure, boundaries, and source lists are useful inputs; a new canon must not silently reapprove or rewrite them |
| apps/web/src/features/learn/foundations/registry.ts | REUSABLE_CANON_INPUT | Lesson identity, glossary links, and My Chart hooks; not a doctrinal source |
| apps/web/src/features/learn/educational-chart-source.ts | EDITORIAL_ONLY | Educational fixture boundary; never a source of personal chart facts |
| apps/web/src/features/my-chart/my-chart-evidence-projection.ts and Stage A UI | EDITORIAL_ONLY; NEEDS_POLICY_REVIEW for future admission | Explicit development/research disclosure and bounded existing language; unchanged by this task |
| Weekly POC documents and runtime | EDITORIAL_ONLY; TOO_SHALLOW for this canon | Useful for audience/style comparison only; no weekly prose is promoted into natal knowledge |
| Detailed Sun/Taurus doctrine, school comparison, and rulership material | POLICY_ADMITTED_BOUNDED; RUNTIME_NOT_ADMITTED | Package A is approved with conditions; no production personal-interpretation record is admitted by this task |

This audit is a classification, not a migration. No existing runtime content is
changed or promoted.

## 33. SUN exemplar

This exemplar is a bounded, policy-admitted package inside the canon document.
It freezes the shape of a future record without claiming exhaustive doctrine.
The source-backed research dossier is maintained at
docs/research/astrology-knowledge-canon/sun-taurus/ and remains outside
production runtime.

| Field | Exemplar value | State |
| --- | --- | --- |
| objectId | body.sun | REUSABLE_CANON_INPUT |
| canonical identity | Sun, glyph and glossary identity | REUSABLE_CANON_INPUT |
| current repository focus | Identity and vitality | REUSABLE_CANON_INPUT from interpretation-content.ts |
| current repository expression | Developing confidence through purposeful self-expression | EDITORIAL_ONLY; bounded input |
| traditional/common symbolic role | Historical solar function, authority, honour, and vitality language, with identity kept school-scoped | SOURCE_SUPPORTED_WITH_CONDITIONS; policy SUPPORTED_AS_ALTERNATIVE or EDUCATIONAL_ONLY |
| modern-school readings | Identity, agency, vitality, self-development, integration, or self-expression variants | SOURCE_SUPPORTED_WITH_CONDITIONS; policy ADOPTED_WITH_CONDITIONS for the default modern lens |
| constructive possibilities | Purposeful self-expression, sustained agency, or vitality as a reflective question | EDITORIAL_SYNTHESIS; ADOPTED_WITH_CONDITIONS; runtime not admitted |
| tensions | Overidentification, visibility pressure, or narrowed self-definition | SOURCE_RESEARCH_REQUIRED; not admitted by this bounded policy |
| misconceptions | One placement is not the whole personality, destiny, or scientific trait | NATALNODE_POLICY; admitted boundary |
| prerequisites | Chart body fact, chosen zodiac/model, method, and wider chart context | NATALNODE_POLICY |
| policy | Default personal lens is modern/psychological Western natal astrology; historical language remains educational or alternative | SUN_TAURUS_POLICY_ADMITTED |

The consulted sources, claim-level statuses, and policy limits are recorded in
the linked research package. No external citation is invented here. Source
research is complete for this bounded V1 policy decision. It does not
authorize production personal interpretation or claim exhaustive scholarship.

## 34. TAURUS exemplar

| Field | Exemplar value | State |
| --- | --- | --- |
| objectId | sign.taurus | REUSABLE_CANON_INPUT |
| canonical identity | Taurus, glyph, zodiac-sign glossary family | REUSABLE_CANON_INPUT |
| current repository style | Steady and sensory | REUSABLE_CANON_INPUT from interpretation-content.ts |
| current repository expression | Prioritizing patience, consistency, and tangible values | EDITORIAL_ONLY; bounded input |
| element relationship | Taurus is a modern Earth convention; the semantics must remain broader than practical or material | SOURCE_SUPPORTED_WITH_CONDITIONS; policy ADOPTED_WITH_CONDITIONS |
| modality relationship | Modern Fixed vocabulary can be bridged to historical Solid only with an explicit qualification | SOURCE_SUPPORTED_WITH_CONDITIONS; policy ADOPTED_WITH_CONDITIONS |
| rulership | Venus is supported as a named traditional and modern structural relation | SOURCE_SUPPORTED_WITH_CONDITIONS; policy ADOPTED_WITH_CONDITIONS |
| operating style | Continuity, embodiment, value, maintenance, and tangible-result language | SOURCE_SUPPORTED_WITH_CONDITIONS; policy ADOPTED_WITH_CONDITIONS |
| constructive possibilities | Patience, consistency, and tangible value as questions, not traits | EDITORIAL_SYNTHESIS; ADOPTED_WITH_CONDITIONS; runtime not admitted |
| tensions / stereotypes | Inertia, possessiveness, or stubbornness must not be asserted from the sign alone | SOURCE_RESEARCH_REQUIRED or CONTESTED; not a default personal fact |
| limitations | Other bodies, house, aspects, method, context, and agency can redirect the reading | NATALNODE_POLICY |
| prerequisites | Sign fact, zodiac model, source tradition, and context | NATALNODE_POLICY |
| policy | Earth/Fixed/Venus are approved bounded modern structural conventions; personal language remains conditional and non-deterministic | SUN_TAURUS_POLICY_ADMITTED |

The Foundations material is a useful educational input and already warns that
element and mode are not deterministic personality categories. The source
comparison and claim matrix for Taurus are recorded in the research package;
this canon still does not treat any derivative personality wording as a
completed production doctrine.

## 35. SUN x TAURUS exemplar

The exemplar is intentionally bounded:

| Field | Exemplar |
| --- | --- |
| compositionId | body.sun_x_sign.taurus |
| inputs | body.sun + sign.taurus |
| rationale | The planet supplies a question about function or subject; the sign supplies a conventional style vocabulary |
| current admitted language | Modern-lens Sun vitality, central/organizing function, self-development, self-expression, and identity-related language; Taurus Earth/Fixed/Venus structure |
| candidate synthesis | Approved conditional composition: Sun function expressed through Taurus structure |
| constructive projection | Explore continuity of self-expression, sustained development, tangible/embodied expression, preservation, consolidation, and steady follow-through |
| tension projection | Conditionally ask whether established conditions are difficult to revise; never convert this into an unconditional label |
| possible manifestations | Reflective questions about values, effort, embodiment, or self-expression only when context and method support them |
| modifier dependencies | House, aspects, degree, rulership, dignity, chart emphasis, birth-time authority, school, and lived context |
| limitations | A single placement does not describe a whole person, predict an outcome, or settle competing factors |
| ordinary projection | “What part of identity or vitality might be explored through this sign’s steady, sensory vocabulary?” |
| learner projection | “Separate the Sun’s function from Taurus’s sign-style vocabulary, then ask what other chart layers could reinforce or complicate the pairing.” |
| professional projection | “Do not issue a personal conclusion until tradition, house, aspects, rulership, required technical data, and counterevidence are admitted.” |
| quality result | PASS for the bounded V1 policy package; production personal interpretation remains not admitted |
| source state | SOURCE_RESEARCH_COMPLETE_FOR_BOUNDED_V1_POLICY |
| policy state | ADOPTED_WITH_CONDITIONS; default personal lens is modern/psychological Western; runtime eligibility remains none |

The sample projection sentences are policy-admitted research projections, not
current production copy. They remain separate from the Stage A UI and runtime.

## 36. Source/research gaps

The initial P0 source-research gap is closed for the named sources and bounded
Sun/Taurus composition. The claim-level matrix, provenance, counterevidence,
and proposed policy are recorded in
docs/research/astrology-knowledge-canon/sun-taurus/.

The following gaps still block production personal-interpretation admission:

- a professional content review before canonical English wording is frozen;
- explicit conflict-resolution rules for a future multi-school product mode;
- evidence requirements for degrees, dignity, phase, and other technical
  modifiers;
- source-backed treatment of tension language beyond bounded research
  questions;
- reviewed policy for historical authority, father, masculine, medical, status,
  financial, relationship, career, and destiny language;
- localization and runtime admission after canonical English approval.

The bounded policy is now admitted, but these policy and technical gaps remain
before any production personal-interpretation runtime is authorized.

## 37. Expansion roadmap

The bounded expansion sequence is:

1. research and register source records for the Sun and Taurus primitives;
2. compare named traditions and record differences rather than flattening them;
3. review the Planet × Sign exemplar against the quality gate;
4. obtain bundled Product Owner policy admission for the source-backed subset
   (complete for this package);
5. admit only the approved subset into a structured research registry;
6. define a small professional editorial package;
7. localize after canonical English approval;
8. connect a future runtime only after authority and acceptance gates are met;
9. expand to Planet × House and Planet × Planet Aspect with their own evidence.

This roadmap does not authorize UI work, Engine work, provider selection, AI
generation, or a full chart knowledge matrix.

## 38. Research backlog

| Priority | Research item | Exit evidence |
| --- | --- | --- |
| P0 | Sun symbolic functions across at least two reputable references and named schools | CLOSED FOR RESEARCH; claim matrix with source locators, conflicts, and policy recommendation |
| P0 | Taurus element, modality, and rulership across traditional and modern sources | CLOSED FOR RESEARCH; claim matrix with school tags and non-deterministic wording |
| P0 | Sun × Taurus composition review | POLICY ADMITTED WITH CONDITIONS; production/runtime admission remains closed |
| P1 | Modifier rules for house, aspects, orb, phase, and birth-time authority | Technical schema examples and eligibility tests |
| P1 | Counterevidence and domain-language review | Review checklist with rejected overclaims |
| P1 | Professional content and localization review | Canonical English package plus reviewed locale plan |

No backlog item may be closed by adding a citation that was not actually
consulted or by treating a generated summary as a source.

## 39. Review roles

Future admission requires separated roles:

- astrology research reviewer: checks source interpretation and school scope;
- astronomy/calculation reviewer: checks fact and technical boundaries;
- NatalNode product owner: decides product policy and audience eligibility;
- editorial reviewer: checks clarity, density, voice, and anti-Barnum wording;
- localization reviewer: checks semantic fidelity after canonical English approval;
- engineering reviewer: checks schema, provenance, versioning, and runtime
  boundary;
- privacy/trust reviewer where content could expose personal chart context.

One person may hold more than one role only when the review record makes that
conflict visible. Product acceptance cannot be inferred from a green build.

## 40. Knowledge / Engine / Signal / AI boundaries

| Boundary | Authority |
| --- | --- |
| Engine | Calculates or returns chart facts through the public contract |
| Knowledge canon | Stores reviewed object semantics, tradition, source, policy, and limitations |
| Signal layer | Composes eligible facts under a separately reviewed signal contract |
| Editorial content | Explains admitted semantics for a declared audience and depth |
| AI | May assist with bounded drafting or transformation only when explicitly authorized; it cannot choose authority, invent sources, or promote a fixture |
| UI | Presents available content and disclosures; it does not calculate or authorize knowledge |

The fixed system boundary remains:

    NatalNode.com -> Website API / BFF -> NatalNode Engine Public API

This canon does not access C:/NatalNode, implement an Engine client, select a
provider, change signal runtime, or add AI behavior.

## 41. Storage recommendation

Use a hybrid repository-backed model:

- Markdown for the policy, review rubric, school explanations, and Product
  Owner-readable decisions;
- JSON for research-only structured object and provenance records, validated
  against a future schema before runtime admission;
- TypeScript adapters only when an approved runtime needs typed imports;
- existing Markdown/frontmatter for Foundations and Class C editorial content;
- no CMS, database, or remote content service for this canon phase;
- YAML is not selected for V1 because the repository has no canonical YAML
  validation path and JSON makes the research-only shape unambiguous.

The canonical policy file is
docs/content/NATALNODE_ASTROLOGY_KNOWLEDGE_CANON_V1.md. Any future structured
exemplar belongs under docs/research/astrology-knowledge-canon/ until it passes
source and policy review. Incomplete research must not be imported into
production runtime modules.

## 42. Core primitive expansion checkpoint

The bounded primitive expansion is now recorded as a research-only package at
docs/research/astrology-knowledge-canon/primitives/. It covers:

| Family | Coverage | Current state |
| --- | --- | --- |
| Personal bodies | Sun, Moon, Mercury, Venus, Mars | Sun/Taurus policy preserved; Moon, Mercury, Venus, and Mars are ADOPTED_WITH_CONDITIONS under the modern/psychological Western lens |
| Signs | Aries through Pisces | Twelve structural layers are ADOPTED_WITH_CONDITIONS; Scorpio, Aquarius, and Pisces deeper psychological vocabulary remains SOURCE_RESEARCH_REQUIRED |
| Elements | Fire, Earth, Air, Water | Western tropical structural grouping is ADOPTED_WITH_CONDITIONS |
| Modalities | Cardinal, Fixed, Mutable | Structural operating-mode vocabulary is ADOPTED_WITH_CONDITIONS |
| Basic rulership | Traditional seven-visible-planet map plus named modern outer variants | Traditional baseline frozen; modern variants are named alternatives; default co-ruler policy not admitted |

The package consists of a source register, grouped research notes, a finite
coverage matrix, and a research-only JSON record. Each material claim carries
one of the canon claim statuses SOURCE_SUPPORTED,
SOURCE_SUPPORTED_WITH_CONDITIONS, CONTESTED, SOURCE_RESEARCH_REQUIRED, or
REJECTED. Each policy decision is independently labelled ADOPTED,
ADOPTED_WITH_CONDITIONS, SUPPORTED_AS_ALTERNATIVE, EDUCATIONAL_ONLY,
NOT_USED_FOR_PERSONAL_INTERPRETATION, or UNRESOLVED.

The Product Owner has now admitted the bounded semantic layer as
CORE_PRIMITIVE_POLICY_ADMITTED. This is canon governance only: it makes the
listed primitive dimensions available for bounded future content drafting. It
does not make them production-content-ready, does not complete ASTROLOGER or
TECHNICAL depth, and does not authorize runtime composition.

The quality review result is:

- specificity: bounded structural questions replace sign/person stereotypes;
- traceability: source IDs and review modes are registered at claim-group level;
- school clarity: traditional, early-modern, modern reference, and NatalNode
  policy layers remain separate;
- composition utility: body, sign, element, modality, and ruler are separate
  inputs; the Element × modality rule is explicitly not a full matrix;
- limitation quality: historical medical, gendered, predictive, deterministic,
  financial, relationship, and moral overclaims are rejected or educational-only;
- learnability: admitted QUICK, PLAIN, and LEARNER templates are
  READY_FOR_EDITORIAL_PACKAGE while ASTROLOGER and TECHNICAL depth remain
  incomplete;
- Barnum defense and non-determinism: no primitive is admitted as a person label,
  complete personality, diagnosis, or outcome guarantee;
- localization neutrality: no locale or translation was changed;
- runtime boundary: no runtime import, UI content, Engine contract, provider,
  or production personal-interpretation authority was added.

The full readiness view is maintained in
docs/research/astrology-knowledge-canon/primitives/PRIMITIVE_COVERAGE_MATRIX.md.
The package does not reopen the existing SUN_POLICY_ADOPTED_WITH_CONDITIONS,
TAURUS_POLICY_ADOPTED_WITH_CONDITIONS, or
SUN_TAURUS_COMPOSITION_ADOPTED_WITH_CONDITIONS decisions.

## 43. Exact next task

WEB-P2-ASTROLOGY-KNOWLEDGE-CONTENT-EXPANSION-003 — Build the bounded canonical
English package for the admitted primitive vocabulary

The next task may prepare canonical English editorial records for the admitted
semantic subset and must preserve the modern psychological default lens,
historical comparison boundary, scientific trust boundary, provider-neutral
Engine boundary, and PROVIDER DECISION DEFERRED policy. It must keep
ASTROLOGER and TECHNICAL depth explicit, retain Scorpio/Aquarius/Pisces deep
research gaps, and not begin UI integration, interpretation runtime migration,
localization, AI generation, provider selection, or a full Planet × Sign matrix
without a separately admitted task.
