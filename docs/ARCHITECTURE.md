# NatalNode.com Website Architecture and Governance

**Document status**: Implementation-oriented governance baseline

**Source of truth**: `docs/PRD.md` is the product source of truth. This document records the implementation boundary and module-growth policy for the website repository. It is not a repository audit or a broad architecture rewrite.

## Fixed System Boundary

The website boundary is fixed:

```text
NatalNode.com
    ↓
Website API / BFF
    ↓
NatalNode Engine Public API
```

NatalNode.com and the BFF consume Engine facts through the public API. Website code does not implement astronomy calculation, access an astronomy provider directly, or bind product behavior to a provider-specific implementation.

## Source Module Responsibility and Growth Policy

The primary metric is **cohesive responsibility**, not raw file size. A module should have a clear behavioral boundary and one understandable reason to change.

LOC thresholds are heuristic guardrails. They are not lint rules, automatic refactor triggers, or reasons to alter working code. This policy operates primarily as a Codex planning constraint to save engineering effort and token consumption, not to create process debt.

Current state:

```text
Proactive Large-File Decomposition Program
= PAUSED

Completed historical decomposition work remains accepted.
Remaining large-file audit candidates are NOT the active roadmap.
```

- Preferred behavioral-module size is roughly 100–300 LOC.
- Roughly 350 LOC is an architecture review trigger: reassess responsibility, cohesion, and the next feature boundary.
- Roughly 500 LOC is a hard growth gate for newly generated handwritten behavioral modules. If planned work would cross it, stop before generating the large implementation and redesign the semantic boundaries first; do not defer the redesign to cleanup.
- Existing oversized modules are grandfathered. Their size alone does not create a refactor or cleanup task. Dedicated decomposition is eligible only when product work is blocked, repeated defects or unsafe changes are demonstrated, a required feature would materially worsen responsibility overload, security/privacy/scientific correctness requires restructuring, or the user explicitly authorizes it.
- When product work legitimately touches an oversized module, make the smallest safe feature change and extract only a new cohesive responsibility when that boundary is natural and inexpensive.
- Feature planning should silently identify affected modules, the new responsibility, its owner, expected growth, and a safe decomposition point before a meaningful large implementation. Do not create a separate audit task or long report. Surface the boundary decision only for a possible >500 LOC module, genuinely competing designs, or public-contract/security/scientific-boundary impact.
- For a behavioral source file around or above 350 LOC, roughly 80 lines of clearly independent new responsibility should trigger a sibling-boundary review in the same feature patch. If the responsibility is inseparable, cohesion overrides arithmetic.
- Exclusions include generated code, lockfiles, static data, fixtures, migration SQL, schemas/data declarations, configuration, vendor/third-party content, and test files. Stylesheets require cascade/layer judgment; do not decompose global.css solely for line count, while feature-specific styling should use a natural local boundary when one exists.
- Large tests are organized by behavioral domain, fixture boundary, or harness responsibility rather than arbitrary LOC. The behavioral-module gate does not apply directly to test-file length.
- Characterization is risk-driven: add it for required high-risk behavior changes, real defects, security/privacy/scientific-boundary changes, or explicitly authorized refactors—not solely because a file is long.
- Use targeted validation proportional to change risk. Broader check/build/full behavioral matrices belong at meaningful milestones or when the affected boundary requires them; do not repeat them merely because code was reorganized.
- Do not create generic abstraction debt or premature abstraction to satisfy a threshold. A new module needs a real responsibility, clear contract, and demonstrated reuse or current feature value.

Do not continue ChartRenderer, global.css, SavedVaultChartExperience, local-public-edge, migration-runner, rate-limit module, Feedback, or other audit-ranked decompositions solely because of file size. Historical audit records remain reference material only and must not be deleted. Completed decomposition work remains accepted and must not be reverted, including the Vault management client, Vault component, Contracts chart extraction, and BirthInputForm decompositions.

Future priority order is: (1) product capability / MVP progress, (2) correctness and trust, (3) security/privacy, (4) user-visible quality and usability, (5) maintainability required by active work, (6) opportunistic structural cleanup, and (7) standalone cosmetic architecture cleanup. Standalone large-file cleanup is therefore lowest priority unless explicitly reauthorized.

This policy creates no mandatory architecture report, mandatory LOC report, CI gate, lint package, test framework, automatic file-size failure, repository-wide recurring audit, or extra ADR for each module extraction. Do not create a file-size checker, custom ESLint rule, pre-commit hook, CI workflow, architecture scanner, or dependency graph scanner. Automation may be considered later only if actual recurring violations justify it.

## Implementation Governance

Semantic boundaries come before large implementations. New behavior must remain behind the fixed Website API / BFF → Engine Public API boundary, and `docs/PRD.md` plus Git history remain the authoritative record for product and implementation decisions.

This policy does not authorize broad cleanup, unrelated refactors, an ADR, or changes outside the documentation and implementation scope explicitly requested for a task. The repository-wide proactive large-file decomposition program is paused and is not a mandatory execution backlog. It does not authorize a new manual large-file review or a continuation of the audit backlog.
