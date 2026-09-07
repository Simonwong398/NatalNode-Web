# NatalNode Core Primitive English Content V1

## Product-owner review dossier

**Task:** `WEB-P2-ASTROLOGY-KNOWLEDGE-CONTENT-EXPANSION-003`
**Package:** `natalnode.core-primitive-english-content.v1`
**Canonical locale:** English (`en`)
**Content revision:** `v1.0`
**Package state:** `EDITORIAL_REVIEW_PACKAGE`
**Editorial status:** `CORE_PRIMITIVE_EDITORIAL_PACKAGE_READY_FOR_OWNER_REVIEW`

This dossier is the human review companion to [CORE_PRIMITIVE_EN_V1.json](./CORE_PRIMITIVE_EN_V1.json). The JSON package is the structured source of truth for the 25 admitted primitive objects. The prose excerpts below are copied verbatim from that package; they are not replacement copy.

## Boundary and authority

- This is a canonical-English editorial package, not runtime content.
- `runtimeEligibility` is `RUNTIME_NOT_ADMITTED` for the package and every object.
- `policyState` remains `ADOPTED_WITH_CONDITIONS`; semantic admission is not the same as production readiness.
- The package contains 5 bodies, 12 signs, 4 elements, 3 modalities, and 1 basic-rulership object.
- No new Planet × Sign composition is created. Sun × Taurus remains the prior admitted composition exemplar only.
- The default lens is `MODERN_PSYCHOLOGICAL_WESTERN`, while traditional and modern school variants remain explicitly labelled.
- Scientific, medical, demographic, deterministic, supernatural, guaranteed-outcome, and personal-diagnosis claims are not admitted.
- Provider selection remains `PROVIDER DECISION DEFERRED`.

## Content model

Every object carries the same editorial contract:

| Field | Editorial purpose |
| --- | --- |
| `quick` | A compact first definition that names the symbolic layer and its boundary. |
| `plain` | A beginner-readable explanation of the semantic field without person-type claims. |
| `learner` | A teaching passage that distinguishes the primitive from adjacent layers and names the next learning step. |
| `why` | The reason the primitive belongs in the learning canon. |
| `commonMisconception` | A common overclaim and an explicit correction. |
| `limitations` | Claims that must not be inferred from the object alone. |
| `semanticDependencies` | Admitted primitive IDs required to interpret the object structurally. |
| `sourceRefs` | Primitive-canon source register references used for the editorial synthesis. |
| `schoolNotes` | School, historical, traditional, and modern distinctions that must remain visible. |
| `contentRevision` / `editorialReviewStatus` | Revision and product-owner review state. |

## Complete object inventory

| Class | Objects | Review state |
| --- | --- | --- |
| Body | Sun, Moon, Mercury, Venus, Mars | `EDITORIAL_READY_FOR_OWNER_REVIEW` |
| Sign | Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Sagittarius, Capricorn | `EDITORIAL_READY_FOR_OWNER_REVIEW` |
| Sign | Scorpio, Aquarius, Pisces | `EDITORIAL_READY_WITH_LIMITATIONS` / `LIMITED_CANON_DEPTH` |
| Element | Fire, Earth, Air, Water | `EDITORIAL_READY_FOR_OWNER_REVIEW` |
| Modality | Cardinal, Fixed, Mutable | `EDITORIAL_READY_FOR_OWNER_REVIEW` |
| Rulership | Basic sign rulership | `EDITORIAL_READY_FOR_OWNER_REVIEW` |

The structured object count is 25. The nine signs in the first sign row are intentionally joined with the three limited-depth signs in the second row to make the total sign inventory explicit: 12 signs.

## Verbatim editorial samples

The following samples are selected to expose the highest-risk distinctions in the admitted canon. Each passage is copied from the JSON package.

### Moon — body layer

**Quick**
The Moon provides a symbolic lens on rhythm, habit and response, receptivity, inner experience, affect, and need-related questions. It is broader than emotion and does not explain a person's complete emotional life.

**Plain**
Moon language groups several related questions about what feels familiar or immediate: recurring response, habit, receptivity, inner experience, affect, and the conditions a person may experience as needed for steadiness. These terms belong together because they describe how experience is received and organized before a deliberate choice is fully articulated.

The Moon can therefore contribute a question about rhythm or response without becoming a mood label. Memory, instinct, and body-rhythm language remain conditional and school-scoped. A sign can qualify the Moon's style, while house and aspect context may redirect the discussion; none of these layers should be guessed.

**Learner**
The Moon sits in the body layer of the chart. It is useful to compare it with Venus: the Moon concerns familiar response and need-related receptivity, while Venus concerns value, attraction, preference, pleasure, and relating. It also differs from the Water element, which is a broad field available to several signs rather than a body function.

Historical references may connect the Moon with mother, feminine, body, nurturing, or medical symbolism. NatalNode keeps those meanings historical, educational, contested, or unresolved rather than placing them in default personal prose. Learn the sign, element, and modality next, then keep current-Moon, phase, and timing material outside this primitive package.

**Why**
Learning the Moon as a network of response and need-related concepts gives a reader a more accurate starting point than the shallow phrase Moon equals emotions. It also makes later distinctions between body, sign, element, and context possible.

**Common misconception and correction**
Claim: The Moon simply equals emotions, or it proves a person's emotional condition.
Correction: The Moon is a bounded symbolic lens on response, rhythm, receptivity, inner experience, affect, and needs. It is not a clinical assessment or an emotions-only definition.

**Limitations**

- Memory, instinct, body-rhythm, and historical parent or mother language require explicit qualification.
- Medical, biological, gendered, and psychological diagnosis claims are not admitted.
- Moon phase, current-Moon, transit, and lunation content are excluded from this package.

### Mercury — body layer

**Quick**
Mercury describes symbolic processes of thinking, language, interpretation, learning, mediation, movement, and exchange. Communication is one expression of this broader function, not a measure of intelligence or a complete description of how someone thinks.

**Plain**
Thinking, language, interpretation, learning, exchange, and mediation belong together because they describe movement between experience and meaning: noticing information, giving it form, comparing it, translating it, and sharing it. Mercury can therefore frame how a chart factor is discussed as information work rather than merely as speaking.

In a natal reading, the sign may qualify the style of this function, while house and aspect context may show where or with what other function it is considered. The chart cannot rank intelligence, education, fluency, or communication skill. Those depend on language, culture, opportunity, practice, and lived conditions outside a single symbolic placement.

**Learner**
Mercury is a body function, while Air is a broader element field. A Mercury placement can be discussed through information processing even when its sign is not Air; an Air sign can qualify several different bodies without turning them all into Mercury. This distinction prevents primitive collapse.

The traditional rulership baseline links Mercury with Gemini and Virgo, but rulership is a structural relation rather than proof that the body or sign has a fixed character. Learn the sign layer next, then distinguish a returned chart fact from the convention used to explore its meaning.

**Why**
A broader Mercury model helps the reader understand why interpretation can include learning, reasoning, translation, and mediation even when no communication event is being discussed. It prepares a future body-plus-sign composition without equating Mercury with IQ.

**Common misconception and correction**
Claim: Mercury means communication only, or a Mercury placement measures intelligence.
Correction: Mercury is a symbolic function spanning thinking, interpretation, language, learning, and exchange. It does not measure intelligence or guarantee communication skill.

**Limitations**

- No intelligence score, educational outcome, language ability, or communication diagnosis follows from Mercury alone.
- Commerce and movement are bounded symbolic domains, not financial or mobility predictions.
- House, aspect, sign, school, and lived context remain required for any more specific interpretation.

### Venus — body layer

**Quick**
Venus provides a symbolic lens on relating, attraction, value, preference, pleasure, aesthetic response, harmony, and union. These connected domains do not make Venus a guarantee about romance, wealth, beauty, or relationship outcome.

**Plain**
Value, preference, and attraction are related but distinct. Value asks what is treated as worthwhile; preference describes a tendency to select or appreciate one possibility over another; attraction describes what draws attention or participation. Pleasure, aesthetic response, harmony, and union describe settings in which these questions may be explored, including but not limited to romance.

Venus can contribute a question about how a chart factor relates, appreciates, negotiates, or receives enjoyment. The sign supplies a style vocabulary and the house may supply context when supported. None of these layers establishes wealth, taste, beauty, consent, compatibility, or a guaranteed relationship result.

**Learner**
Venus is a body function, not a synonym for the Air or Earth elements and not a demographic role. It differs from the Moon because Venus organizes valuation and relating while the Moon organizes familiar response and need-related receptivity. It differs from the 7th House because a body function and a chart-space context answer different questions.

Traditional and modern references can both describe Venus as a ruler of Taurus and Libra. NatalNode keeps that relationship separate from the meanings of romance, luxury, money, or beauty. Learn the sign, element, modality, and named ruler next, then ask which additional chart evidence could support a narrower discussion.

**Why**
Separating value, preference, and attraction prevents Venus from collapsing into Love Planet equals your relationships. It gives a reader a usable map for understanding why aesthetic, social, creative, and relational questions can overlap without being the same claim.

**Common misconception and correction**
Claim: Venus proves romance, relationship behavior, beauty, luxury, wealth, or material success.
Correction: Venus is a symbolic function involving valuation, preference, attraction, pleasure, and relating. Outcomes and personal qualities require evidence beyond Venus.

**Limitations**

- Romantic outcome, compatibility, wealth, luxury, beauty, and relationship certainty are not admitted from Venus alone.
- Aesthetic response is not an appearance judgment or a guarantee of taste.
- Historical gendered symbolism and advanced dignity or dispositor doctrine remain outside this package.

### Mars — body layer

**Quick**
Mars provides a symbolic lens on action, assertion, effort, separation, conflict, drive, courage, and competition. It is not an anger, violence, aggression, dangerousness, or moral-character label.

**Plain**
Mars groups questions about directed effort: beginning an action, asserting a boundary, separating one thing from another, meeting friction, competing for a goal, or sustaining a push. Separation can be symbolic differentiation or boundary-making; conflict can mean a point of contact between priorities, not an act of violence.

The sign may qualify the style of action and the house may provide a context when returned. A chart factor can prompt reflection on how effort or boundaries are discussed, but Mars does not prove anger, aggression, criminality, dangerousness, courage, or a fixed moral character.

**Learner**
Mars differs from Fire. Mars is a body function concerned with directed action and assertion; Fire is a broad sign field concerned with activation, initiative, visibility, and expression. A Fire sign can modify a body other than Mars, and Mars can be read through a non-Fire sign.

Traditional rulership connects Mars with Aries and Scorpio, while Pluto remains a named modern variant for Scorpio. That relationship does not decide how Mars behaves. Learn the sign and modality next, then compare action with the other body functions and with returned aspects before making a narrower statement.

**Why**
A multidimensional Mars vocabulary lets a reader discuss effort, boundaries, and friction without treating force as danger. It preserves practical interpretive questions while protecting against moral, criminal, medical, and gendered overreach.

**Common misconception and correction**
Claim: Mars is anger, violence, aggression, or a fixed measure of dangerousness.
Correction: Mars can organize questions about directed action, assertion, effort, separation, and conflict. Those symbolic domains do not establish behavior, risk, or moral character.

**Limitations**

- No violence, criminality, dangerousness, anger diagnosis, sexual outcome, or moral conclusion follows from Mars alone.
- Courage and competition are conditional symbolic domains, not guaranteed traits or success predictions.
- Conflict language must remain contextual and must not be inflated into safety-sensitive claims.

### Aries — sign structure

**Quick**
Aries is the Fire and Cardinal sign with Mars as its traditional ruler. In NatalNode's structural model it supplies a question about activation, initiation, assertion, and movement into action; it is not an Aries-person profile.

**Plain**
Fire contributes a broad field of activation, visibility, and expression. Cardinal contributes an operating mode of initiation, formation, turning, or movement. Mars contributes a named rulership relation that can help explain why action and assertion are part of Aries's structural vocabulary, but it does not make Mars's entire meaning the meaning of Aries.

The Aries identity emerges from these layers together. A chart factor placed in Aries may therefore be explored through how it begins, activates, or asserts within the chosen method. The sign alone does not establish impatience, leadership, dominance, courage, or an outcome.

**Learner**
Aries is different from Leo and Sagittarius because all three share Fire but not the same modality or ruler. It is also different from Cancer, Libra, and Capricorn because all four are Cardinal but carry different elements and rulers. Those comparisons show why element, modality, and rulership are inputs rather than interchangeable labels.

Learn the body first, then ask what Aries contributes to that function. Keep any house, aspect, degree, and birth-time requirements visible before moving beyond the structural question.

**Why**
Aries teaches the reader how a sign is composed rather than described as a person. The Fire/Cardinal/Mars relationship explains why Aries is not simply Fire and not simply action.

**Common misconception and correction**
Claim: Aries people are always impatient, dominant, aggressive, or natural leaders.
Correction: Aries is a structural symbolic context. Its admitted vocabulary concerns activation and initiation; it does not define a person or guarantee behavior.

**Limitations**

- No personality, leadership, aggression, career, relationship, health, or destiny claim follows from Aries alone.
- Mars rulership is a named structural relation, not a strength score or causal force.
- The full chart, school, and lived context may reinforce or redirect the sign question.

### Gemini — sign structure

**Quick**
Gemini combines an Air field, a Mutable operating mode, and a Mercury rulership relation. Its structural question concerns exchange, naming, translation, comparison, and movement between contexts; it is not a Gemini-person profile.

**Plain**
Air contributes relation, information, exchange, contrast, and abstraction. Mutable contributes adaptation, transition, redistribution, translation, and integration. Mercury contributes a named relation to thinking, language, learning, and mediation. Gemini's sign identity emerges from the way these layers meet.

A chart factor in Gemini can therefore be explored through movement between descriptions, questions, contexts, or forms of exchange. The sign alone does not establish curiosity, inconsistency, intelligence, sociability, or a communication outcome.

**Learner**
Gemini differs from Libra and Aquarius because all three share Air but use Mutable, Cardinal, and Fixed modes and different rulers. It differs from Virgo and Sagittarius because all three are Mutable but use Earth and Fire rather than Air. These contrasts show why the element supplies a field while modality supplies an operating mode.

Learn Mercury as a body function before treating Mercury rulership as more than a named relation. Then add only chart facts and context that are actually returned.

**Why**
Gemini teaches how exchange and adaptation can be discussed without becoming a personality stereotype. Its composition also demonstrates that an Air sign is not simply Mercury or communication.

**Common misconception and correction**
Claim: Gemini people are inherently scattered, two-faced, highly intelligent, or always communicative.
Correction: Gemini is a structural context for a chart factor. Its admitted language concerns exchange and translation, not a fixed person type or ability score.

**Limitations**

- No intelligence, honesty, sociability, career, relationship, or communication outcome follows from Gemini alone.
- Mercury rulership does not transfer all Mercury meanings into the sign.
- Mutable language describes operating mode, not unreliability or a guaranteed response pattern.

### Scorpio — limited-depth sign structure

**Quick**
Scorpio combines a Water field, a Fixed operating mode, and a traditional Mars rulership relation; Pluto is a named modern alternative. Its admitted structural question concerns concentration, bonding, retention, intensification, and pressure. Deeper psychological profile language remains research-required.

**Plain**
Water contributes receptivity, affect, permeability, continuity, and depth. Fixed contributes continuation, consolidation, retention, and stabilization. Mars supplies a traditional named relation to action, assertion, separation, and conflict; Pluto may be presented only as a named modern alternative. Scorpio's structural layer is the relationship among these inputs.

This package stops at that layer. It does not turn concentration or depth into secrecy, trauma, manipulation, sexuality, danger, or a complete psychological profile. A chart factor in Scorpio can be explored through a bounded structural question only when its own body function and supported context remain visible.

**Learner**
Scorpio differs from Cancer and Pisces because the Water signs use Cardinal, Fixed, and Mutable modes. It differs from Taurus, Leo, and Aquarius because Fixed signs use different fields and rulers. The Mars/Pluto distinction also teaches that traditional and modern schools may name the ruler differently without one becoming a silent replacement.

Learn the structural sign layer first. A deeper psychological treatment requires a named-school source review; this package intentionally leaves that depth open rather than filling it with familiar stereotypes.

**Why**
Scorpio demonstrates that a content package can be useful without pretending that every sign has equal psychological depth. Its structural relationships can be taught while the deeper profile remains visibly unresolved.

**Common misconception and correction**
Claim: Scorpio automatically means secretive, dangerous, manipulative, sexual, traumatized, or psychologically intense people.
Correction: Only a bounded Water/Fixed/Mars structural layer is admitted here. Deeper psychological language is `SOURCE_RESEARCH_REQUIRED` and cannot be inferred from the sign alone.

**Limitations**

- Deeper psychological vocabulary is `SOURCE_RESEARCH_REQUIRED`.
- No secrecy, trauma, sexuality, danger, manipulation, medical, or relationship outcome is admitted.
- Pluto is a named modern alternative, not a default co-ruler or silent replacement for Mars.

### Aquarius — limited-depth sign structure

**Quick**
Aquarius combines an Air field, a Fixed operating mode, and a traditional Saturn rulership relation; Uranus is a named modern alternative. Its admitted structural question concerns systems, networks, principles, patterns, and collective contrast. Deeper psychological profile language remains research-required.

**Plain**
Air contributes relation, information, contrast, exchange, and abstraction. Fixed contributes continuation, consolidation, and holding a pattern. Saturn supplies a traditional relation to structure and limits; Uranus may be named in a modern school as an alternative relation to disruption and independence. Aquarius's current canon stops at this structural bundle.

A chart factor in Aquarius may be explored through how a system, network, principle, or collective contrast is held or examined. The sign alone does not establish detachment, genius, rebellion, community, future success, or a complete psychological profile.

**Learner**
Aquarius differs from Gemini and Libra because the Air signs use Fixed, Mutable, and Cardinal modes. It differs from Taurus, Leo, and Scorpio because the Fixed signs use different fields and rulers. The Saturn/Uranus distinction demonstrates that modern outer assignments are school-labelled alternatives, not a reason to erase the traditional baseline.

Learn the structural question first. A named-school research package is required before deeper psychological vocabulary can be admitted; asymmetry is preferable to invented completeness.

**Why**
Aquarius shows how a sign can be taught as a structural relationship between information, continuity, and systems while leaving deeper psychological language explicitly open. It protects the reader from treating a memorable stereotype as a canon fact.

**Common misconception and correction**
Claim: Aquarius people are inherently detached, eccentric, genius, rebellious, or socially objective.
Correction: Only an Air/Fixed/Saturn structural layer and a named Uranus alternative are admitted. Deeper psychological claims remain `SOURCE_RESEARCH_REQUIRED`.

**Limitations**

- Deeper psychological vocabulary is `SOURCE_RESEARCH_REQUIRED`.
- No genius, detachment, rebellion, social, political, or future-outcome claim is admitted.
- Uranus is a named modern alternative, not a default replacement or co-ruler.

### Pisces — limited-depth sign structure

**Quick**
Pisces combines a Water field, a Mutable operating mode, and a traditional Jupiter rulership relation; Neptune is a named modern alternative. Its admitted structural question concerns permeability, reception, dissolution, imagination, translation, and integration across boundaries. Deeper psychological profile language remains research-required.

**Plain**
Water contributes receptivity, affect, permeability, continuity, and depth. Mutable contributes adaptation, transition, translation, and integration. Jupiter supplies a traditional relation to meaning and expansion; Neptune may be named in a modern school as an alternative relation to imagination and ambiguity. Pisces is the structural bundle, not a synonym for emotion or spirituality.

A chart factor in Pisces may be explored through how boundaries, impressions, meanings, or contexts are received and translated. The sign alone does not establish empathy, psychic ability, confusion, sacrifice, instability, or a complete psychological profile.

**Learner**
Pisces differs from Cancer and Scorpio because the Water signs use Mutable, Cardinal, and Fixed modes. It differs from Gemini, Virgo, and Sagittarius because Mutable signs use different fields and rulers. The Jupiter/Neptune distinction teaches how traditional and modern variants can be recorded without inventing a default co-ruler.

Learn the admitted structural vocabulary first. Deeper psychological language requires named-school research; the package deliberately leaves it limited instead of filling gaps with familiar imagery.

**Why**
Pisces demonstrates why permeability, integration, and imagination can be taught as structural questions without becoming a claim about psychic powers or emotional weakness. It preserves a useful learning path and a visible research boundary.

**Common misconception and correction**
Claim: Pisces people are inherently psychic, weak, sacrificial, confused, emotionally unstable, or spiritually destined.
Correction: Only a Water/Mutable/Jupiter structural layer and a named Neptune alternative are admitted. Deeper psychological and supernatural claims remain `SOURCE_RESEARCH_REQUIRED`.

**Limitations**

- Deeper psychological vocabulary is `SOURCE_RESEARCH_REQUIRED`.
- No psychic, supernatural, medical, instability, sacrifice, relationship, or destiny claim is admitted.
- Neptune is a named modern alternative, not a default replacement or co-ruler.

### Fire — element layer

**Quick**
Fire is a broad sign field for activation, initiative, visibility, energy, and expression. It is a structural lens used within a sign, not a personality category such as passionate, confident, or successful.

**Plain**
An element groups signs by a broad field of symbolic emphasis. Fire gives a chart reader questions about what is activated, expressed, initiated, or made visible. It does not describe how that field operates; modality supplies that second dimension.

Fire can therefore appear with Cardinal initiation, Fixed continuation, or Mutable adaptation. A Fire sign can qualify a body or chart factor, but Fire alone cannot establish extroversion, confidence, anger, sociability, success, or a person's temperament.

**Learner**
Fire is one of four Western tropical element groupings: Aries, Leo, and Sagittarius. It is not a chemical property, a psychological measurement, or a substitute for the sign. Compare Fire with Earth, Air, and Water as broad fields, then compare Cardinal, Fixed, and Mutable as operating modes.

The useful question is not whether someone is fiery. It is what a supported chart factor is being explored through a field of activation or expression, and what other layers could change the emphasis.

**Why**
Learning Fire as a field makes the element/modality distinction visible. It gives a reader a reusable structural vocabulary without turning a three-sign grouping into a person type.

**Common misconception and correction**
Claim: Fire equals passionate, extroverted, confident, angry, or successful.
Correction: Fire supplies a broad vocabulary of activation, initiative, visibility, and expression. It does not establish a personality or outcome.

### Water — element layer

**Quick**
Water is a broad sign field for receptivity, affect, permeability, continuity, and depth. It is not shorthand for emotional, weak, psychic, unstable, or overwhelmed people.

**Plain**
Water gives a chart reader a field of questions about what is received, felt, bonded, permeated, carried through, or experienced in depth. Modality changes whether that field forms, holds, or adapts. The element can overlap with Moon or Venus vocabulary, but it remains a sign grouping rather than a body function.

Water alone cannot diagnose emotion, weakness, instability, psychic ability, sensitivity, or a relationship outcome. Read it with the sign identity, modality, ruler, body, and supported context, and stop when the evidence does not reach a personal claim.

**Learner**
Water groups Cancer, Scorpio, and Pisces. Their Cardinal, Fixed, and Mutable modes distinguish formation/protection, concentration/retention, and permeability/translation at the structural level. The package does not fill the deeper psychological gaps for Scorpio and Pisces with stereotypes.

Compare Water with the Moon: both can use words such as receptivity or affect, but the Moon is a body question while Water is a sign field. The shared word must be qualified by the layer that owns it.

**Why**
Water teaches how affect and permeability can be a symbolic field without becoming the claim that someone is emotional or weak. It also creates a precise place to distinguish the element from the Moon and from deeper sign psychology.

**Common misconception and correction**
Claim: Water means emotional, weak, psychic, unstable, or unable to set boundaries.
Correction: Water is a bounded field of receptivity, affect, permeability, continuity, and depth. It does not establish a person type or supernatural ability.

### Fixed — modality layer

**Quick**
Fixed describes a sign's operating mode of continuation, consolidation, settlement, maintenance, and stabilization. It is not shorthand for stubborn, immobile, loyal, or resistant in every context.

**Plain**
Modality answers how a sign's field may operate. Fixed vocabulary asks what is continued, consolidated, stabilized, maintained, or held after formation. It is not the same as Earth: any element can be Fixed, and the field being maintained changes with the sign.

Fixed can help a learner ask how a chart factor stays with an emphasis or develops continuity. It cannot prove persistence, resistance, loyalty, or inability to change. Historical solid language can be taught as a related comparison, not as unchanged modern psychology.

**Learner**
Fixed signs are Taurus, Leo, Scorpio, and Aquarius. Their Earth, Fire, Water, and Air fields make their structural questions distinct even though all four share a mode. Taurus is the existing exemplar where Earth, Fixed, and Venus are shown together; that does not authorize a full Fixed-sign interpretation matrix.

Learn the difference between continuation and stubbornness. Then compare Fixed with Cardinal formation and Mutable adaptation, keeping each mode as a question rather than a label.

**Why**
Fixed makes continuity a readable operating mode without turning it into a moral flaw. The historical solid bridge also teaches why terminology can be related without being treated as identical across schools.

### Mutable — modality layer

**Quick**
Mutable describes a sign's operating mode of adaptation, transition, redistribution, translation, and integration between conditions. It is not shorthand for indecisive, inconsistent, or unreliable people.

**Plain**
Modality describes how a sign's field may operate. Mutable vocabulary is useful when a structural question involves translating, adjusting, redistributing, integrating, or moving between conditions. It does not say what the field is; element supplies that broad domain.

A Mutable sign can therefore be discussed through adaptation without turning change into inconsistency. The sign, its ruler, the body being described, and the chart context still determine which question is relevant. A modality alone cannot establish flexibility, indecision, unreliability, or an outcome.

**Learner**
Mutable signs are Gemini, Virgo, Sagittarius, and Pisces. Air, Earth, Fire, and Water make their fields different even though the mode is shared. Compare Gemini's exchange, Virgo's refinement, Sagittarius's wider integration, and Pisces's permeability at the admitted structural level; do not make them interchangeable.

Historical bicorporeal language may be explained as context, but it is not identical to modern Mutable psychology. Learn how modality differs from element, then compare both with the sign's ruler.

**Why**
Mutable gives the reader a precise vocabulary for transition and translation without rewarding the stereotype that change is unreliability. The shared mode becomes a comparison tool rather than a personality category.

### Basic sign rulership — structural relation

**Quick**
In Western astrology, a ruler is a named structural relationship between a sign and a planet in a specified tradition. The V1 baseline uses the traditional seven-visible-planet mapping; modern outer-planet assignments are named alternatives, not causal control or a strength score.

**Plain**
Rulership tells a learner which planet a school associates with a sign and therefore which relationship may be recorded when the method calls for it. It is a technical or symbolic link, not a claim that the planet controls a person or that the ruler is automatically the strongest factor.

NatalNode's V1 baseline keeps traditional rulers visible: Mars for Aries and Scorpio, Venus for Taurus and Libra, Mercury for Gemini and Virgo, the Moon for Cancer, the Sun for Leo, Jupiter for Sagittarius and Pisces, and Saturn for Capricorn and Aquarius. Pluto, Uranus, and Neptune may be shown as named modern alternatives for Scorpio, Aquarius, and Pisces.

**Learner**
Rulership is part of sign structure, but it is not the sign itself and it does not import the ruler's whole vocabulary into the sign. A school may use traditional or modern outer assignments; the record must show which one is being used. NatalNode does not admit a default co-ruler policy for V1.

Advanced dispositor chains, dignity scoring, mutual reception, triplicity rulers, bounds, faces, exaltation, fall, and detriment need separate source and technical admission. For now, learn to keep sign, ruler, body, school, and policy state as separate fields.

**Why**
A beginner-readable rulership record prevents a common hidden school choice. It explains why a ruler can contribute to sign structure while remaining a relation to record rather than a personality verdict or scientific cause.

**Common misconception and correction**
Claim: The ruler controls the sign, is automatically the strongest planet, or decides the sign's personality and outcome.
Correction: Rulership is a named tradition-specific relationship. It must retain its school label and cannot replace the sign, body, chart context, or evidence required for a conclusion.

## Semantic collision audit

The package intentionally reuses ordinary words only when the owning layer is explicit:

| Shared vocabulary | Distinct owners | Guardrail |
| --- | --- | --- |
| Identity / organization | Sun as a body function; signs as structural contexts | Neither becomes a universal person claim. |
| Expression / visibility | Sun's central organizing lens; Fire's sign field; Leo's sign structure | Body, element, and sign remain separate. |
| Response / receptivity | Moon's body function; Water's sign field; Cancer's sign structure | Shared affect language is qualified by layer. |
| Value / continuity | Venus's valuation; Earth's field; Fixed's mode; Taurus's structural bundle | No automatic romance, money, or stubbornness claim. |
| Relation / exchange | Air's field; Mercury's information function; Gemini's sign structure; Libra's context | Air is not Mercury; a sign is not a body. |
| Action / movement | Mars's directed effort; Fire's activation field; Cardinal's initiation; Mutable's translation | No aggression, danger, or unreliability inference. |
| Depth / intensity | Water's broad field; Scorpio's bounded concentration; S/A/P depth boundary | Deeper psychology remains research-required. |

**Result:** `PASS` for the bounded editorial layer. Shared words retain an explicit semantic owner and do not create a hidden composition matrix.

## Sign differentiation audit

- Fire: Aries / Leo / Sagittarius share a field but differ by Cardinal / Fixed / Mutable mode and Mars / Sun / Jupiter traditional ruler relations.
- Earth: Taurus / Virgo / Capricorn share a field but differ by Fixed / Mutable / Cardinal mode and Venus / Mercury / Saturn ruler relations.
- Air: Gemini / Libra / Aquarius share a field but differ by Mutable / Cardinal / Fixed mode and Mercury / Venus / Saturn ruler relations.
- Water: Cancer / Scorpio / Pisces share a field but differ by Cardinal / Fixed / Mutable mode and Moon / Mars / Jupiter ruler relations.
- Cardinal: Aries / Cancer / Libra / Capricorn share a mode but differ by Fire / Water / Air / Earth field and Mars / Moon / Venus / Saturn ruler relations.
- Fixed: Taurus / Leo / Scorpio / Aquarius share a mode but differ by Earth / Fire / Water / Air field and Venus / Sun / Mars / Saturn ruler relations.
- Mutable: Gemini / Virgo / Sagittarius / Pisces share a mode but differ by Air / Earth / Fire / Water field and Mercury / Mercury / Jupiter / Jupiter ruler relations.

**Result:** `PASS` at the admitted structural layer. Scorpio, Aquarius, and Pisces remain `LIMITED_CANON_DEPTH`; no stereotypes are used to manufacture equal-depth prose.

## Body differentiation audit

- Moon is response, rhythm, receptivity, affect, and need-related language; Venus is value, attraction, preference, pleasure, and relating.
- Mercury is information processing, language, learning, mediation, and exchange; Air is a sign field and is not Mercury.
- Mars is directed action, assertion, effort, separation, and conflict; Fire is a sign field and is not Mars.
- Sun is central organization, vitality, will, and visibility; Leo is a sign structure and is not the Sun.

**Result:** `PASS`. Each distinction is stated in the object prose and in the package-level collision controls.

## Anti-Barnum and knowledge-density review

The package avoids universal person descriptions, second-person certainty, diagnostic claims, guaranteed outcomes, and personality labels presented as facts. Each object adds a definition, a semantic boundary, a distinction from adjacent primitives, and a next learning hook. The repeated limitations are deliberate authority controls, not filler.

- Barnum-defense result: `PASS`
- Knowledge-density result: `PASS`
- S/A/P limitations: preserved as `LIMITED_CANON_DEPTH` and `SOURCE_RESEARCH_REQUIRED`

## Policy and provenance checks

- Traditional seven-visible-planet rulership baseline: preserved.
- Modern outer-planet variants: preserved as named alternatives for Scorpio, Aquarius, and Pisces.
- Default co-ruler: absent; `NOT_ADMITTED_FOR_V1_DEFAULT_CANON`.
- New doctrine: none.
- New Planet × Sign compositions: none.
- Source/provenance coverage: every object has primitive-canon source references, source status, school notes, policy state, runtime eligibility, and revision status.

## Content coverage

| Editorial block | Current package |
| --- | --- |
| Quick definition | `QUICK_READY` — 25/25 |
| Plain explanation | `PLAIN_READY` — 25/25 |
| Learner explanation | `LEARNER_READY_WITH_DOCUMENTED_LIMITATIONS` — 25/25 |
| Deeper psychological treatment for Scorpio / Aquarius / Pisces | `SOURCE_RESEARCH_REQUIRED` |
| Full Planet × Sign compositions | `NOT_ADMITTED` |
| Production/runtime import | `RUNTIME_NOT_ADMITTED` |
| Localization | `NOT_IN_SCOPE` |

## Product-owner decision requested

Please review the actual English prose in [CORE_PRIMITIVE_EN_V1.json](./CORE_PRIMITIVE_EN_V1.json), especially the Moon, Mercury, Venus, Mars, Water, Scorpio, Aquarius, Pisces, and rulership boundaries. Approval of this dossier would approve the editorial package for the next separately scoped admission decision; it does not authorize runtime import, localization, full composition generation, or production interpretation.

**Current decision:** `PRODUCT_OWNER_REVIEW_REQUIRED`
