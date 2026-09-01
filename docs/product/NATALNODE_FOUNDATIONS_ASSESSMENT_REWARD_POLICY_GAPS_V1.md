# NatalNode Foundations V1 Assessment and Reward Policy Gaps

Status: BOUNDED PRODUCT-OWNER DECISION SURFACE

Task: `WEB-LEARN-011`

Reviewed implementation baseline: `93ad7be` (`feat: admit multilingual Foundations assessments`)

This document records the remaining policy and authority decisions after the
Foundations final assessment was admitted across all seven frozen locales. It
is not an attempt schema, API contract, migration plan, entitlement grant
implementation, or reward policy. No values below should be treated as
production behavior until the relevant contract is explicitly frozen.

## 1. Frozen facts

- Course identity is `foundations.v1`; the assessment identity is
  `foundations.v1.final_check`, revision `1`.
- The final assessment has exactly 10 questions, passes at `8/10`, and permits
  unlimited retries.
- The approved/current/runtime-available locales are `en`, `es`, `fr`, `de`,
  `ja`, `ko`, and `zh-Hant`.
- Canonical English question IDs, option IDs, correct-answer IDs, and lesson
  links remain authoritative. Localized artifacts provide presentation text
  only; no locale may redefine assessment identity or answer authority.
- The assessment has no birth-data, chart, astronomy, provider, Engine, or
  Core-completion dependency. It does not create certification, leaderboard,
  XP, paid retries, or any other progression product.
- An assessment pass by itself does not issue a reward.
- Reward eligibility, if later implemented, requires authentication, all 12
  Foundations lessons completed, a final assessment score of at least `8/10`,
  and no more than one reward for an account and course version.
- The approved reward value is seven days of the existing appropriate standard
  paid NatalNode entitlement. No new tier is authorized.
- `LEARNING_FOUNDATIONS_V1` is a conceptual source identity only. It is not a
  production entitlement enum or persisted source value.

## 2. Implemented admission boundary

- All seven final-assessment content artifacts are marked `APPROVED`,
  `CURRENT`, and `AVAILABLE`; the six localized artifacts retain adaptation
  revision `1`.
- The web runtime statically maps each supported locale to its own approved
  assessment and verifies canonical question, option, answer, and lesson-link
  identity at load time.
- A localized assessment that is not approved, current, and available is
  unavailable at runtime. It is never silently replaced with English.
- `?contentLocale=en` is an explicit English-content view and does not change
  the route locale or UI locale.
- The current result is a browser-memory result. It is not account authority,
  server progress, reward eligibility, or a persisted attempt.

## 3. Unresolved decision set

### 3.1 Authoritative attempt boundary

The repository has no frozen assessment attempt API, persistence schema, or
server assessment runtime. The owner must choose whether a future attempt is:

1. Browser-only. This keeps the current lightweight learning experience and
   leaves reward issuance blocked.
2. A server-accepted, authenticated, append-only attempt. This can provide a
   reward-grade pass, but requires an explicit request/response contract,
   authentication rule, attempt identity, timestamp authority, retained answer
   fields or answer fingerprint, revision binding, retry/history semantics,
   and replay/idempotency behavior.
3. Another explicitly specified authority model.

No option is implemented here. Any server option must score from authoritative
answer IDs rather than client-provided score or pass flags.

### 3.2 Authenticated lesson-progress authority

Current lesson completion is browser-local and is not proof of authenticated
completion of all 12 lessons. The owner must choose whether to authorize:

1. Account-scoped server progress with an explicit local-to-server merge,
   completion, reversal, and course-version contract; or
2. Deferring reward eligibility until such a server-authoritative progress
   boundary exists.

Until then, local completion must not be accepted for reward issuance. This is
a reward blocker, not a blocker for reading the Foundations lessons or taking
the browser assessment.

### 3.3 Existing entitlement mapping

The value and reuse of the existing standard paid entitlement are frozen, but
the physical mapping is not. The owner must identify the existing entitlement
record/source/repository and choose whether the learning reward is recorded as
an existing supported source under the canonical commercial transaction path,
or remains deferred. A new learning entitlement tier or provider-specific
dependency is not an approved option.

### 3.4 Claim, start, expiry, and stacking semantics

The owner must explicitly choose:

- automatic grant after eligibility versus an explicit claim;
- immediate start versus a defined time-bank/coverage start rule;
- behavior when the account already has the entitlement;
- stacking/extension versus no stacking;
- expiry calculation and timezone/clock authority; and
- behavior for an account that is already Pro or otherwise covered.

These choices affect only the future commercial reward boundary and are not
assumed by the current assessment runtime.

### 3.5 Idempotency and revision binding

The conceptual uniqueness boundary is one reward per account and course
version, but the physical transaction key and claim record are unresolved. The
owner must define the exact idempotency key, the relation between course
version, assessment revision, and accepted attempt, and whether a later
content revision creates a new eligibility window or leaves a prior grant
permanent. The server, not the browser, must own timestamps and transaction
outcomes.

## 4. Explicit non-decisions

- No assessment attempt table, endpoint, server scorer, migration, or reward
  grant has been added.
- No authenticated 12/12 progress proof has been fabricated from local
  storage.
- No production enum or entitlement source has been invented for
  `LEARNING_FOUNDATIONS_V1`.
- No reward is issued from the browser, from a client score, or from an
  assessment pass alone.
- No English fallback is introduced for missing or non-admitted localized
  assessment content.

## 5. Stop condition

The seven-locale assessment admission work is complete. Further work must
wait for the Product Owner to freeze the attempt authority, authenticated
progress proof, and exact commercial entitlement/claim contract. Do not begin
another Learn content track or implement reward semantics from this gap list
alone.
