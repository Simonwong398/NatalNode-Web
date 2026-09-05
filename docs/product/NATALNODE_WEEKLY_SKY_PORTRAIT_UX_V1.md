# NatalNode Weekly Sky Portrait UX V1

Task: WEB-P2-WEEKLY-UX-WIREFRAME-001
Status: WEEKLY_UX_WIREFRAME_ADMITTED
Validation level: MODULE_PASS
Next gate: READY_FOR_WEEKLY_READING_MODEL

This document is the canonical low-fidelity UX and interaction specification
for a future NatalNode Weekly Sky Portrait. It defines how a person should
read a week. It does not implement a route, page, component, API, calculation,
content engine, or production Weekly system.

The source of truth remains:

NatalNode.com
→ Website API / BFF
→ NatalNode Engine Public API

The accepted product principle is:

HUMAN READING FIRST

The accepted Weekly POC remains:

WEEKLY_CONTENT_POC_PASS
DEVELOPMENT_ONLY
NOT_PRODUCTION_WEEKLY_READY

Any POC wording shown in this document is explicitly an example of existing
development evidence. It is not a new forecast, a new scientific fact, or
production-ready copy.

## 1. Weekly product purpose

Weekly is the reader’s current chapter: a bounded, human-readable account of
what matters across the week, where the meaningful shifts are, and where a
reader can choose to look more closely.

The product purpose is not to enumerate every Signal. It is to help a person:

1. recognize what kind of week this is;
2. understand what matters most;
3. notice when the meaning changes;
4. connect the reading to a relevant part of life;
5. decide whether to explore, save, share, or print it.

Weekly is between Monthly context and Daily orientation:

~~~text
THIS MONTH
  broad context
      ↓
THIS WEEK
  current chapter
      ↓
TODAY
  current moment
~~~

This is a target reading model only. It does not migrate the current
navigation or create any missing period route.

## 2. Human reading objective

The Weekly experience must feel like a short personal editorial reading, not
an AI-style structured report.

The reader should be able to stop after each layer:

~~~text
5 seconds
  orientation

30 seconds
  useful value

1–3 minutes
  meaningful exploration

optional
  technical depth

after value
  save / share / print / collect
~~~

The hierarchy is mandatory even when the visual layout changes. The page must
not begin with export controls, technical astrology, provenance, settings,
multiple long cards, or a full timeline.

### 2.1 Block-earning rule

Every visible block must add at least one of:

- new meaning;
- new context;
- new timing;
- new actionability;
- new explanation;
- new emotional relevance.

If it adds none of these:

MERGE

or:

OMIT

This rule applies to Hero, At a Glance, domain details, Timeline, Best
Window, Watch Out, Signature, Why this week?, and Astrologer’s View.

### 2.2 Three trees remain separate

The existing Human Reading First architecture distinguishes:

~~~text
Authority tree
  Engine Facts → Signals → Interpretation → Provenance

Content tree
  Hero → Main Theme → Supporting Themes → Timing
          → Practical Meaning → Explanation → Technical Detail

Navigation tree
  Home → Today / This Week / This Month
       → My Chart / Relationships / Collection / Learn
~~~

Weekly UX consumes an already-authorized interpretation projection. It does
not make the authority tree, the content tree, and the navigation tree
interchangeable.

## 3. Attention ladder

The attention levels are conceptual layers. They must not appear as literal
numbered headings in the product.

### Level 0 — five-second scan

The first viewport shows:

- Week identity;
- one dominant Hero phrase;
- one short interpretation sentence;
- one compact timing cue when timing evidence exists.

The reader should know what kind of week this is and whether a meaningful
timing shift exists without opening a disclosure.

### Level 1 — thirty-second value

The reader sees:

- THIS WEEK AT A GLANCE;
- up to three editorially meaningful themes;
- one short sentence per theme.

Three is a maximum, not a quota. A single coherent theme or two themes are
valid outcomes when evidence is thin or naturally grouped.

### Level 2 — one-to-three-minute exploration

The reader can open or continue into relevant life domains:

- Love & Relationships;
- Work & Creation;
- Inner State;
- Decisions.

Only domains with distinct meaning are included. A domain may be merged into a
core theme when it merely repeats the same idea.

### Level 3 — timeline and context

Timeline makes timing human-readable:

- MON, TUE, WED, or labeled day groups;
- background versus shorter windows;
- meaningful overlap;
- no machine-generated system preamble.

On mobile, timing is stacked as labeled windows. On desktop, it may span the
reading spine. It must not require horizontal scrolling.

### Level 4 — Why this week?

This accessible disclosure explains why the themes were selected and how
meaningful evidence relates. It does not dump provenance or repeat the Hero.

### Level 5 — Astrologer’s View

This is optional advanced depth. It may show approved technical facts, aspects,
houses, angles, orb, phase, and timing context only when authoritative.

It remains separate from Why this week? and must not invent technical content
for unknown or incomplete inputs.

### Level 6 — actions

Save, Share, Print, and future Collect appear after reading value. The action
bar is not the opening content and does not replace a reading.

## 4. First viewport

### 4.1 Required questions

The first viewport must answer:

- WHAT KIND OF WEEK IS THIS?
- WHAT MATTERS MOST?
- IS THERE A TIMING SHIFT?

### 4.2 Allowed first-viewport content

~~~text
THIS WEEK
SEP 7 — SEP 13

Hero phrase

One short interpretation sentence.

Timing cue:
Strongest around THU–FRI, when authoritative.
~~~

The date range is a display identity supplied by the period authority. It is
not generated by the UI.

### 4.3 Excluded from the first viewport

Do not place any of the following above the fold:

- the full Timeline;
- multiple long paragraphs;
- technical astrology;
- settings or account status;
- provenance;
- three long domain cards;
- a large export/action panel;
- a second equivalent headline;
- an unrelated public horoscope block.

## 5. Week identity

Week identity is a quiet, explicit temporal label. It must be more
immediately understandable than report branding.

Recommended semantic order:

~~~text
THIS WEEK
period label or localized date range
optional edition context
~~~

The period label must:

- identify the exact week being read;
- localize according to the reader’s locale;
- preserve an unambiguous start and end;
- remain visible when the reader scrolls through the reading if the design
  uses a sticky context cue;
- never imply that the client calculated the period.

The period label is not a substitute for timing evidence inside the week.

## 6. Hero

Hero is the dominant editorial element.

### 6.1 Hero rules

- one dominant Hero only;
- one primary phrase or sentence;
- no second equivalent headline;
- no large technical card competing with it;
- no signature line displayed beside it;
- no astrology jargon required for comprehension;
- no predictive certainty or fixed-event language;
- no generic horoscope claim when the content is personal or incomplete.

### 6.2 Existing POC example

The following is actual Scenario A CLEAR POC copy and is shown only as a
layout example:

“A clear center of gravity helps conversations move forward: name the point,
then leave room for the response.”

The wireframe may place that existing sentence in the Hero. It must not copy
the same sentence into Core, Domain, Best Window, and Signature.

### 6.3 Hero relationship to timing

The Hero can include a compact timing cue below or beside the sentence when
the source has timing evidence. It must not absorb the full Timeline or turn a
momentary window into the whole week.

Scenario D demonstrates the rule: the broad steady-progress theme remains the
Hero, while the shorter decision window remains a Timeline emphasis.

## 7. Thirty-second summary

### 7.1 At-a-Glance structure

~~~text
THIS WEEK AT A GLANCE

THE MAIN THEME
One short human sentence.

SUPPORTING THEME
One short human sentence.

OPTIONAL THIRD THEME
Only when it adds a distinct idea.
~~~

The heading may be localized. It is a reading cue, not a data-contract name.

### 7.2 Theme composition

Each theme contains:

- a short human-readable label;
- one sentence;
- an editorial priority;
- enough context to stand alone at Level 1;
- a path to deeper detail only if deeper detail exists.

The composition layer may group several Signals into one theme. It must not
show one card per Signal solely because a source set contains several Signals.

Candidate reader labels include ACTION, INNER STATE, RELATIONSHIPS, and WORK,
but labels should be refined for natural language rather than exposing domain
enums verbatim.

### 7.3 Theme count

Use:

- one theme when one idea genuinely dominates;
- two themes when two meanings complement or contrast;
- three themes only when all three earn independent space.

Do not add a filler third theme to preserve symmetry.

## 8. Conditional domains

Detailed life-domain content comes after At a Glance and only when it adds
value.

Candidate domain headings:

- LOVE & RELATIONSHIPS;
- WORK & CREATION;
- INNER STATE;
- DECISIONS.

### 8.1 Inclusion rule

Include a domain only when it adds:

- a new life context;
- a practical implication;
- a distinct emotional relevance;
- a useful action;
- an explanation that the core theme cannot provide.

### 8.2 Merge rule

If the domain sentence is merely:

“For [domain],” plus the same Core Theme sentence,

the domain is MERGE or OMIT. It must not become a duplicate card.

### 8.3 Empty-state rule

No evidence means:

no domain section.

Do not render empty placeholders, “nothing here” cards, or a four-domain grid
to make the page look complete.

## 9. Timeline model

### 9.1 Timeline ownership

Timeline owns temporal meaning. It is the primary owner for:

- explicit windows;
- day or day-group labels;
- background versus momentary distinction;
- overlapping windows;
- a compact Best Window emphasis when that is useful.

Hero and domains may mention timing only when they add a different meaning.

### 9.2 Human-readable labels

Use labels that tell the reader what the window is for:

~~~text
MON–THU
Make the point before the explanation expands.

FRI–SUN
Choose one defined next step.
~~~

These lines use the existing Scenario A POC semantic output. The system
prefix “The timeline marks this explicit window” is not reader-facing UI copy
and must be removed from the visual composition.

### 9.3 Desktop model

Desktop may use:

~~~text
MON    TUE    WED    THU    FRI    SAT    SUN
 |------ communication opening ------|
                      |---- action window ----|
~~~

This is a conceptual map, not a requirement for a seven-column card grid.
Meaningful day groups may be shown as two or three rows when that improves
reading.

### 9.4 Mobile model

Mobile uses a vertical list:

~~~text
TIMELINE

MON–THU
Communication opening
Short human meaning.

FRI–SUN
Next-step window
Short human meaning.
~~~

No horizontally scrolling seven-day strip is required for the core reading.

### 9.5 No timing evidence

When no Signal has an explicit temporal window:

- omit the Timeline;
- omit Best Window;
- do not show an empty timeline container;
- do not display a dominant negative-state card saying timing is unavailable;
- do not infer a day or date from the existence of the Weekly period;
- preserve the meaningful non-timing reading.

Scenario E is the reference behavior.

## 10. Overlapping windows

### 10.1 Reader problem

Scenarios B and C contain windows that overlap or change meaning during the
same part of the week. A reader must understand that both can be true; one
does not cancel the other.

### 10.2 Recommended composition

~~~text
TIMELINE

MON–WED
RELATIONSHIP OPENING
Name expectations before they become assumptions.

WED–SUN
EXPECTATION FRICTION
Hold pace and care in the same frame.
~~~

The labels above are semantic display labels for the POC’s existing mixed
relationship evidence. They are not new calculated facts.

For Scenario C:

~~~text
MON–THU
ACTION OPENING
Use the early opening for the move already intended.

WED–SUN
EMOTIONAL VOLUME
Leave space before turning a reaction into an answer.
~~~

### 10.3 Visual rules for overlap

- show each window as an independent labeled interval;
- use order and labels, not color alone, to communicate overlap;
- do not stack two full paragraphs over the same date range;
- do not use an error or conflict icon for ordinary mixed evidence;
- let the reader see a change in emphasis without implying cancellation;
- use a compact annotation such as “overlapping themes” only if it helps, not
  as system vocabulary.

## 11. Background and momentary distinction

Scenario D contains broad background evidence and a shorter opportunity.

The hierarchy is:

~~~text
ALL WEEK
STEADY PROGRESS
The larger theme remains the reading’s center of gravity.

FRI–SUN
DECISION WINDOW
A short opportunity operates inside the larger pattern.
~~~

Rules:

- the broad theme remains the Hero when it is the durable weekly context;
- the short window is visually distinct but subordinate;
- the short window may receive Best Window emphasis;
- the short window must not erase the background context;
- a short timing period must not be framed as a guaranteed event;
- the Timeline owns the distinction so every domain does not repeat it.

## 12. No-timing week

Scenario E must still feel complete.

The composition is:

~~~text
THIS WEEK
period identity

Hero
available placement-level meaning

AT A GLANCE
one or two supported themes

IN YOUR LIFE
only a domain that adds meaning

WHY THIS WEEK?
optional explanation of the available reading boundary

SAVE / SHARE / PRINT
after value
~~~

There is no empty Timeline box, no empty Best Window box, and no dominant
negative-state panel. The absence of timing is expressed by omission and,
when useful, a humane disclosure lower in the reading.

## 13. Unknown birth time UX

### 13.1 Value-first order

When birth time is unknown:

1. show what remains useful;
2. keep the Hero and supported themes readable;
3. omit time-dependent houses, ASC, MC, and unsupported angles;
4. explain the boundary in a short disclosure;
5. keep unsupported technical detail out of the default view.

Do not lead with “Timing unavailable” or a failure-style card.

### 13.2 Humane disclosure

Candidate reader-facing language:

“Some time-dependent details are intentionally omitted because your birth time
is unknown.”

This sentence is a conceptual disclosure, not an instruction to add a new
content rule. It should appear after the reader has received available value.

### 13.3 Astrologer’s View for unknown time

Astrologer’s View may explain that placement-level facts remain usable while
houses and angles are omitted. It must not create substitute houses, angles,
dates, or fake technical content.

The existing Scenario E ASTROLOGER POC sentence is an appropriate evidence
example:

“The placement-level signal remains useful when time-dependent chart authority
is unavailable.”

## 14. Watch Out

Watch Out is contextual, not mandatory.

When present:

- use one concise high-salience line;
- place it near the decision or domain meaning it qualifies;
- do not make it look like an error or system warning;
- use calm emphasis rather than red-alert styling;
- omit it when there is no challenging or mixed evidence;
- do not repeat the same caution in Hero, Timeline, and Domain.

Existing Scenario C POC example:

“Pause before treating temporary frustration as a final answer.”

This is useful as one caution. It should not become a separate alert system.

## 15. Best Window

Best Window has no independent authority over timing.

### 15.1 Ownership

Timeline owns timing. Best Window is one of:

- an emphasized Timeline state;
- a small contextual callout;
- omitted.

### 15.2 Decision rule

If Best Window repeats the same timing and meaning already visible in Timeline:

DOWNGRADE or OMIT

If it adds a compact practical emphasis that helps the reader act:

KEEP as a small callout linked to the Timeline owner.

Never create a full Best Window card solely because the data contract has a
Best Window field.

## 16. Why this week?

Why this week? is an accessible progressive-disclosure layer.

It answers:

- why these themes were selected;
- how two meanings relate;
- why a domain appears;
- why a timing distinction matters;
- what is background versus momentary.

It does not show:

- raw provenance;
- Signal IDs;
- rule identities;
- fixture authority;
- scientific configuration internals;
- a duplicated Hero.

Possible reader labels:

- WHY THIS WEEK?
- See what is shaping this reading
- Why these themes?

WHY THIS WEEK? is the current recommended label because it is clear, short,
and aligned with the user’s question.

## 17. Astrologer’s View

Astrologer’s View is separate from Why this week? and remains collapsed by
default.

When authoritative, it may show:

- planets;
- aspects;
- houses;
- angles;
- orb or phase;
- timing context;
- a concise technical interpretation.

It must not show ordinary users:

- approved anchor;
- source authority;
- fixture authority;
- rule identity;
- internal governance terms;
- raw source IDs.

It must not create fake technical content for Scenario E. The advanced layer
is a depth option, not a status display.

## 18. Actions after value

The action layer is intentionally late in the reading:

~~~text
Hero
  ↓
At a Glance
  ↓
Relevant detail
  ↓
Timeline
  ↓
Why this week?
  ↓
Astrologer’s View
  ↓
Save / Share / Print / Collect
~~~

### 18.1 Save

Save should appear when the reader has received enough value to understand
what is being saved. It should not appear as the first dominant action.

Save may preserve a reading or input according to a separately approved
persistence contract. This UX document does not change Vault semantics.

### 18.2 Share

Share should be discoverable at the end of the reading and, if useful, as a
quiet secondary action near the Hero after the first read. It should derive
from the Hero and content hierarchy, not from database metadata.

The share projection must remain privacy-safe:

- no email;
- no private birth date or time;
- no account identity;
- no internal IDs;
- no capacity or system status;
- no unsupported technical claim.

### 18.3 Print

Print is a clearly secondary action. The Weekly screen must continue to feel
like a responsive reading, not like a printed report.

Print opens a separate presentation adaptation. It does not simply capture
the screen, expose hidden system detail, or repeat the Account print model.

### 18.4 Collect

Collection is an approved future semantic surface, but production Collection
does not yet exist. In a wireframe, Collect may be:

- shown as a future-state action annotation;
- grouped with Save in design documentation;
- omitted from current implementation prototypes until its persistence
  contract is approved.

Do not imply that current Vault already stores Weekly Portrait editions.

## 19. Share entry

Share visually derives from the Weekly Hero and at-a-glance meaning:

~~~text
Reading value first
  ↓
small secondary Share action
  ↓
full reading
  ↓
primary share action after value
~~~

The first Share affordance must not interrupt the first five-second scan. A
reader who finishes the first useful layer should know where to share without
searching through utility menus.

The share card should carry enough independent value to deserve sharing:

~~~text
NATALNODE
THIS WEEK

One hook
One useful insight
Optional second line

natalnode.com
~~~

The actual text comes from the approved content projection. The wireframe
does not prescribe a new phrase.

## 20. Print entry

Print is visible after the reading has established value:

~~~text
[Save] [Share] [Print]
~~~

The exact control treatment is intentionally not implemented here. Print
should:

- remain secondary to reading;
- open or generate a dedicated print adaptation;
- include meaningful disclosures that were collapsed on screen;
- omit empty sections;
- preserve the same content order;
- avoid screen navigation, account management, and technical status clutter.

## 21. Mobile wireframe

The representative target is 375px. The same structure must reflow to 320px
and 430px without horizontal overflow.

The following wireframe uses actual Scenario A CLEAR POC copy where useful.
It is a development-only content example, not a production reading.

### 21.1 Mobile first viewport — 375px

~~~text
+-----------------------------------+
| NATALNODE                    [≡] |
+-----------------------------------+
| THIS WEEK                         |
| 2026-W37 · MON–SUN                |
|                                   |
| A clear center of gravity helps   |
| conversations move forward: name |
| the point, then leave room for    |
| the response.                     |
|                                   |
| TIMING                            |
| Communication opening: MON–THU   |
|                                   |
| [scroll continues]                |
+-----------------------------------+
~~~

First-viewport behavior:

- the period identity precedes the Hero;
- the actual POC Hero gives the dominant meaning;
- only one compact timing cue is shown;
- no full Timeline, technical view, settings, provenance, or long domain
  paragraphs appear above the fold;
- the menu is a shell utility, not part of the reading hierarchy.

### 21.2 Mobile continued reading

~~~text
| THIS WEEK AT A GLANCE             |
|                                   |
| CLEAR COMMUNICATION               |
| The useful opening is directness  |
| with room for another person to  |
| answer.                           |
|                                   |
| DELIBERATE NEXT STEP              |
| The week favors one defined move  |
| with a reason you can still       |
| recognize tomorrow.               |
|                                   |
| IN YOUR LIFE                      |
| Communication                     |
| The useful opening is directness  |
| with room for another person to  |
| answer.                           |
|                                   |
| ACTION                            |
| Choose one defined move and leave |
| the rest unclaimed.               |
~~~

The domain and action lines above are layout examples. If they repeat the
core themes without adding context, the actual composition merges or omits
them. The page does not require both blocks.

### 21.3 Mobile Timeline

~~~text
| TIMELINE                          |
|                                   |
| MON–THU                           |
| COMMUNICATION OPENING             |
| The point is easier to use when   |
| it is named before the explanation|
| expands.                          |
|                                   |
| FRI–SUN                           |
| NEXT-STEP WINDOW                  |
| Choose one defined move and leave |
| the rest unclaimed.               |
~~~

The system phrase from the POC, “The timeline marks this explicit window,” is
not rendered. The human meaning is retained.

### 21.4 Mobile disclosure and actions

~~~text
| [Why this week?                  >]|
|                                   |
| [Astrologer’s View               >]|
|                                   |
| [Save] [Share] [Print]             |
| [Collect — future]                |
+-----------------------------------+
~~~

Disclosure rules:

- Why this week? is closed initially;
- Astrologer’s View is closed initially;
- buttons announce their expanded state;
- action controls are after the content;
- Collect is explicitly future-state if no production Collection exists.

### 21.5 320px and 430px behavior

At 320px:

- the Hero may wrap to more lines but remains the first dominant block;
- timing remains a compact label/value pair;
- domain sections stack fully;
- action controls may wrap to a second row;
- no content is clipped or horizontally scrolled.

At 430px:

- the reading spine may gain breathing room;
- two small timing labels may share a row only if they remain readable;
- no extra card or paragraph is added merely because there is more width.

## 22. Desktop wireframe

The desktop wireframe uses one editorial reading spine. A secondary rail is
allowed only for quiet context and never becomes a second report.

### 22.1 Desktop dimensions

Conceptual constraints:

- overall shell: existing visual-system maximum;
- Weekly reading spine: editorial reading maximum;
- timeline: can use the reading width, not a dense dashboard grid;
- secondary rail: narrow and optional;
- content order: one vertical spine from Hero to actions.

Exact CSS values are intentionally not defined in this UX document.

### 22.2 Desktop wireframe

~~~text
+--------------------------------------------------------------------------------+
| NATALNODE   Home  Today  This Week  This Month  My Chart  Collection  Learn     |
|                                                                     Account [≡] |
+--------------------------------------------------------------------------------+
|                                                                                |
|                         THIS WEEK                                             |
|                         2026-W37 · MON–SUN                                    |
|                                                                                |
|                         A clear center of gravity helps conversations move     |
|                         forward: name the point, then leave room for the       |
|                         response.                                              |
|                         Communication opening: MON–THU                        |
|                                                                                |
|                         THIS WEEK AT A GLANCE                                  |
|                         +--------------------------------------------------+ |
|                         | CLEAR COMMUNICATION                               | |
|                         | The useful opening is directness with room for    | |
|                         | another person to answer.                         | |
|                         +--------------------------------------------------+ |
|                         | DELIBERATE NEXT STEP                              | |
|                         | The week favors one defined move with a reason    | |
|                         | you can still recognize tomorrow.                 | |
|                         +--------------------------------------------------+ |
|                                                                                |
|                         IN YOUR LIFE                     [quiet context, optional] |
|                         Communication                                        |
|                         New practical meaning.       No equal-weight card wall. |
|                                                                                |
|                         TIMELINE                                               |
|                         MON–THU  communication opening                         |
|                         FRI–SUN  next-step window                              |
|                                                                                |
|                         [Why this week?]  [Astrologer’s View, collapsed]       |
|                                                                                |
|                         [Save] [Share] [Print] [Collect]                       |
+--------------------------------------------------------------------------------+
~~~

### 22.3 Desktop rules

- the Hero is the only dominant visual element;
- At a Glance is a readable sequence, not a three-column requirement;
- the optional rail contains context only, not duplicate interpretation;
- Timeline is readable across the spine;
- advanced depth remains below the first reading;
- actions appear after the content;
- no global navigation migration is implied by this wireframe.

## 23. Print wireframe

Print is a separate adaptation. It targets approximately two to four pages
for a substantial Weekly edition and fewer pages for thin content.

### 23.1 Substantial Weekly

~~~text
PAGE 1
  NATALNODE
  THIS WEEK · localized period identity
  Hero
  Main Theme
  THIS WEEK AT A GLANCE

PAGE 2
  Supporting Themes
  Relevant domain insights
  TIMELINE
  MON–THU / FRI–SUN or meaningful day groups

PAGE 3
  Additional relevant domain insights
  Watch Out, only when meaningful
  Best Window only when distinct from Timeline
  WHY THIS WEEK?

PAGE 4, only if useful
  ASTROLOGER’S VIEW
  Signature
  NatalNode identity
  natalnode.com
~~~

### 23.2 Thin or no-timing Weekly

~~~text
PAGE 1
  Period identity
  Hero
  At a Glance

PAGE 2, if useful
  Relevant domain insight
  Why this week?
  Signature / NatalNode identity
~~~

There is no dead Timeline page and no empty Best Window section. A thin
reading may be one page if that is the honest result.

### 23.3 Print interaction rules

- screen navigation is removed;
- collapsed useful explanation is opened;
- empty blocks are omitted;
- timing remains legible without color;
- technical depth is an appendix, not the cover;
- private identity and internal metadata remain excluded unless a separate
  approved report contract says otherwise.

## 24. Share wireframe

The target is a 4:5 portrait social card. It must carry actual independent
value and must not become a screenshot of the full report.

~~~text
+----------------------------------+
|                                  |
| NATALNODE                        |
| THIS WEEK                        |
|                                  |
| A short human hook from the     |
| approved Hero projection.       |
|                                  |
| One useful insight that can     |
| stand alone outside the app.   |
|                                  |
| Optional second line only when  |
| it adds a different nuance.     |
|                                  |
| natalnode.com                    |
|                                  |
+----------------------------------+
~~~

Actual POC examples include:

- Scenario A SHARE: “Say the useful thing.” and “Clarity gives the conversation
  somewhere to go.”
- Scenario C SHARE: “Move with a reason.” and “Momentum works better when it
  leaves room for judgment.”

These are existing development-only POC projections, not new copy or a
production content policy.

Share must not include:

- email;
- birth date or time;
- private chart metadata;
- account identity;
- signal or rule IDs;
- provenance identifiers;
- system status;
- unsupported technical claims.

## 25. Five-scenario stress test

This stress test maps every existing POC scenario into the proposed reading
hierarchy. It validates layout and information hierarchy. It does not rewrite
the POC or create new astrology facts.

### 25.1 Scenario A — Supportive Communication

| Wireframe question | Proposed behavior |
| --- | --- |
| First viewport | Use the existing POC CLEAR Hero: “A clear center of gravity helps conversations move forward: name the point, then leave room for the response.” Show the Week identity and one compact MON–THU communication cue. |
| At-a-Glance | Show CLEAR COMMUNICATION and DELIBERATE NEXT STEP as two short themes. The POC’s directness and defined-move meanings are visible without a card per Signal. |
| Detail sections included | Communication detail when it adds context; Decisions only when the practical next step adds something beyond the core theme. No empty relationship or emotional section. |
| Timeline behavior | Show MON–THU communication opening and FRI–SUN next-step window as two labeled human-meaning rows. Remove the POC system preamble from the visual copy. |
| Watch Out | Omit. The source evidence is supportive and not mixed. |
| Advanced view | Keep the existing POC technical review context about the supplied Mercury position and aspect timing in Astrologer’s View only, when authoritative for the future product. |
| What is omitted | Full duplicate Best Window card, duplicated Action Decision paragraph, raw Signal IDs, rule identity, provenance, and internal fixture labels. |
| What is merged | Action Decision merges into DELIBERATE NEXT STEP when it repeats that sentence; Best Window becomes a Timeline emphasis or is omitted; Signature moves to the close/share layer. |

Existing POC copy used for the share-safe direction:

“Say the useful thing.”

“Clarity gives the conversation somewhere to go.”

These lines remain development-only evidence.

### 25.2 Scenario B — Mixed Relationship

| Wireframe question | Proposed behavior |
| --- | --- |
| First viewport | Use the existing POC CLEAR Hero: “Closeness has room to grow, but different pacing or expectations may be harder to ignore.” Show one compact relationship timing cue. |
| At-a-Glance | Show one MIXED RELATIONSHIP theme that holds supportive closeness and challenging expectations together. Do not split the week into a positive card and a negative card. |
| Detail sections included | LOVE & RELATIONSHIPS with a new practical meaning; Watch Out once if it adds a useful caution. |
| Timeline behavior | Show the overlapping relationship windows as independently labeled intervals, for example an opening and a later expectation-friction window. Use order and text, not color alone. |
| Watch Out | Keep one line such as the existing POC: “Pause before treating a difference in pace as proof of a difference in care.” |
| Advanced view | Keep the existing POC Venus position and Venus–Saturn square review context in the advanced layer only; neither direction becomes a certain outcome. |
| What is omitted | A second relationship paragraph that repeats the core, duplicate Best Window copy, fixed verdict language, and internal mixed-evidence labels. |
| What is merged | Core relationship meaning and the repeated Relationship block merge; Best Window becomes a timeline emphasis; Signature stays as a close/share line rather than a second Hero. |

Existing POC share direction:

“Closeness needs room.”

“Warmth can coexist with a boundary that still needs naming.”

### 25.3 Scenario C — Action vs Emotional Tension

| Wireframe question | Proposed behavior |
| --- | --- |
| First viewport | Use the existing POC CLEAR Hero: “Action has support, especially when it is chosen before emotion takes the steering wheel.” Show the first supported action-window cue. |
| At-a-Glance | Show FORWARD ACTION and REACTIVE EMOTION as complementary themes. The contrast is meaningful; it does not require a warning-heavy layout. |
| Detail sections included | DECISIONS and INNER STATE when each adds practical or emotional context; Watch Out once. |
| Timeline behavior | Show an early-to-midweek action opening and the later emotional window as overlapping labeled rows. Make the shift in emphasis visible without implying cancellation. |
| Watch Out | Keep one concise line: “Pause before treating temporary frustration as a final answer.” |
| Advanced view | Keep the existing POC Mars–Jupiter trine review context in Astrologer’s View only, without inferring an event or result. |
| What is omitted | Duplicate Action Decision text when it repeats the forward-action theme, repeated emotional caution, Best Window as a second full card, and raw technical identifiers. |
| What is merged | Inner State domain text merges into REACTIVE EMOTION when it adds no new emotional context; Action Decision merges into FORWARD ACTION when it repeats; Best Window becomes the emphasized early Timeline state. |

Existing POC share direction:

“Move with a reason.”

“Momentum works better when it leaves room for judgment.”

### 25.4 Scenario D — Background + Momentary

| Wireframe question | Proposed behavior |
| --- | --- |
| First viewport | Use the existing POC CLEAR Hero: “The larger theme is steady progress: fewer pivots, more follow-through.” Show a quiet cue that a shorter window occurs later. |
| At-a-Glance | Show STEADY PROGRESS and one defined choice as the core meanings. The momentary window does not displace the background theme. |
| Detail sections included | WORK & CREATION and DECISIONS when each adds a distinct use of the broad or short evidence. |
| Timeline behavior | Show ALL WEEK steady progress and FRI–SUN decision window as different temporal layers. The short window is visually distinct but subordinate. |
| Watch Out | Omit. The POC scenario contains supportive rather than mixed or challenging evidence. |
| Advanced view | Keep the supplied Saturn position and explicit aspect timing as advanced review context; no transit or guaranteed event is added. |
| What is omitted | A momentary Hero that erases the weekly context, duplicate Best Window paragraph, and repeated background/moment distinction in every domain. |
| What is merged | Best Window merges into the FRI–SUN Timeline emphasis; repeated Work and Action paragraphs merge into their core themes; Signature is downgraded to close/share. |

Existing POC share direction:

“Keep the thread.”

“Steady progress compounds quietly.”

### 25.5 Scenario E — Unknown Birth Time

| Wireframe question | Proposed behavior |
| --- | --- |
| First viewport | Use the existing POC CLEAR Hero: “A useful review can stay grounded in what is available: notice the pattern before reaching for a bigger story.” Do not lead with an error or missing-time card. |
| At-a-Glance | Show the stable placement-level meaning and simple-language theme when each is useful. One or two themes are sufficient. |
| Detail sections included | INNER STATE only if it adds new meaning; a humane explanation may be placed under Why this week? or the advanced layer. |
| Timeline behavior | Omit the Timeline completely. Do not render a blank box or a dominant “Timing unavailable” state. |
| Watch Out | Omit because the POC has no challenging or mixed evidence and no separate caution. |
| Advanced view | Show only the existing POC boundary explanation about placement-level facts; do not create houses, ASC, MC, aspects, dates, or time-dependent claims. |
| What is omitted | Timeline, Best Window, unsupported houses, angles, ASC, MC, day-level timing, fabricated technical content, and repeated limitation notices. |
| What is merged | Inner State merges with the placement-level core when the domain adds no new context; the unknown-time boundary merges into one humane disclosure; Signature is reserved for close/share. |

Existing POC share direction:

“Start with what is known.”

“A clear boundary around the facts makes reflection more useful.”

### 25.6 Stress-test result

The proposed wireframe survives all five scenarios if it permits:

- fewer than three core themes;
- one mixed theme instead of opposing cards;
- a broad theme plus a subordinate moment;
- an omitted Timeline when no timing evidence exists;
- an optional technical layer that does not invent facts;
- domain omission when the domain merely repeats a theme.

The stress test therefore supports the Human Reading First architecture and
does not authorize a runtime implementation.

## 26. Semantic dedupe test

The current POC intentionally exposes some repeated semantic content to make
traceability visible. The future wireframe must preserve meaning while giving
each block one owner.

### 26.1 Scenario A matrix

| Block | POC repetition found | Classification | Resolution |
| --- | --- | --- | --- |
| Hero | Clear center of gravity and room for response | KEEP | Dominant first sentence. |
| Core Theme | Directness and defined next step | KEEP | Two concise At-a-Glance themes. |
| Domain | Communication repeats the directness Core | MERGE | Keep only distinct life context or practical use. |
| Best Window | Repeats the MON–THU communication window | DOWNGRADE | Emphasize the matching Timeline row or omit. |
| Timeline | POC timing lines include a system preamble and human meaning | KEEP | Keep the human meaning; remove system prose. |
| Signature | Make the point, then make room | DOWNGRADE | Use as close/share identity, not beside Hero. |
| Advanced technical view | Mercury/aspect anchor | ADVANCED_ONLY | Keep behind Astrologer’s View when authoritative. |

### 26.2 Scenario B matrix

| Block | POC repetition found | Classification | Resolution |
| --- | --- | --- | --- |
| Hero | Closeness plus different pacing or expectations | KEEP | Establishes mixed relationship frame. |
| Core Theme | Hold warmth and friction in the same frame | KEEP | One mixed theme, not two verdict cards. |
| Domain | Relationship repeats the Core sentence | MERGE | Add only distinct relational practice or omit. |
| Best Window | Repeats the relationship timing window | DOWNGRADE | Use a compact Timeline emphasis. |
| Timeline | Overlapping windows explain when the relationship meaning shifts | KEEP | Separate labeled intervals; no cancellation claim. |
| Signature | Closeness needs room for honesty | DOWNGRADE | Closing/share line. |
| Advanced technical view | Venus position and Venus–Saturn square | ADVANCED_ONLY | Explain evidence only in the advanced layer. |
| Watch Out | Pace difference is not proof of care difference | KEEP | One contextual caution. |

### 26.3 Scenario C matrix

| Block | POC repetition found | Classification | Resolution |
| --- | --- | --- | --- |
| Hero | Action before emotion takes the steering wheel | KEEP | Dominant tension in ordinary language. |
| Core Theme | Forward action and reactive emotion | KEEP | Two complementary themes. |
| Domain | Inner State repeats reactive-emotion Core | MERGE | Add a distinct emotional practice or omit. |
| Best Window | Repeats the early action window | DOWNGRADE | Emphasize the early Timeline row. |
| Timeline | Early action and later emotional windows | KEEP | Overlap is labeled and ordered. |
| Signature | Momentum remains yours | DOWNGRADE | Closing/share line. |
| Advanced technical view | Mars–Jupiter trine | ADVANCED_ONLY | Keep only as authoritative technical context. |
| Watch Out | Temporary frustration is not a final answer | KEEP | One practical caution. |

### 26.4 Scenario D matrix

| Block | POC repetition found | Classification | Resolution |
| --- | --- | --- | --- |
| Hero | Steady progress and follow-through | KEEP | Durable weekly center. |
| Core Theme | Concrete choice and repeatable effort | KEEP | Short At-a-Glance themes. |
| Domain | Work/Creation or Action repeats a Core sentence | MERGE | Retain only a distinct life context or action. |
| Best Window | Repeats the short explicit window | DOWNGRADE | Use the FRI–SUN Timeline emphasis. |
| Timeline | Broad background plus short momentary window | KEEP | Two temporal layers with clear hierarchy. |
| Signature | Consistency is a form of clarity | DOWNGRADE | Close/share layer. |
| Advanced technical view | Saturn position and supplied timing | ADVANCED_ONLY | Do not let technical detail replace the background theme. |

### 26.5 Scenario E matrix

| Block | POC repetition found | Classification | Resolution |
| --- | --- | --- | --- |
| Hero | Grounded review and available facts | KEEP | Value-first opening. |
| Core Theme | Placement-level signal and simple language | KEEP | One or two supported themes. |
| Domain | Inner State repeats placement-level Core | MERGE | Include only if it adds meaning. |
| Best Window | No timing evidence | OMIT | No placeholder. |
| Timeline | No Signal has an explicit temporal window | OMIT | No empty timeline. |
| Signature | Good reading begins with honest limits | DOWNGRADE | Close/share layer, not a second Hero. |
| Advanced technical view | Boundary around placement facts | ADVANCED_ONLY | Explain omission without inventing chart machinery. |

### 26.6 Dedupe policy

~~~text
Hero        = KEEP once
Core        = KEEP when independently meaningful
Domain      = MERGE or OMIT when it repeats Core
Timeline    = KEEP as timing owner
Best Window = DOWNGRADE or OMIT when it repeats Timeline
Watch Out   = KEEP only when it adds a usable caution
Signature   = DOWNGRADE to close/share
Technical   = ADVANCED_ONLY
~~~

This is a presentation policy. It does not delete source Signals or traceable
interpretation evidence.

## 27. Normal human mobile walkthrough

I open Weekly on my phone.

### First five seconds

I see THIS WEEK and the period I am reading. Under it is one sentence that
tells me the week’s center of gravity. A small timing cue tells me whether the
emphasis shifts during the week. I do not have to decode technical terms or
open a card to understand the starting point.

### First thirty seconds

I continue to THIS WEEK AT A GLANCE. I see at most three short themes. The
themes are grouped in language I can recognize, such as communication,
decisions, relationships, work, or inner state. If the week contains mixed
meaning, the summary holds both sides together instead of presenting a
positive promise and a negative warning as competing verdicts.

### Next two minutes

I open the domain that matters to me, if one is present. I scan the Timeline
as labeled day groups rather than reading machine-generated timing prose. If
two windows overlap, both remain visible with their own meaning. I can open
Why this week? when I want context, and Astrologer’s View only if I want
technical depth. Once the reading has helped me, I can Save, Share, or Print.

At no point am I forced to read an empty domain, a full data dump, a warning
dashboard, or a technical appendix before receiving value.

## 28. Cognitive-load review

### 28.1 Risks audited

| Risk | Wireframe result | Guardrail |
| --- | --- | --- |
| Too many headings | Controlled | One H1; short H2 groups; do not name every internal field. |
| Too many cards | Controlled | At-a-Glance is a readable sequence; three themes is a maximum, not a grid requirement. |
| Equal-weight blocks | Controlled | Hero has one visual lead; domains and Timeline remain subordinate. |
| Too many CTAs | Controlled | Save, Share, Print, and future Collect appear after value; no CTA-only Hero. |
| Repeated meaning | Controlled | Every block has one owner; apply the dedupe matrix before rendering. |
| Technical interruption | Controlled | Why this week? and Astrologer’s View are below the useful read; technical detail is optional. |
| Visual fragmentation | Controlled | One editorial reading spine; avoid a wall of independent cards. |
| Long text walls | Controlled | Use the length targets and progressive disclosure; thin content becomes shorter. |

### 28.2 Explicit guardrails

These are product heuristics, not lint rules or automatic content rewriting:

- one dominant Hero;
- one primary H1;
- up to three default core themes;
- no more than four conditional domain families;
- one Timeline owner for timing;
- one Watch Out line when needed;
- one Best Window emphasis at most when it adds distinct value;
- one clear first action after the reading;
- no duplicate sentence across Hero and its primary detail owner;
- no required interaction for the first useful meaning;
- no horizontal scrolling for core mobile reading;
- no technical identifiers in default user copy.

### 28.3 Stop condition for density

If adding a block makes the reader ask “why am I seeing this here?” and the
answer is only “because the data model contains it,” the block fails the
Human Reading First rule and must be merged, downgraded, or omitted.

## 29. Conceptual component responsibility model

The following names describe future conceptual responsibilities only. They do
not authorize creating components in this campaign.

| Responsibility | Conceptual owner | Must not do |
| --- | --- | --- |
| Weekly page boundary | WeeklyPortraitShell | Must not calculate facts or choose semantic priority. |
| Period identity and Hero | WeeklyHero | Must not render a second equivalent headline or expose internal IDs. |
| Thirty-second summary | WeeklyAtAGlance | Must not map one source Signal to one mandatory card. |
| Conditional domain content | WeeklyDomainInsight | Must not render empty domains or duplicate Core meaning. |
| Timing | WeeklyTimeline | Must own timing presentation but must not invent windows or date precision. |
| Caution | WeeklyWatchOut | Must not act as a generic error/warning system. |
| Explanation | WeeklyWhy | Must explain selection and meaning without dumping provenance. |
| Advanced depth | WeeklyAstrologerView | Must not invent technical facts or expose governance vocabulary by default. |
| Post-value actions | WeeklyActions | Must not move Save/Share/Print ahead of the first useful reading. |
| Future retention | WeeklyCollectionAction | Must remain design-only until Collection persistence is separately approved. |

### 29.1 Responsibility boundary

The conceptual split prevents:

- one giant report component;
- direct WeeklySignalSet rendering;
- duplicated semantic decisions in Astro and React;
- UI-level invention of timing or domain relevance;
- a technical view becoming the default content path.

It does not require a specific framework or file structure.

## 30. Weekly content composition boundary

### 30.1 Boundary

The future UI should receive a presentation-ready projection:

~~~text
WeeklyInterpretationDraft
       ↓
deduplicate
       ↓
order by human reading priority
       ↓
classify visibility
       ↓
WeeklyReadingModel
       ↓
Astro / React presentation
~~~

The Astro or React layer should not make semantic astrology decisions.

### 30.2 WeeklyReadingModel recommendation

A bounded WeeklyReadingModel is recommended before Weekly UI implementation.
It should be a presentation contract, not a second authority model.

Conceptual shape:

~~~text
WeeklyReadingModel
|
|-- period
|     reader-facing label
|     authoritative start and end
|     locale-ready display information
|
|-- hero
|     heading
|     one-sentence body
|     visibility: DEFAULT
|
|-- atAGlance
|     ordered list of 0–3 human-facing themes
|     heading and one-sentence body per theme
|
|-- domains
|     ordered conditional domain insights
|     already deduplicated
|
|-- timeline
|     optional ordered meaningful windows
|     day or day-group label
|     background or momentary role
|     human-facing body
|
|-- watchOut
|     optional one-line caution
|
|-- why
|     optional explanatory disclosure
|
|-- astrologer
|     optional advanced disclosure
|
|-- actions
|     save / share / print
|     collect only when separately available
|
+-- internal traceability
      source references and block identity
      never rendered as ordinary copy
~~~

### 30.3 Contract invariants

The future contract should guarantee:

- already-deduplicated blocks;
- already-ordered blocks;
- already-classified visibility;
- no empty required domain;
- no unsupported Timeline;
- no unsupported Best Window;
- no consumer-facing technical identifiers;
- no fixture promoted to production authority;
- no scientific claim beyond the authority input;
- no need for the UI to inspect raw Signals to decide what to show.

### 30.4 What remains outside the contract

The model must not become a hidden calculation engine. It should not:

- calculate planets, aspects, houses, or timing;
- decide provider identity;
- infer unknown birth time;
- invent missing authority;
- persist a reading;
- perform localization fallback decisions that belong to the content layer;
- silently substitute a fixture for production authority.

### 30.5 Implementation status

No WeeklyReadingModel type, runtime adapter, route, or component is created
here. This section is a contract recommendation for the next task.

## 31. Accessibility specification

### 31.1 Semantic heading order

Recommended future order:

~~~text
H1  This Week
  H2  This Week at a Glance
  H2  In Your Life, only when a domain exists
  H2  Timeline, only when timing exists
  H2  Watch Out, only when meaningful
  H2  Why this week?
  H2  Astrologer’s View
  H2  Save / Share / Print, if a heading is needed
~~~

The visual Hero phrase may be the H1 or sit immediately under the period
identity, but there must be only one primary H1.

### 31.2 Landmarks

Future implementation should expose:

- header and navigation;
- main reading landmark;
- optional complementary context landmark;
- footer;
- no hidden duplicate main landmark for print or share.

### 31.3 Disclosure behavior

Why this week? and Astrologer’s View are real disclosure controls:

- use a button, not a clickable styled paragraph;
- expose expanded/collapsed state;
- associate the control with its panel;
- keep the panel in reading order;
- do not hide the only useful meaning behind a disclosure;
- preserve readable focus when a panel opens or closes.

### 31.4 Keyboard sequence

Recommended order:

1. skip link;
2. primary navigation or menu control;
3. period identity and Hero content;
4. At-a-Glance;
5. domain disclosure or content;
6. Timeline;
7. Watch Out;
8. Why this week?;
9. Astrologer’s View;
10. Save, Share, Print, and future Collect.

### 31.5 Timeline without color

Timeline meaning must survive without color:

- every interval has a text label;
- background and momentary roles are named;
- overlapping windows are ordered and titled;
- emphasis is paired with text, weight, or placement;
- no color-only legend determines whether a window is supportive or
  challenging.

### 31.6 Screen-reader labels

Examples of future accessible labels:

- “This Week, September 7 through September 13”;
- “Timeline, Monday through Thursday, communication opening”;
- “Timeline, Friday through Sunday, next-step window”;
- “Why this week? collapsed”;
- “Astrologer’s View, collapsed”;
- “Share this Weekly reading”;
- “Print this Weekly reading”.

The exact localized string belongs to the future content and UI contract.

### 31.7 Zoom and reflow

At increased text size:

- content reflows vertically;
- Hero remains readable;
- disclosure controls remain reachable;
- timeline rows wrap without clipping;
- actions may wrap without disappearing;
- no fixed-height panel hides meaning;
- 320px remains a supported reflow width.

### 31.8 Motion

If future Timeline or ambient visual treatment moves:

- respect prefers-reduced-motion;
- do not animate meaning into existence after response;
- retain all timing information in static text;
- do not use motion as the only distinction between windows.

## 32. Visual direction

Preserve:

NATALNODE VISUAL V1.1 FUNCTIONAL BASELINE = APPROVED

Weekly should feel:

- modern observatory;
- editorial;
- personal;
- premium;
- quietly intelligent.

Avoid:

- SaaS dashboard;
- generic horoscope app;
- card-wall UI;
- zodiac clipart;
- neon mystical overload;
- fake luxury;
- excessive glassmorphism;
- telemetry or debug panels;
- visual noise that makes all blocks appear equally important.

### 32.1 Visual hierarchy

The intended order is:

~~~text
meaning
  >
context
  >
explanation
  >
technical detail
  >
utility
~~~

Use restrained borders, editorial whitespace, a limited accent palette, a
deliberate type scale, high-contrast primary text, and quieter metadata.

### 32.2 Responsive direction

Desktop uses whitespace and a possible quiet rail. Mobile uses one vertical
reading spine. The content priority does not change between viewports.

### 32.3 Medium relationship

The screen, print adaptation, and share card derive from the same semantic
hierarchy but are not the same composition:

- screen supports progressive reading;
- print supports a finite edition;
- share supports one independent hook and insight.

## 33. Implementation handoff

### 33.1 Admitted handoff

This task hands off:

- a Weekly first-viewport hierarchy;
- a 5-second / 30-second / 1–3-minute reading ladder;
- conditional domain rules;
- a timing-owned Timeline model;
- overlap and background/momentary behavior;
- no-timing and unknown-time behavior;
- post-value action placement;
- mobile, desktop, print, and share wireframes;
- five-scenario stress-test evidence;
- a semantic dedupe matrix;
- conceptual component responsibilities;
- a bounded WeeklyReadingModel recommendation;
- accessibility and cognitive-load guardrails.

### 33.2 Explicitly not handed off

This task does not hand off authorization to:

- create routes;
- create Astro pages;
- create React components;
- change CSS or navigation;
- add API or BFF routes;
- change databases or migrations;
- implement LLM content;
- implement astronomy logic;
- implement signal rules;
- implement provider behavior;
- implement Account, Vault, Share, Learn, Discover, or Community changes.

### 33.3 Exact next task

READY_FOR_WEEKLY_READING_MODEL

Recommended exact next task:

WEB-P2-WEEKLY-READING-MODEL-001 — Define the bounded WeeklyReadingModel
presentation contract from WeeklyInterpretationDraft, including deduplication,
ordering, visibility classification, authority-safe empty states, and the
five-scenario fixtures as development-only contract examples.

That task should remain type/spec and contract work unless it is separately
expanded. It must not start Weekly UI automatically.

### 33.4 Later implementation order

After the Reading Model contract is accepted:

1. Product Owner reviews the model and five-scenario mappings.
2. A separately authorized Weekly UI prototype consumes the model.
3. Built-runtime and owner-browser evidence are collected at the appropriate
   gate.
4. Production Weekly authority is considered only after the scientific and
   temporal prerequisites are independently satisfied.

## 34. Source recovery and final status

### 34.1 Sources read

Phase 0 source recovery covered:

- docs/product/NATALNODE_CONTENT_UX_INFORMATION_ARCHITECTURE_V1.md;
- docs/architecture/NATALNODE_INTERPRETATION_SYSTEM_V1.md;
- docs/research/weekly-signal-poc/WEEKLY_SIGNAL_POC_REVIEW.md;
- docs/research/weekly-signal-poc/scenario-a.md;
- docs/research/weekly-signal-poc/scenario-b.md;
- docs/research/weekly-signal-poc/scenario-c.md;
- docs/research/weekly-signal-poc/scenario-d.md;
- docs/research/weekly-signal-poc/scenario-e.md;
- docs/design/NATALNODE_VISUAL_SYSTEM_V1.md;
- current responsive and layout primitives under apps/web/src/;
- current SiteLayout, route, Learn, Chart, Vault, Account, Share, Discover,
  Community, Practitioner, and Tools surfaces as relevant.

### 34.2 Accepted decisions preserved

The frozen Product Owner decisions remain:

- Month → Week → Today is target IA only;
- Vault is retained as the current technical/historical storage concept;
- My Chart is the stable chart reference;
- Collection is accumulated temporal/editorial artifacts;
- Community is secondary/contextual;
- Relationships is a future pillar, with primary navigation deferred;
- public horoscope is acquisition, SEO, and discovery;
- Public Home is acquisition-first;
- authenticated Home is personal-value-first.

No current production navigation was migrated.

### 34.3 Authority and scope boundary

The source hierarchy remains:

NatalNode.com
→ Website API / BFF
→ NatalNode Engine Public API

No provider decision was made. No astronomy, Engine, BFF, Auth, Vault,
database, migration, or scientific logic was changed.

### 34.4 Final status

~~~text
WEB-P2-WEEKLY-UX-WIREFRAME-001
WEEKLY_UX_WIREFRAME_ADMITTED
MODULE_PASS
READY_FOR_WEEKLY_READING_MODEL
NOT_IMPLEMENTED
STOP
~~~
