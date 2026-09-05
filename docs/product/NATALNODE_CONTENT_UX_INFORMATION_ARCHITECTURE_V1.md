# NatalNode Human Reading + Information Architecture V1

Task: WEB-P2-CONTENT-UX-001
Status: CONTENT_UX_ARCHITECTURE_ADMITTED
Validation level: MODULE_PASS
Next gate: READY_FOR_WEEKLY_UX_WIREFRAME

This document freezes the first product-facing information architecture for
human-readable NatalNode content. It is a product architecture and UX
admission document, not an implementation task.

The source of truth remains:

NatalNode.com
→ Website API / BFF
→ NatalNode Engine Public API

The web product may shape, group, explain, and present authoritative results.
It must not invent calculated facts, promote fixtures, or make a presentation
tree into an authority tree.

## 1. Scope, status, and non-goals

### 1.1 Scope

This document defines:

- the Human Reading First product principle;
- the relationship between authority, content, and navigation trees;
- a candidate information architecture for public and authenticated use;
- the attention hierarchy for Daily, Weekly, and Monthly reading;
- progressive disclosure and content-density rules;
- mobile, desktop, print, and share reading contracts;
- current information-architecture findings and route impact;
- the bounded next step for Weekly UX wireframing;
- decisions that require Product Owner confirmation before implementation.

The word candidate is used for choices that still require Product Owner
confirmation. The admission status means the architecture is sufficiently
coherent to guide the next bounded design task. It does not mean every naming
decision has been permanently approved.

### 1.2 Explicit non-goals

This task does not:

- implement Home, Today, This Week, This Month, Collection, or Relationships;
- create Daily, Weekly, or Monthly routes;
- change the current route map;
- change the interpretation authority model;
- create a Weekly view model, renderer, selector, or content adapter;
- rewrite the Weekly POC prose;
- add a chart calculation or provider integration;
- expose signal IDs, rule IDs, fixtures, or provenance internals to readers;
- redesign Account, Vault, Share, Learn, Discover, Community, or Tools;
- change Account Share or Print behavior;
- make Weekly content production-ready;
- modify C:\NatalNode.

The accepted Weekly POC remains DEVELOPMENT_ONLY and
NOT_PRODUCTION_WEEKLY_READY. This document defines how a future reading
surface may organize that kind of content; it does not change the POC’s
authority or readiness.

### 1.3 Admission statement

The following architecture is admitted for the next bounded product-design
step:

CONTENT_UX_ARCHITECTURE_ADMITTED

The admitted boundary is:

Human reading hierarchy and information architecture
→ future content composition and UX wireframe work

The boundary does not admit a production Daily, Weekly, Monthly, Collection,
or Relationships implementation. Any implementation task must be separately
authorized after the Product Owner decisions in Section 26 are resolved.

## 2. Human Reading First

### 2.1 Principle to freeze

NatalNode must organize content around how a person reads and decides what
matters, not around the shape of the internal semantic model.

The reader should be able to answer, in order:

1. What is the main thing to notice?
2. What does it mean in ordinary language?
3. Where does it show up in life?
4. When is it most relevant?
5. What can I explore, remember, save, or share next?

The internal model may contain many facts, signals, timing anchors, domains,
confidence markers, provenance references, and technical explanations. Those
fields are inputs to editorial composition. They are not a mandatory page
outline.

### 2.2 What Human Reading First changes

Human Reading First prioritizes:

- scanability before field completeness;
- clear hierarchy before symmetrical coverage;
- progressive disclosure before visible exhaustiveness;
- narrative flow before a field-by-field dump;
- cognitive load before dashboard density;
- human rhythm before machine ordering;
- a clear next action before a collection of equal-weight controls;
- an honest short reading before padded content;
- contextual relevance before empty domain templates.

Human Reading First does not mean simplifying away authority. It means
presenting authority in the order a person can understand and use it.

### 2.3 What Human Reading First forbids

The following are not acceptable default composition rules:

- one visible section for every internal field;
- three visible themes solely because three source Signals exist;
- a domain section for every possible domain;
- a timeline section when no timing evidence exists;
- repeated text in Hero, Overview, Domain, Best Window, and Watch Out;
- technical governance language in consumer-facing prose;
- an equal-weight card wall that makes the reader choose the hierarchy;
- exposing source IDs, rule IDs, fixture status, or provenance identifiers as
  if they were reader-facing value.

## 3. The three trees

NatalNode requires three related but separate trees. They may exchange
structured information through explicit contracts, but none may silently
replace another.

### 3.1 Authority tree

~~~text
Engine Facts
    |
    v
Signals
    |
    v
Interpretation
    |
    v
Provenance
~~~

The authority tree answers:

- What was calculated?
- Which signal or interpretation is supported?
- What timing or evidence exists?
- What source and provenance constraints apply?

The authority tree is not a page layout. Its internal IDs and evidence
metadata remain internal or advanced detail unless a future product decision
explicitly requires a reader-safe explanation.

### 3.2 Content tree

~~~text
Hero
  |
  +-- Main Theme
        |
        +-- Supporting Themes
        |
        +-- Timing
        |
        +-- Practical Meaning
        |
        +-- Explanation
        |
        +-- Technical Detail
~~~

The content tree answers:

- What should be read first?
- Which ideas belong together?
- Which detail is useful only after the reader understands the meaning?
- Where should timing be explained once and only once?
- Which explanation can remain hidden until requested?

The content tree is editorial. It can group several Signals into one theme,
omit a low-value Signal from the default view, or let one Signal support a
sentence without becoming its own card.

### 3.3 User navigation tree

~~~text
Home
  |
  +-- Today
  +-- This Week
  +-- This Month
  +-- My Chart
  +-- Relationships
  +-- Collection
  +-- Learn

Utility
  +-- Account
  +-- Notifications
  +-- Privacy
  +-- Export
  +-- Settings
  +-- Sign out
~~~

The user navigation tree answers:

- Where does a reader go for a time horizon?
- Where does a reader go for a personal chart?
- Where do saved or accumulated things live?
- Where do utility and privacy controls live?

Navigation labels should have information scent. They should describe the
reader’s goal, not the implementation object that happens to provide it.

### 3.4 Tree ownership rule

The three trees may be related as follows:

~~~text
Authority tree
      |
      v
Content composition
      |
      v
Reading surface inside user navigation
~~~

No reverse promotion is allowed:

- a navigation label must not become a scientific authority;
- a content block must not become a persisted result;
- a fixture must not become a calculated fact;
- a route or card must not determine which authority state exists.

## 4. Product mental model

### 4.1 The reader’s mental model

The product should feel like a living personal reading system:

~~~text
Now        = What is active today?
This week  = What chapter am I in?
This month = What larger pattern is unfolding?
My chart   = What is the stable structure I return to?
Collection = What have I chosen to keep?
Learn      = How do I understand the language?
~~~

The period surfaces are not three copies of a report. They are three scales of
attention:

~~~text
MONTH: broad context
   ↓
WEEK: current chapter
   ↓
TODAY: current moment
~~~

The chart is a stable reference frame rather than another time-period report.
Relationships is a future pillar for relational reading, not a substitute for
the general chart or a generic community feed.

### 4.2 Information scent

Preferred reader-facing labels:

- Home: return to the current personal overview;
- Today: the immediate orientation;
- This Week: the current chapter;
- This Month: the wider context;
- My Chart: the enduring personal chart;
- Relationships: relational reading;
- Collection: things the reader chose to keep;
- Learn: explanations and foundations.

Labels that describe implementation or storage should not be the only way to
find reader value. Calculate remains a useful action label in the current
product, but it does not fully describe the return experience of an
authenticated reader. Vault remains a valid current storage label, but it
does not by itself communicate the distinction between the active chart and
accumulated readings.

### 4.3 Current product vocabulary assessment

The following classifications use:

- GOOD: the current label and placement already create useful scent;
- ACCEPTABLE: works today but may need contextual or naming refinement;
- FRICTION: users can reach the surface, but its role or placement competes
  with a clearer mental model;
- STRUCTURAL_PROBLEM: the current composition conflicts with the proposed
  product hierarchy;
- FUTURE_ONLY: keep the concept out of primary value navigation until a
  later capability or decision exists.

| Current surface | Current role | Classification | Information-architecture implication |
| --- | --- | --- | --- |
| Learn | Editorial learning hub and foundations content | GOOD | Keep as a durable public learning entry point. |
| Calculate | Birth input and chart creation boundary | GOOD | Keep as the principal creation action; later distinguish creation from My Chart. |
| Tools | Reference lookup directory | ACCEPTABLE | Keep contextual or secondary; it is not a recurring personal reading destination. |
| Vault | Authenticated saved-chart list and detail | ACCEPTABLE | Keep current route until a My Chart / Collection decision is approved. |
| Community | Public questions and Ask Question flow | FRICTION | Useful public surface, but its current primary-nav position competes with core reading. |
| Auth session control | Sign in, Account, Feedback, Sign out | GOOD | Treat as utility and identity control, not as content navigation. |
| Account | Authenticated settings, privacy, export, share, and deletion controls | ACCEPTABLE | Keep utility-only; do not put management controls into Home content. |
| Discover | Public zodiac and structural exploration | ACCEPTABLE | Keep contextual and public; link from Learn, Tools, or relevant content. |
| Practitioner | Directory and application surface | FUTURE_ONLY | Keep out of normal reader primary navigation until its audience need is explicit. |
| Public Share cards | Public static sign, match, and elements-and-modes cards | ACCEPTABLE | Keep as its own public acquisition/content surface; do not imply personal Weekly share exists. |
| Account Share / Print | Private utility presentation of account data | ACCEPTABLE | Preserve current utility boundary; future Weekly share must be independently designed. |
| Public Sky | Current public sky orientation | ACCEPTABLE | Use as contextual orientation, not as a replacement for personal Today authority. |
| Dev Current Sky | Development-only demonstration route | FUTURE_ONLY | Never use it as evidence that a production Today surface exists. |
| About / Methodology / Privacy / Terms | Trust and utility footer navigation | GOOD | Keep discoverable and semantically separate from reading navigation. |
| Canonical and localized route pairs | Locale-specific versions of the same surface | GOOD | Treat as localization delivery, not duplicate product destinations. |

### 4.4 Current structural findings

The current product has a coherent set of implemented surfaces, but it does
not yet have the candidate period-reading tree.

Observed gaps:

- the root Home is currently a Calculate-oriented experience for both guests
  and authenticated readers;
- there is no explicit Today, This Week, or This Month route or reading
  surface;
- the same root can expose acquisition, birth input, Public Sky context, and
  chart workspace concerns without a returning-reader hierarchy;
- the current primary navigation is Learn, Tools, Calculate, Vault, and
  Community, with authentication controls changing by session;
- Vault expresses storage but does not yet establish the My Chart versus
  Collection distinction;
- Community is implemented as a public question surface, but its value is
  not the same as a personal reading destination;
- Weekly exists as a development-only content POC and data-shape foundation,
  not as a user route;
- Daily and Monthly have no implemented content surface.

These are architecture findings, not defects to fix in this task. The
current implementation remains the active behavior until a scoped
implementation task is approved.

## 5. Public Home and authenticated Home

### 5.1 Public Home goal

The public Home should help a new visitor move from curiosity to a clear
understanding of NatalNode and then to a chart-creation action:

~~~text
Public curiosity
    ↓
A clear explanation of what NatalNode does
    ↓
Evidence of a calm, trustworthy reading experience
    ↓
Create a chart
    ↓
Personal value after the reader supplies input
~~~

Public Home should not pretend that an unauthenticated reader already has
personal Today, Weekly, or Monthly authority. It may use public educational
content and public sky context where those are truthful and clearly scoped.

The public hierarchy is:

1. one clear promise;
2. one explanation of the product’s method and boundary;
3. one primary path to create a chart;
4. supporting Learn, Discover, and trust links;
5. no account-management or private-collection controls in the content body.

### 5.2 Authenticated Home goal

Authenticated Home should be a return surface, not merely the same acquisition
and input surface with an account attached.

The candidate hierarchy is:

1. identity and a quiet welcome;
2. Today, if authoritative and available;
3. This Week, as the primary deeper reading;
4. This Month, as broad context;
5. My Chart as the stable reference;
6. Collection as accumulated saved readings;
7. a restrained next action;
8. Account and privacy in utility navigation.

The default Home should not display every period in equal detail. It should
give the reader a small current orientation and make the next reading easy to
open.

### 5.3 Authenticated Home candidate hierarchy

~~~text
HOME
|
|-- Welcome / current context
|
|-- TODAY IN YOUR SKY
|     One useful sentence
|     One compact timing cue, when available
|     Open Today
|
|-- THIS WEEK
|     One-line weekly hook
|     Up to three meaningful themes in preview
|     Open This Week
|
|-- THIS MONTH
|     Broad context sentence
|     Open This Month
|
|-- MY CHART
|     Stable chart reference
|     Open My Chart
|
|-- COLLECTION
|     One or two recently kept items
|     Open Collection
|
+-- Utility menu
      Account
      Notifications
      Privacy
      Export
      Settings
      Sign out
~~~

The hierarchy intentionally gives the current reading more weight than
management surfaces. It also avoids putting a blank period block on the page:
if a period is unavailable or not yet authoritative, the surface should be
shortened or omitted according to the empty-state rules in Section 13.

### 5.4 Public and authenticated Home relationship

Public and authenticated Home may share a shell and visual language, but they
have different primary jobs:

| Surface | Primary question | Primary action | Secondary content |
| --- | --- | --- | --- |
| Public Home | What is NatalNode and can I begin? | Create a chart | Learn, Discover, methodology, trust |
| Authenticated Home | What is useful for me now? | Open a current reading | My Chart, Collection, Learn, utility |

The distinction should be semantic, not merely a different set of buttons.

## 6. Candidate navigation architecture

### 6.1 Candidate primary navigation

~~~text
Home · Today · This Week · This Month · My Chart · Relationships · Collection · Learn
~~~

This is a candidate target tree, not an instruction to rename the current
header in this task.

Recommended grouping:

- Home: return overview;
- Today, This Week, This Month: period reading group;
- My Chart: stable personal chart;
- Relationships: future relational reading pillar;
- Collection: saved editions, readings, or cards;
- Learn: public educational foundation.

### 6.2 Secondary and contextual navigation

The following should normally be secondary, contextual, or audience-specific:

- Tools: reference lookup and discovery;
- Discover: public exploration;
- Community: public participation;
- Practitioner: directory and contributor path;
- Public Share: linkable public cards;
- Methodology: trust and explanation.

They may be linked from relevant content, footer areas, or an expanded menu
without competing with the current reading hierarchy.

### 6.3 Utility navigation

Utility navigation should contain:

- Account;
- Notifications;
- Privacy;
- Export;
- Settings;
- Sign out;
- Feedback, where retained.

Utility controls should be reachable, keyboard accessible, and visually
quieter than the reading hierarchy. They should not be represented as
interpretive content cards.

### 6.4 Current-to-candidate mapping

| Current entry | Candidate role | Recommended disposition |
| --- | --- | --- |
| Learn | Learn | Keep primary and public. |
| Tools | Tools | Keep secondary/contextual. |
| Calculate | Create chart | Keep as the clear creation action; later complement with My Chart. |
| Vault | My Chart and/or Collection | Retain current name until Product Owner selects the split and migration language. |
| Community | Community | Move to secondary/contextual unless a separate decision promotes it. |
| Dynamic auth control | Utility | Keep dynamic identity behavior; do not make it a period-reading destination. |
| Discover | Discover | Link contextually from Learn, Tools, or relevant public content. |
| Practitioner | Practitioner | Keep audience-specific and future-oriented. |
| Share | Public Share / future personal share | Preserve current public-card semantics; future personal reading share is a separate decision. |

### 6.5 Primary navigation decision

The candidate target contains more labels than the current compact desktop or
mobile header can present at equal visual weight. The implementation must
eventually choose a grouping and responsive behavior. The product rule is:
period reading should be easy to find, but the first viewport must not become a
navigation dashboard.

## 7. Reading attention ladder

The attention ladder is the primary Weekly composition constraint.

### 7.1 Level 0: five-second read

Visible by default:

- Hero headline;
- one-sentence interpretation;
- one compact timing cue, when timing evidence exists.

The reader should understand the week’s dominant movement without opening
anything. Level 0 is not a metadata summary or a list of three signal names.

### 7.2 Level 1: thirty-second read

Visible by default after the Hero:

- up to three editorially grouped core themes;
- each theme has a short heading and a short explanation;
- the three themes are selected for meaning, not produced mechanically from
  the count of source Signals.

Level 1 should be readable without opening multiple accordions.

### 7.3 Level 2: one-to-three-minute read

Show only relevant domains:

- Love & Relationships;
- Work & Creation;
- Inner State;
- Decisions.

A domain section earns space only when it adds a practical meaning, a
different context, a meaningful action, or a distinct emotional relevance
that is not already present in the core theme. Empty domains are omitted.

### 7.4 Level 3: timeline

Timeline should make temporal structure easy to scan:

- day or day-group labels such as MON, TUE, WED, or MON–WED;
- one short explanation per meaningful window;
- a visible distinction between background and momentary evidence;
- no machine prose such as “The timeline marks this explicit window...”;
- no duplicated Best Window paragraph when the timeline already owns the
  same timing fact.

On mobile, timing may be stacked as labeled windows. On desktop, it may use a
compact day-group layout. The core content must not require horizontal
scrolling.

### 7.5 Level 4: Why this week?

Expandable detail may explain:

- why a theme is present;
- how two signals combine;
- what timing evidence supports the reading;
- why a domain was included or omitted;
- what is background versus a shorter moment.

Why this week? is explanatory content, not a duplicate summary.

### 7.6 Level 4 advanced: Astrologer’s View

Astrologer’s View is optional depth for readers who want a more technical or
professional perspective. It should remain collapsed by default and use
authoritative, reader-comprehensible language. It must not expose raw
governance terms merely to signal internal completeness.

### 7.7 Level 5: save, share, print, collect

Actions appear after the reader has received value:

- Save or Collect;
- Share;
- Print;
- return to My Chart or the relevant period.

Actions are not the Hero. The product should not lead with account status,
capacity, or a CTA without a meaningful reading.

## 8. Weekly reading architecture

### 8.1 Default Weekly page tree

~~~text
THIS WEEK
|
|-- Hero
|     Hook
|     One-sentence meaning
|     Compact timing cue, if available
|
|-- Main Theme
|     One dominant weekly idea
|
|-- Supporting Themes
|     Up to three grouped themes total
|
|-- Relevant domains
|     Love & Relationships
|     Work & Creation
|     Inner State
|     Decisions
|
|-- Timeline
|     MON ... SUN or meaningful day groups
|
|-- Why this week?
|
|-- Astrologer’s View (optional and collapsed)
|
+-- Save / Share / Print / Collect
~~~

The actual page may merge Main Theme and Supporting Themes into a single
editorial “themes” region when that reads more naturally. The tree is a
semantic guide, not a required number of visual containers.

### 8.2 Weekly composition rules

1. Choose one dominant idea for the Hero.
2. Compose themes from meaningfully related Signals.
3. Keep the default reading short enough to scan.
4. Show domains only when they add reader value.
5. Let Timeline own timing.
6. Use Why this week? for explanation, not repetition.
7. Keep Astrologer’s View optional.
8. Place actions after value.
9. Preserve unknown-time and authority constraints.
10. Do not promote DEVELOPMENT_ONLY POC output into a production claim.

### 8.3 Weekly semantic ownership map

| Semantic content | Default reader owner | Advanced/internal owner |
| --- | --- | --- |
| Dominant meaning | Hero / Main Theme | Source interpretation |
| Supporting meaning | Supporting Themes | Signal grouping evidence |
| Domain relevance | Relevant domain section | Domain mapping |
| Timing windows | Timeline | Timing evidence |
| Practical advice | Theme or relevant domain | Interpretation guidance |
| Background versus momentary distinction | Timeline or Why this week? | Temporal classification |
| Explanation of combination | Why this week? | Mixed-evidence reasoning |
| Technical rationale | Astrologer’s View | Authority/provenance detail |
| Signal ID / rule ID / fixture marker | Never default-visible | Internal-only |

### 8.4 Weekly information rhythm

~~~text
HOOK
  ↓
SUMMARY
  ↓
EXPLORE
  ↓
WHY
  ↓
SAVE / SHARE
~~~

This rhythm should be preserved across responsive layouts, print, and future
share-safe presentations. The medium may change the exact arrangement, but it
should not change the semantic order without a deliberate product reason.

## 9. Daily reading architecture

Daily is a lighter orientation, not a compressed Weekly report.

### 9.1 Daily default tree

~~~text
TODAY
|
|-- Hero
|     One immediate sentence
|     Compact timing cue when available
|
|-- One or two meaningful themes
|
|-- Practical note
|
|-- Watch Out, only when meaningful
|
|-- Why Today? (optional)
|
+-- Open This Week
~~~

The target reading time is approximately ten to thirty seconds by default.
Daily should answer what deserves attention now and provide a natural
continuity link to This Week.

### 9.2 Daily rules

- Do not show all weekly themes.
- Do not repeat a full domain report.
- Do not create empty Relationship, Work, Inner State, or Decision blocks.
- Do not render a timeline when the day has no meaningful timing evidence.
- Do not turn a single technical anchor into a machine-style daily log.
- Keep the action small: notice, open the week, or save a meaningful note.

## 10. Monthly reading architecture

Monthly is a broad context surface with its own editorial rhythm.

### 10.1 Monthly default tree

~~~text
THIS MONTH
|
|-- Hero / month thesis
|
|-- Three major periods
|     Early
|     Middle
|     Late
|
|-- Relationship
|
|-- Work / Creation
|
|-- Emotional / Inner State
|
|-- Action / Decision
|
|-- Lunar or other meaningful moments
|
|-- Reflection
|
+-- Collectible edition / save / share / print
~~~

The domains are conditional. A domain with no distinct meaning is omitted or
folded into the month thesis.

### 10.2 Monthly continuity

Monthly should explain the wider chapter and link into the current Week. It
must not be implemented as four Weekly reports or thirty Daily reports:

~~~text
MONTH: What larger pattern is unfolding?
  ↓
WEEK: Which chapter is active now?
  ↓
TODAY: What is the immediate moment?
~~~

Each period should have its own summary length, timing granularity, and
reflection behavior.

## 11. Visibility and progressive disclosure

### 11.1 Visibility levels

| Level | Default visibility | Examples |
| --- | --- | --- |
| Visible default | Always shown when supported by meaningful content | Hero, core themes, compact timeline |
| Expandable | Available without competing with the first read | Relevant domain detail, Why this week? |
| Advanced | User-invoked depth | Astrologer’s View, technical explanation |
| Internal-only | Never reader-facing by default | Signal IDs, rule IDs, provenance IDs, fixture markers, scientific internals |

### 11.2 Disclosure rules

- An accordion must contain a meaningful second layer, not a sentence that
  could have been included in the default read.
- The summary of a disclosure should make the hidden value legible.
- Disclosures should have semantic button names and correct expanded state.
- Closed content should not be treated as absent when it is needed for print
  or an accessibility reading mode; the medium may choose a different
  presentation.
- Advanced content must not imply that more technical language is more
  authoritative than the core reading.

### 11.3 Why this week? versus Astrologer’s View

Why this week? answers a normal reader’s question: why does this reading make
sense? Astrologer’s View answers an advanced reader’s question: what is the
technical framing behind it?

They should not be two versions of the same paragraph.

## 12. Dedupe and merge rules

Every visible block must earn its space by adding at least one of:

- a new meaning;
- a new context;
- a new timing distinction;
- a practical action;
- an explanation;
- emotional relevance.

If it adds none of these, merge it or omit it.

### 12.1 Known duplicate patterns

| Duplicate pattern | Rule |
| --- | --- |
| Hero and Action / Decision say the same thing | Keep the plain-language hook in Hero; move only new practical guidance into Action / Decision. |
| Timeline and Best Window repeat the same dates | Timeline owns the timing; Best Window becomes a compact highlight or is omitted. |
| Main Theme and domain paragraph repeat the same meaning | Keep the theme summary; retain the domain only if it adds a distinct life context or action. |
| Watch Out repeats a conflict already explained | Keep one concise caution at the point where the reader can use it. |
| Three source Signals become three identical cards | Group them into one editorial theme when the reader experiences them as one idea. |
| Empty domain placeholders create symmetry | Omit the empty domain and allow an asymmetrical but honest page. |
| Astrologer’s View repeats the consumer summary | Use it for new technical context only; otherwise omit it. |

### 12.2 Block ownership

One fact or meaning should have one primary visible owner. Links or references
may point back to the owner, but the same prose should not be copied into
multiple blocks.

### 12.3 Length targets

These are product guardrails, not lint rules:

| Block | Target |
| --- | --- |
| Hero | One short sentence |
| Core theme | Short heading plus one concise sentence |
| Domain detail | One to three short paragraphs maximum |
| Timeline item | One sentence per meaningful window |
| Watch Out | One concise caution |
| Best Window | One concise highlight, or omit when Timeline already owns it |
| Share | Headline plus one or two short lines |
| Astrologer’s View | Expandable depth; length follows useful explanation |

## 13. Empty, thin, and constrained readings

### 13.1 General rule

Content should become shorter when evidence is thin. It should not become more
decorated to disguise the lack of material.

When a section has no meaningful content:

- omit it;
- merge it into a neighboring section only if it adds meaning;
- state a useful limit when the limit matters;
- never invent a matching section to preserve visual symmetry.

### 13.2 Thin Weekly

A thin week may contain only:

~~~text
Hero
  ↓
One meaningful theme
  ↓
One timing cue, if supported
  ↓
Why this week?, if it adds explanation
  ↓
Save / Share
~~~

This is a valid reading. It is preferable to a padded report.

### 13.3 No timing evidence

When timing evidence is absent:

- do not render a fabricated Timeline;
- do not show Best Window;
- do not phrase background meaning as a precise event;
- keep stable meaning visible;
- explain the limitation in human language only where useful.

### 13.4 Unknown birth time

Unknown birth time should be handled humanely:

- lead with the value that remains available;
- do not lead with a technical failure statement;
- omit time-dependent houses and angles when they cannot be supported;
- do not imply that omitted material was calculated;
- state the boundary in a short, non-alarming explanation;
- preserve the reader’s next useful action.

The reader should encounter “Here is what can still be read from the
available information” before an internal description of what is unavailable.

## 14. Desktop reading behavior

### 14.1 Editorial desktop

Desktop should provide:

- an editorial maximum reading width;
- generous whitespace around the dominant Hero;
- a clear vertical reading spine;
- restrained supporting columns only where they reduce cognitive load;
- a timeline that can be scanned without becoming a data table;
- a side context rail only when it provides persistent useful context.

More columns do not mean more hierarchy. Avoid a wall of equally weighted
cards.

### 14.2 Desktop hierarchy

~~~text
                     [quiet utility]

        [Hero and current reading spine]

        [Core themes with editorial emphasis]

        [Relevant domains]       [compact context]

        [Timeline across the reading width]

        [Why] [Astrologer’s View, collapsed]

        [Save] [Share] [Print] [Collect]
~~~

The center of gravity remains the reading spine. Utility and technical
context should not pull the eye away from it.

## 15. Mobile reading behavior

### 15.1 Mobile constraints

The primary mobile range is 320–430px. The layout must be usable one-handed.

Mobile rules:

- put the first useful value in the first viewport;
- keep the Hero and first timing cue together when timing exists;
- use short headings with strong information scent;
- use a single vertical reading order;
- prevent horizontal overflow;
- use disclosure only where it removes real density;
- do not require the reader to open every block to understand the week;
- keep metadata quieter than meaning;
- avoid a dashboard of equal cards;
- preserve visible focus and a clear target size.

### 15.2 Mobile order

~~~text
Header
  ↓
Hero
  ↓
One-line timing cue
  ↓
Core themes
  ↓
Relevant domain(s)
  ↓
Timeline windows
  ↓
Why this week?
  ↓
Astrologer’s View
  ↓
Save / Share / Print / Collect
~~~

If the screen is short or content is thin, later levels may remain collapsed
or be omitted without changing the meaning of the first read.

### 15.3 Mobile menu

The compact header should group period reading destinations rather than show
all implementation surfaces as an undifferentiated list. Account and privacy
remain in the utility path. This is a target information architecture
decision, not a change to the current header in this task.

## 16. Print behavior

Print is a different medium, not a screenshot of the web page.

### 16.1 Print target

Target length: approximately two to four pages for a substantial Weekly
edition, with shorter output for thin content.

Candidate print order:

~~~text
Page 1: Cover / Hero / dominant theme
Page 2: Supporting themes / relevant domains
Page 3: Timeline / Watch Out / Best Window where meaningful
Page 4: Why this week? / Astrologer’s appendix / signature / footer
~~~

The exact pagination should follow content length. Empty blocks are omitted.

### 16.2 Print rules

- remove screen navigation and account controls;
- retain a clear title, period, and identity;
- preserve heading hierarchy;
- make timing legible in grayscale and color;
- include useful expanded explanations that would otherwise be collapsed;
- keep technical appendix optional and clearly labeled;
- keep source/provenance internals out of ordinary print unless a separate
  owner-approved report contract exists;
- provide a stable footer and NatalNode identity;
- do not print a system status dashboard.

## 17. Share behavior

Share is an editorial adaptation, not a compressed full report.

### 17.1 Share contract

A share-safe Weekly card should contain:

~~~text
One hook
  ↓
One useful insight
  ↓
Optional second line
  ↓
NatalNode identity
  ↓
natalnode.com
~~~

Recommended social ratio: 4:5 when a social image is needed.

### 17.2 Share rules

- preserve independent social value even when detached from the product;
- do not expose private birth input, account identity, or internal authority
  metadata;
- do not use profile count, capacity, or system status as the main message;
- do not turn a CTA-only card into a share card;
- do not copy the entire Weekly report into a small image;
- keep the reader-facing prose consistent with the authoritative reading;
- keep the current public sign, match, and elements-and-modes Share surfaces
  semantically separate from a future personal Weekly share.

## 18. Astrologer’s View and technical depth

Astrologer’s View is a professional-depth layer, not a second product.

It may contain:

- a more precise interpretation of the dominant configuration;
- the relevant timing or background distinction;
- a concise explanation of mixed evidence;
- technical framing that helps an experienced reader follow the reading.

It must not:

- expose raw internal identifiers as a substitute for explanation;
- imply that a fixture is scientific authority;
- present incomplete research metadata as a production guarantee;
- use governance phrases such as “approved technical anchor” in ordinary
  consumer prose unless that phrase is independently useful and approved;
- assert precision that the authority layer does not support.

Technical depth remains subordinate to the human reading.

## 19. Collection and My Chart

### 19.1 My Chart

My Chart is the stable personal reference surface:

- the saved or active natal chart;
- chart workspace and interpretation entry;
- stable input context;
- a path back to current readings.

It should not become a chronological warehouse of every reading.

### 19.2 Collection

Collection is a future retention surface for things the reader has chosen to
keep:

- Weekly editions;
- Monthly editions;
- meaningful share-safe cards;
- saved explanations or reading moments, if later approved.

Collection should feel like “things I have accumulated,” not merely a database
record list. It must retain provenance and ownership semantics from the
authoritative persistence model, but this document does not implement those
semantics.

### 19.3 Vault transition boundary

The current Vault implementation is a useful saved-chart surface with
capacity and ownership rules. It should not be silently renamed or repurposed
in this task. The My Chart versus Collection distinction requires a Product
Owner decision about:

- whether Vault remains a technical/storage-facing term;
- whether My Chart becomes a reader-facing alias;
- whether Collection stores period editions separately;
- how existing saved chart records map to the future language.

## 20. Relationships

Relationships is a future product pillar, not an empty primary destination.

Candidate future areas:

- Love Style;
- Compatibility;
- Saved Comparisons.

Do not make Relationships primary before the underlying authority, privacy,
comparison semantics, and completeness are mature enough to support the
promise. A future relationship surface must not be a generic feed or a
placeholder with empty symmetric cards.

## 21. User journeys

### Journey A — New public reader

~~~text
Search or social entry
  ↓
Public Learn / Discover / content explanation
  ↓
Understand NatalNode’s boundary and value
  ↓
Create a chart
  ↓
Receive personal value
~~~

Success condition: the reader understands what they are receiving before
being asked for account or utility actions.

### Journey B — Returning daily reader

~~~text
Home
  ↓
Today
  ↓
One useful insight
  ↓
Optional This Week
~~~

Success condition: the reader gets orientation quickly and is not forced
through a full report.

### Journey C — Weekly reader

~~~text
Home
  ↓
This Week
  ↓
Scan Hero and core themes
  ↓
Explore relevant domains
  ↓
Read Timeline
  ↓
Save / Share / Collect
~~~

Success condition: the reader can stop at any attention level without losing
the week’s dominant meaning.

### Journey D — Power reader

~~~text
This Week
  ↓
Why this week?
  ↓
Astrologer’s View
  ↓
My Chart
~~~

Success condition: depth is available without making every reader parse
technical detail.

### Journey E — Collector

~~~text
This Month
  ↓
Edition or meaningful reading
  ↓
Collect
  ↓
Collection
~~~

Success condition: saved material has a reason to exist and can be revisited
as a human-readable edition.

### Journey F — Utility reader

~~~text
Avatar or menu
  ↓
Account
  ↓
Privacy / Export / Settings
~~~

Success condition: utility controls are easy to reach but do not interrupt
the reading hierarchy.

## 22. Current route and component impact

The matrix below distinguishes an information-architecture implication from
an authorized implementation change.

| Surface | Current implementation role | Impact classification | Bounded implication |
| --- | --- | --- | --- |
| Home / root | Calculate-first BirthInput and ChartExperience, with Public Sky context | CONTENT_RESTRUCTURE_CANDIDATE | Future authenticated Home may need a return-reading hierarchy; do not change now. |
| Chart / chart workspace | Chart instrument, interpretation, details, save context | UNCHANGED | Preserve chart workspace hierarchy and authority boundary. |
| Vault / vault chart | Saved chart list and saved chart detail | NAV_REPOSITION_CANDIDATE | Evaluate My Chart versus Collection language; do not migrate now. |
| Learn | Editorial learning hub, Foundations, articles, methodology | UNCHANGED | Continue to serve public learning and explain the product. |
| Discover | Public zodiac, sign match, elements and modes exploration | NAV_REPOSITION_CANDIDATE | Keep contextual/public; do not make it a period-reading substitute. |
| Community | Public questions and Ask Question flow | NAV_REPOSITION_CANDIDATE | Re-evaluate primary placement after core reading navigation is established. |
| Practitioner | Directory and application path | FUTURE_INTEGRATION | Keep audience-specific; no primary-reader promise yet. |
| Account | Authenticated management, privacy, export, print/share, deletion | UNCHANGED | Keep utility boundary; do not fold into Home content. |
| Share | Public static cards plus private account presentation utilities | FUTURE_INTEGRATION | Future personal Weekly share must have its own contract. |
| Tools | Reference lookup hub | NAV_REPOSITION_CANDIDATE | Keep secondary/contextual and information-scented. |
| Current Sky | Public sky context and development route | NO_ACTION | Do not label the existing public/dev surface as personal Today authority. |
| Localization wrappers | Canonical and locale-specific versions of current routes | UNCHANGED | Preserve locale delivery and current language architecture. |

### 22.1 Route gaps

The candidate mental model has no current direct routes for:

- Today;
- This Week;
- This Month;
- Collection;
- Relationships;
- a separate authenticated Home.

The absence of these routes is expected at this architecture stage. A route
task must follow the wireframe and authority decisions; it must not be
created as speculative scaffolding.

### 22.2 Component boundaries

The current components should remain the owners of their existing behavior:

- SiteLayout owns shell, header, footer, and shared utility navigation;
- ChartExperience owns the calculate boundary and current chart flow;
- ChartWorkspace owns chart/interpretation/details presentation;
- Learn owns editorial learning content;
- Vault owns saved chart list/detail behavior;
- Account owns privacy and account controls;
- Share owns current public share-card semantics.

Future period-reading components should not be inferred from the existing
field model or bolted onto an unrelated owner merely to reuse a visual card.

## 23. Weekly POC information-density mapping

The five accepted POC scenarios are source evidence for composition rules.
They remain DEVELOPMENT_ONLY. The mapping below describes where meaning would
be read and which repeated blocks should be removed or hidden; it does not
rewrite or replace the actual POC prose.

### Scenario A — Supportive Communication

| Reading level | Composition |
| --- | --- |
| Level 0: five seconds | Hero focused on supportive communication, with the earliest meaningful timing cue if available. |
| Level 1: thirty seconds | One communication theme plus a concise practical direction; do not make every source Signal a separate theme. |
| Level 2: one to three minutes | Communication and Action / Decision only when each adds a distinct context; omit empty relationship or emotional sections. |
| Level 3: timeline | Labeled day or day-group windows; Timeline owns the timing. |
| Advanced | Why this week? can explain the supportive combination; Astrologer’s View may retain technical context. |
| Dedupe action | Merge any repeated action sentence into the communication theme; make Best Window a compact timeline highlight or omit it; keep source and provenance identifiers internal. |

### Scenario B — Mixed Relationship

| Reading level | Composition |
| --- | --- |
| Level 0: five seconds | Hero states the mixed relationship movement and one useful timing cue. |
| Level 1: thirty seconds | One relationship theme that holds warmth and friction together rather than two competing relationship cards. |
| Level 2: one to three minutes | Love & Relationships adds a distinct practical meaning; Watch Out appears once if it adds a usable caution. |
| Level 3: timeline | Show separate labeled windows only when the overlap or change in tone is meaningful. |
| Advanced | Why this week? can explain mixed evidence; Astrologer’s View may explain the technical contrast. |
| Dedupe action | Merge repeated relationship summary prose; let Timeline own dates; omit a second Best Window or Watch Out block when it repeats the same tension. |

### Scenario C — Action vs Emotional Tension

| Reading level | Composition |
| --- | --- |
| Level 0: five seconds | Hero names the tension in ordinary language and gives the first actionable cue when supported. |
| Level 1: thirty seconds | Group Action / Decision and Inner State as two complementary themes, not a generic positive/negative split. |
| Level 2: one to three minutes | Action / Decision and Inner State are relevant only if each provides new guidance or emotional context. |
| Level 3: timeline | Make the early action window and later emotional window scanable and distinct. |
| Advanced | Why this week? explains the trade-off; Astrologer’s View may explain the supplied anchors. |
| Dedupe action | Do not repeat the same tension in Hero, Action, and Watch Out; keep one caution at the place where it changes a decision. |

### Scenario D — Background + Momentary

| Reading level | Composition |
| --- | --- |
| Level 0: five seconds | Hero leads with the durable background movement and a short momentary cue only if it changes the week’s use. |
| Level 1: thirty seconds | Work / Creation and Action / Decision may form the core themes when they represent different uses of the evidence. |
| Level 2: one to three minutes | Domain sections distinguish background support from a shorter moment; do not repeat the same temporal distinction in every paragraph. |
| Level 3: timeline | Show a broad MON–SUN background and a clearly labeled shorter window, such as a later day group, when authoritative. |
| Advanced | Why this week? explains the background/momentary relationship; Astrologer’s View may provide technical framing. |
| Dedupe action | Timeline owns the distinction; Best Window is a compact pointer or omitted; do not create a separate background card and momentary card when one narrative is clearer. |

### Scenario E — Unknown Birth Time

| Reading level | Composition |
| --- | --- |
| Level 0: five seconds | Hero presents the available placement-level or stable meaning without leading with a technical limitation. |
| Level 1: thirty seconds | One or two supported themes that remain useful; no forced three-theme symmetry. |
| Level 2: one to three minutes | Show only domains with real additional value; omit time-dependent houses and angles. |
| Level 3: timeline | Omit when timing cannot be supported; do not use a generic placeholder. |
| Advanced | Why this week? can explain the available boundary in humane language; technical depth remains optional. |
| Dedupe action | Remove Timeline, Best Window, and Watch Out when unsupported; do not repeat the unknown-time limitation in every block; keep unavailable scientific details out of the reader default. |

### 23.1 POC composition conclusion

Across A–E, the POC supports the following product rules:

- a week may have fewer than three visible themes;
- mixed evidence belongs in one readable theme when that is how the person
  experiences it;
- timing belongs to a timeline, not to every block;
- background versus momentary evidence should be explained once;
- unknown time changes what is shown, not merely how it is labeled;
- advanced technical depth should be optional;
- the same POC prose should not be copied into every semantic destination.

No conclusion above changes the POC’s development-only status.

## 24. Visual hierarchy

The approved visual baseline remains:

NATALNODE VISUAL V1.1 FUNCTIONAL BASELINE = APPROVED

### 24.1 Product expression

The reading surface should feel like:

- modern observatory;
- editorial intelligence;
- a premium report;
- calm, precise, and human.

It should not feel like:

- a SaaS dashboard;
- a telemetry panel;
- a dense analytics wall;
- a collection of equal-weight cards;
- a technical debug surface.

### 24.2 Hierarchy rules

- one dominant Hero per reading surface;
- one clear vertical reading spine;
- restrained borders and surfaces;
- editorial whitespace;
- limited accent color reserved for meaning and actions;
- a deliberate type scale;
- high contrast for primary text;
- quieter metadata;
- no equal-weight card wall;
- no visual treatment that makes a technical detail compete with the reading.

### 24.3 Responsive visual relationship

Desktop can use whitespace and a quiet context rail. Mobile should collapse to
one reading spine. Both must preserve the same semantic priority:

~~~text
meaning > context > explanation > technical detail > utility
~~~

## 25. Accessibility and inclusive reading

The architecture must preserve the existing accessibility direction and make
it explicit for future reading surfaces.

### 25.1 Structure

- use one primary h1 for each page;
- use heading levels in reading order;
- use landmarks for header, main, complementary context, and footer;
- do not use visual size as a substitute for semantic hierarchy;
- label period and domain sections clearly.

### 25.2 Interaction

- use real buttons for disclosure controls;
- expose aria-expanded and aria-controls accurately;
- make all actions keyboard reachable;
- preserve visible focus indicators;
- keep focus order aligned with reading order;
- do not hide a core meaning behind a hover-only interaction;
- ensure print and share actions have clear labels.

### 25.3 Perception

- meet contrast requirements in light and dark themes;
- do not communicate timing, intensity, or direction by color alone;
- pair accents with text, labels, or structure;
- support text enlargement without clipping;
- preserve reading order at 320px;
- respect prefers-reduced-motion for any future ambient or timeline motion.

### 25.4 Content accessibility

- write headings with information scent;
- keep sentences short enough to scan;
- avoid unexplained internal terms;
- describe a limitation without blaming the reader;
- ensure the reading remains useful when color, motion, or a visual chart is
  unavailable.

## 26. Low-fidelity wireframes

These wireframes show reading priority and information scent only. They are not
component specifications, CSS instructions, or implementation authorization.

### 26.1 Authenticated Home — mobile

Target width: 320–430px. The first viewport contains the current value, not a
full dashboard.

~~~text
+--------------------------------+
| NATALNODE                 [≡] |
+--------------------------------+
| HOME                          |
| Good morning                  |
|                               |
| TODAY IN YOUR SKY             |
| One useful sentence about     |
| what deserves attention now.  |
| A compact timing cue          |
| [Open Today]                  |
|                               |
| THIS WEEK                     |
| One-line hook for the current |
| chapter.                      |
| [Open This Week]              |
|                               |
| [This Month]   [My Chart]     |
|                               |
| COLLECTION                    |
| One or two recently kept      |
| readings, if any.             |
| [Open Collection]             |
+--------------------------------+
| menu: Account · Privacy       |
|       Export · Settings       |
+--------------------------------+
~~~

Mobile notes:

- the current reading is above collection and utility;
- empty periods are omitted rather than rendered as blank cards;
- the menu contains the full candidate navigation and utility groups;
- no side-by-side card grid is required;
- the content remains readable without horizontal movement.

### 26.2 Authenticated Home — desktop

Target: editorial maximum width with a quiet utility area.

~~~text
+----------------------------------------------------------------------------+
| NATALNODE   Home  Today  This Week  This Month  My Chart  Collection  Learn |
|                                                            Account       [ ] |
+----------------------------------------------------------------------------+
|                                                                            |
|                 HOME / current context                                     |
|                                                                            |
|       TODAY IN YOUR SKY                                                    |
|       One useful sentence that answers what matters now.       [Open Today] |
|       Compact timing cue, when authoritative.                              |
|                                                                            |
|       THIS WEEK                                                            |
|       Weekly hook and a small preview of meaningful themes. [Open This Week]|
|                                                                            |
|       +--------------------------+    +-------------------------------+    |
|       | THIS MONTH               |    | MY CHART                      |    |
|       | Broad context            |    | Stable reference              |    |
|       | [Open This Month]        |    | [Open My Chart]               |    |
|       +--------------------------+    +-------------------------------+    |
|                                                                            |
|       COLLECTION                                                           |
|       Recently kept editions or readings.                  [Open Collection] |
|                                                                            |
+----------------------------------------------------------------------------+
~~~

Desktop notes:

- the reading spine remains dominant;
- the lower support blocks are subordinate, not equal dashboard tiles;
- account, notification, privacy, export, settings, and sign out stay in
  utility;
- the actual number of preview blocks is conditional on available content.

### 26.3 Weekly reading — mobile

Target width: 320–430px, content-first.

~~~text
+--------------------------------+
| THIS WEEK                 [•••]|
| 08–14 SEP                      |
|                                |
| A clear one-line hook for the |
| week’s main movement.          |
|                                |
| Timing: strongest around      |
| THU–FRI, when supported.      |
|                                |
| THE MAIN THEME                |
| Short plain-language meaning. |
|                                |
| SUPPORTING THEMES             |
| 1. Short meaningful theme     |
| 2. Short meaningful theme     |
| 3. Optional, only if useful   |
|                                |
| IN YOUR LIFE                  |
| Love & Relationships          |
| Short additional context.    |
|                                |
| TIMELINE                     |
| MON–WED  Background movement  |
| THU–FRI  Meaningful window    |
| SAT–SUN  No block if empty    |
|                                |
| [Why this week?  >]           |
| [Astrologer’s View  >]        |
|                                |
| [Save] [Share] [Print]        |
| [Collect]                     |
+--------------------------------+
~~~

The mobile wireframe intentionally allows the domain area, Watch Out, or Best
Window to disappear when they repeat another block or lack evidence.

### 26.4 Weekly reading — desktop

~~~text
+----------------------------------------------------------------------------+
| NATALNODE     Home  Today  This Week  This Month  My Chart  Collection Learn|
|                                                                      [menu] |
+----------------------------------------------------------------------------+
|                                                                            |
|                         THIS WEEK                                         |
|                         08–14 SEP                                         |
|                                                                            |
|                 A clear one-line hook for the week’s main movement.         |
|                 Strongest around THU–FRI, when supported.                  |
|                                                                            |
|                 THE MAIN THEME                                             |
|                 Short plain-language meaning.                              |
|                                                                            |
|                 SUPPORTING THEMES                                          |
|                 +----------------+ +----------------+ +----------------+   |
|                 | Theme one      | | Theme two      | | Optional three |   |
|                 | short meaning  | | short meaning  | | only if useful  |   |
|                 +----------------+ +----------------+ +----------------+   |
|                                                                            |
|                 IN YOUR LIFE                     CONTEXT                   |
|                 Work / Creation                   Quiet metadata only      |
|                 Short new meaning.                                          |
|                 Inner State                       No equal-weight panel    |
|                 Short new meaning.                                          |
|                                                                            |
|                 TIMELINE                                                    |
|                 MON–WED       background movement                           |
|                 THU–FRI       meaningful window                             |
|                 SAT–SUN       omitted if empty                              |
|                                                                            |
|                 [Why this week?]     [Astrologer’s View, collapsed]         |
|                                                                            |
|                 [Save] [Share] [Print] [Collect]                            |
+----------------------------------------------------------------------------+
~~~

Desktop notes:

- the Hero has one dominant alignment and generous whitespace;
- the context area is quiet and can be removed if it adds no reader value;
- domain sections are editorially grouped and conditional;
- Timeline is the only owner of repeated timing facts.

### 26.5 Weekly reading — print

~~~text
PAGE 1
  NatalNode
  THIS WEEK · date range
  Dominant weekly hook
  Main Theme

PAGE 2
  Supporting Themes
  Relevant domain insights only

PAGE 3
  Timeline: MON ... SUN or meaningful day groups
  Watch Out and Best Window only when distinct and useful

PAGE 4, if needed
  Why this week?
  Astrologer’s View appendix
  Signature / NatalNode footer / natalnode.com
~~~

Print removes screen navigation and utility controls. It opens useful
disclosures, omits empty blocks, and preserves the same meaning-first order.

### 26.6 Weekly reading — share card

~~~text
+---------------------------+
| NATALNODE                 |
|                           |
| One short hook that has   |
| value outside the app.    |
|                           |
| One useful insight.       |
| Optional second line.     |
|                           |
| natalnode.com             |
+---------------------------+
~~~

The share card is a 4:5-oriented editorial excerpt, not a miniature report.
It contains no private birth input, account state, capacity, internal IDs, or
technical provenance.

## 27. Product Owner decision register

The decisions below are the only material direction choices required before
the next design boundary. Each includes a recommendation, an alternative, and
the product consequence.

### Decision 1 — Should period reading be primary navigation?

Recommendation: make Home, Today, This Week, and This Month the core return
navigation for authenticated readers, with Learn retained as the main public
learning entry.

Alternative: retain Calculate, Learn, Tools, Vault, and Community as the
primary navigation model.

Product consequence: the recommendation gives returning readers stronger
information scent and makes the period hierarchy real. It requires future
route and Home work. The alternative preserves current implementation cost but
keeps acquisition and recurring reading mixed in one navigation model.

### Decision 2 — How should Vault, My Chart, and Collection relate?

Recommendation: retain the current Vault behavior until a future migration
task, while adopting the conceptual distinction that My Chart is the stable
personal chart and Collection is accumulated readings or editions.

Alternative: rename Vault directly to My Chart or Collection and migrate all
saved records under one reader-facing term.

Product consequence: the recommendation avoids semantic churn and preserves
the current persistence boundary, but requires a later naming and migration
decision. The alternative is simpler to explain if the data model remains
single-purpose, but risks losing the distinction between an active chart and
saved reading editions.

### Decision 3 — Should Community be primary?

Recommendation: keep Community secondary or contextual until it proves a core
returning-reader role.

Alternative: keep Community in the primary nav beside period reading.

Product consequence: the recommendation protects the reading-first hierarchy
and keeps public participation available without making it the default
personal destination. The alternative may improve question discovery but
competes for limited primary navigation space.

### Decision 4 — Should Relationships be primary before maturity?

Recommendation: reserve Relationships as a future primary pillar, but do not
promote it before authority, privacy, comparison semantics, and useful content
are complete.

Alternative: expose Relationships in primary navigation immediately with
placeholder or limited capability.

Product consequence: the recommendation avoids a high-scent empty destination
and prevents a premature promise. The alternative creates earlier discovery
but increases the risk of an incomplete or misleading product surface.

### Decision 5 — Should public horoscope content be a primary destination?

Recommendation: treat public horoscope-style content as an acquisition and
learning path through Learn, Discover, and share-safe public content, not as
the primary authenticated period-reading destination.

Alternative: make public horoscope content the main Home or primary navigation
entry.

Product consequence: the recommendation keeps public discovery useful while
protecting the distinction between public content and personal authoritative
reading. The alternative may improve search-oriented entry but can blur the
product boundary and the user’s personal return path.

### Decision 6 — Should Home be one shared root?

Recommendation: allow public and authenticated experiences to share a shell,
but give them distinct semantic hierarchies: public Home for understanding and
starting, authenticated Home for current personal value.

Alternative: keep one Calculate-first root for all sessions.

Product consequence: the recommendation gives returning readers a reason to
come back and makes period navigation meaningful. The alternative minimizes
route complexity but leaves the authenticated mental model underdeveloped.

### 27.1 Decision gate

No decision above authorizes implementation by itself. A future implementation
task should name the decisions it relies on and should not silently resolve an
unselected alternative.

## 28. Current POC content coverage

This table measures whether the accepted development POC contains enough
semantic material to inform a future block. It does not grade the prose,
visual readiness, production authority, or editorial quality.

| Future Weekly block | POC coverage | Reading-architecture consequence |
| --- | --- | --- |
| Hero headline | ENOUGH_FOR_POC | Use one dominant hook; do not expose all source Signals at Level 0. |
| Weekly overview | ENOUGH_FOR_POC | Treat as a short orientation, not a second full report. |
| Three core themes | ENOUGH_FOR_POC | Support up to three grouped themes; fewer is valid when evidence is thin. |
| Relationship | THIN | Include only for scenarios with distinct relationship meaning. |
| Work / Creation | ENOUGH_FOR_POC | Include conditionally when it adds practical context. |
| Emotional / Inner State | ENOUGH_FOR_POC | Include conditionally and keep it distinct from a duplicated mood summary. |
| Action / Decision | ENOUGH_FOR_POC | Make it practical and merge it with a core theme when it repeats. |
| Timeline | ENOUGH_FOR_POC | Let labeled timing windows own temporal information. |
| Watch Out | THIN | Show only when it adds a usable caution not already stated. |
| Best Window | THIN | Use as a compact highlight or omit when Timeline already owns the same timing. |
| Astrologer’s View | ENOUGH_FOR_POC | Keep as optional depth; do not make it a default reading layer. |
| Signature line | ENOUGH_FOR_POC | Preserve as a possible closing or share-safe identity element. |
| Share card | ENOUGH_FOR_POC | Adapt independently to a short hook-plus-insight card; do not compress the full report. |

Coverage is conditional. A block being ENOUGH_FOR_POC does not mean that every
scenario should render it, and THIN does not mean the POC is defective. Both
labels are composition inputs for the next wireframe task.

## 29. Implementation sequencing after admission

The architecture admits the following order:

1. Product Owner confirms the material decisions in Section 27.
2. Produce low-fidelity Weekly UX wireframes using the reading ladder and the
   actual five-scenario POC evidence.
3. Define a bounded content composition contract that maps authority input to
   the content tree without copying the authority tree into the UI.
4. Define the period navigation and authenticated Home boundary.
5. Implement a separately scoped Weekly reading surface.
6. Add Daily, Monthly, Collection, or Relationships only through their own
   bounded tasks and authority gates.

The exact next task is:

WEB-P2-WEEKLY-UX-WIREFRAME-001 — Produce low-fidelity Weekly reading
wireframes from the admitted Human Reading First architecture.

Do not begin Weekly implementation from this document alone.

## 30. Evidence and source recovery

This architecture was recovered against the repository’s current state and the
following authoritative project materials:

- docs/PRD.md;
- docs/ARCHITECTURE.md;
- docs/architecture/NATALNODE_INTERPRETATION_SYSTEM_V1.md;
- docs/architecture/NATALNODE_WEB_PRODUCT_ARCHITECTURE_V2.md;
- docs/design/NATALNODE_VISUAL_SYSTEM_V1.md;
- docs/design/NATALNODE_BRAND_SYSTEM_V1.md;
- docs/research/weekly-signal-poc/WEEKLY_SIGNAL_POC_REVIEW.md;
- docs/research/weekly-signal-poc/scenario-a.md;
- docs/research/weekly-signal-poc/scenario-b.md;
- docs/research/weekly-signal-poc/scenario-c.md;
- docs/research/weekly-signal-poc/scenario-d.md;
- docs/research/weekly-signal-poc/scenario-e.md;
- current route, layout, feature, and content source under apps/web/src/.

The repository’s existing implementation, not a future target diagram, remains
the authority for what is currently shipped. The POC files remain the
authority for the actual generated scenario prose. This document deliberately
does not reproduce or rewrite that prose.

The accepted boundaries remain:

- NatalNode.com → Website API / BFF → NatalNode Engine Public API;
- no provider-specific implementation in the web content layer;
- no scientific calculation or timezone behavior in this architecture task;
- no fixture promotion into authoritative product state;
- no provider decision is made here.

## 31. Admission summary

The admitted product architecture is:

~~~text
Authority
  Engine Facts → Signals → Interpretation → Provenance

Human reading
  Hero → Themes → Relevant domains → Timeline → Why → Advanced depth

Reader navigation
  Home → Today / Week / Month → My Chart / Relationships / Collection → Learn

Utility
  Account / Notifications / Privacy / Export / Settings / Sign out
~~~

The most important behavioral rule is:

HUMAN READING FIRST

The strongest current next-step evidence is the Weekly POC plus the current
editorial visual system. The correct next product-design boundary is a
wireframe, not a route or UI implementation.

CONTENT_UX_ARCHITECTURE_ADMITTED
MODULE_PASS
READY_FOR_WEEKLY_UX_WIREFRAME
NOT_IMPLEMENTED
WEEKLY_POC_REMAINS_DEVELOPMENT_ONLY
