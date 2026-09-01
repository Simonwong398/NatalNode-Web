# NatalNode Foundations V1 Assessment and Reward Policy

Status: FROZEN PRODUCT-OWNER AUTHORITY CONTRACT

Task: `WEB-LEARN-012`

This document replaces the bounded decision surface recorded after the
Foundations assessment admission work. The decisions below were approved by
the Product Owner for Foundations Reward V1 and are the source of truth for
the implementation. They do not authorize any other learning course,
entitlement tier, or product feature.

## 1. Frozen course and assessment identity

- The course identity is `foundations.v1` and contains exactly the twelve
  frozen Foundations lesson IDs.
- The final assessment identity is `foundations.v1.final_check` at assessment
  revision `1`.
- The assessment contains exactly ten questions, passes at `8/10`, and allows
  unlimited retries.
- The canonical English question IDs, option IDs, correct-answer IDs, and
  lesson links remain answer authority. Localized artifacts provide
  presentation text only and may not redefine assessment identity or scoring.
- All seven approved/current/runtime-available locales remain available:
  `en`, `es`, `fr`, `de`, `ja`, `ko`, and `zh-Hant`.
- Assessment completion is independent of lesson completion and Foundations
  Core readiness. It creates no certification, leaderboard, XP, paid retry, or
  other progression product.

## 2. Anonymous assessment boundary

- Anonymous visitors may read and submit the browser assessment.
- Anonymous scoring remains in browser memory and may be retried without a
  login requirement.
- An anonymous result is not an authenticated attempt, account state,
  completion proof, PASS-EVER proof, reward eligibility proof, or entitlement
  grant.
- Anonymous lesson progress remains versioned browser-local state.

## 3. Authenticated assessment authority

- An authenticated browser submits only stable `questionId` and `answerId`
  values for the current assessment identity and revision.
- The server derives account identity from the authenticated session. A
  request body, query parameter, or browser field can never select the
  account being changed.
- The server validates the exact question set, rejects unknown or duplicate
  questions, rejects missing questions and invalid answer IDs, and rejects an
  unknown assessment or unsupported revision.
- The server recomputes `score`, `correctCount`, and `passed` from the
  canonical answer key. Browser-provided score, correct-count, pass, user,
  timestamp, eligibility, and reward fields are not accepted.
- Every accepted authenticated submission creates one immutable attempt row.
  An attempt is bound to the account, course, assessment, and assessment
  revision and receives its timestamp from the server/database.
- PASS-EVER is true when at least one authoritative attempt for
  `foundations.v1` / `foundations.v1.final_check` at the supported revision
  has `score >= 8`. Later lower scores never revoke PASS-EVER.
- Assessment retries remain unlimited after a pass and after a reward grant.

## 4. Authenticated lesson-completion authority

- Authenticated completion is stored as one account-scoped completion row per
  `account × course × lesson`.
- A completion row is monotonic and server-timestamped. The authenticated
  server state can move from absent to completed but cannot be reopened or
  downgraded by a browser request.
- The server exposes authenticated read, single-lesson completion, and local
  merge operations. All operations derive account identity from session
  context and validate the frozen course and lesson identity.
- Local-to-server synchronization is a deterministic SET UNION of
  `server COMPLETED ∪ valid local COMPLETED`.
- Only the twelve stable lesson IDs for `foundations.v1` are eligible for the
  union. Unknown, future, malformed, unrecognized-course, and local
  `IN_PROGRESS` values are ignored for merge authority. The server never
  accepts browser-local state as a downgrade.
- Repeated completion and merge requests are idempotent and account scoped.
- A server `12/12` count is the only authoritative lesson-completion proof
  used by Reward V1.

## 5. Reward V1 eligibility and grant

All of the following conditions are required for one account to receive the
reward:

1. The request is authenticated.
2. The server has completed all twelve `foundations.v1` lesson IDs for that
   account.
3. The account has PASS-EVER for the current Foundations final assessment.
4. The account has no prior Foundations V1 reward grant.

An assessment pass alone, one or more lessons alone, browser-local progress,
browser-local score, or a client-issued claim is insufficient.

- The reward is automatic. There is no Claim button or claim endpoint.
- The reward is exactly seven consecutive `24-hour` days of the existing
  `PRO` entitlement. No new tier, trial type, or entitlement product is
  created.
- The canonical source identity is `LEARNING_FOUNDATIONS_V1`. The current
  commercial representation uses the existing `PROMOTION` source class and
  source type for a finite grant credit; the learning source identity is
  persisted in the Learn reward ledger and canonical commercial event
  attributes. This does not create a new tier or provider-specific source.
- The Learn reward ledger is unique on `account × foundations.v1` and the
  commercial credit is the entitlement authority. A reward ledger row is not
  an ad-hoc `pro_until` substitute.
- Grant creation, commercial event append, credit creation, and reward-ledger
  creation occur in one transaction under the account's commercial authority
  lock. Database uniqueness is the final duplicate guard.
- Repeated requests, refreshes, retries, tabs, concurrent completion/merge or
  pass submissions, server retries, and replayed operations converge on one
  grant and one seven-day value.
- The reward start is the first instant after the account's existing
  authoritative PRO coverage (paid, temporary commercial grant, or Referral
  time-bank coverage) ends. If no such coverage is present, it starts at the
  authoritative server instant of grant. The reward expiry is exactly seven
  `24-hour` days after that start, using server/database time and half-open
  coverage intervals.
- Existing paid, promotional, temporary, or Referral PRO coverage is never
  shortened or consumed by the Foundations reward. An already-PRO account
  keeps its existing value and receives the reward after that coverage.
- A later assessment retry cannot create a second reward. A future
  `foundations.v2` course or assessment revision requires a future product
  policy and is not silently folded into V1.

## 6. Commercial compatibility and account lifecycle

- The existing `FREE` and `PRO` plan model remains unchanged.
- The existing commercial authority, revision, event journal, source-class,
  projection, and entitlement capability contracts remain the governing
  commercial boundary.
- The finite learning credit is exposed to the canonical entitlement evaluator
  as an existing `PROMOTION` source class. Paid and Referral coverage remain
  their own sources and retain their precedence/time-bank behavior.
- Account deletion cascades learning progress, attempts, reward ledger rows,
  and commercial learning credits through the existing user/authority
  lifecycle. Assessment answers are not retained because score/count/pass are
  sufficient for the frozen reward authority and avoid unnecessary response
  data.
- No birth data, chart facts, astronomy calculations, Engine calls, provider
  identifiers, interpretation content, or notification payloads are part of
  this contract.

## 7. Runtime presentation boundary

- The existing seven-locale assessment admission boundary remains unchanged:
  a localized assessment is rendered only when it is approved, current, and
  available; there is no silent English fallback.
- Anonymous visitors retain the current browser result and local lesson
  experience.
- Authenticated Foundations pages may synchronize valid local completed IDs
  after session authentication. The client preserves local state until a
  successful server response and then renders server-returned completion and
  reward status.
- Authenticated assessment results are labeled as server-scored. The UI may
  show the minimum authoritative result and reward state, but adds no
  gamification, certificate, XP, leaderboard, or forced-login gate.

## 8. Explicit non-decisions for future work

The following remain outside Foundations Reward V1 and must not be inferred
from this document:

- `foundations.v2` or any new course/version reward policy;
- additional entitlement tiers, trials, or reward products;
- changes to the seven-locale assessment content, lesson prose, or glossary;
- Engine, astronomy, provider selection, chart calculation, interpretation,
  notification, or unrelated Learn content work;
- entitlement claim UX, certificates, XP, badges, or leaderboards.

Provider selection remains: `PROVIDER DECISION DEFERRED`.

The Foundations Core content matrix remains the existing `12 × 7 = 84/84`
approved/current/available contract and is not re-opened by Reward V1.
