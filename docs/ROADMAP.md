# WhiteHatLedger369 roadmap

## R0: The Watchtower (merged in PR #1)
- Responsive React/Vite/TypeScript GitHub Pages UI.
- Read-only public repository discovery with pagination, error handling, timestamps, and status.
- Search, language filters, archived-state filters, metadata hygiene reminders.
- Explicit unassessed/unknown status; no false vulnerability verdicts.
- Tests, CI, restrictive workflow permissions, Dependabot.
- Threat model and disclosure policy.

## R1: Sentinel (merged in PR #11, deliberately narrow)
- Read-only, server-side OSV.dev advisory observations for **direct exact-version npm dependencies of this repo alone**.
- Manifest hash, commit, timestamps, validated advisory IDs, pagination completeness, and UNKNOWN states.
- Published JSON report and dashboard panel; daily GitHub Pages rebuild and offline tests.

## R1.1 / R1.2: expansion only after explicit design review
- Lockfile-based transitive package coverage with reproducible builds.
- Repository-by-repository opt-in scopes and least-privilege backend/GitHub App access for any private data.
- Signed, portable finding/triage and fix/retest receipts. Unsigned R1 telemetry is not authoritative.

## R2: WhiteHat Gauntlet (merged in PR #12, self-contained local simulator)
- Browser-local `lab://` fixtures with positive controls and adversarial cases.
- Seven deterministic authorization/integrity tests, replay fault injection, and downloadable unsigned evidence JSON.
- No external target contact, delegated credentials, dynamic code execution, or real-world scanning.

## R2.1: authorized test harness (separate future scope)
- Written scope/consent checks before each **future** real target evaluation.
- Truly isolated deliberately vulnerable training apps and patch/retest evidence.
- No uncontrolled internet targets.

## R3: Minotaur Protocol (PR #13, experimental)
- Browser-local, monotonic fixture capability reduction across seven named tiers.
- Inert policy checks, escalation trace, replayable event sequence, and unsigned observations.
- Separate, explicitly opt-in **local Docker smoke test** using only one bundled harmless fixture: no network, read-only mounts, no capabilities, unprivileged UID, no-new-privileges, and resource limits.
- No production integration, no untrusted payload execution, no genuine isolation in the browser. Container smoke is not proof of safety under hostile code.

## R3.1: genuine isolation design review (future)
- Dedicated VM/microVM policy, immutable/pinned images, seccomp profiles, secret isolation, measured network-denial verification, signed approvals, and independent adversarial assessment.
- Separate human authorization required before any real-target or unknown-code execution.

## R4: Agent authority
- Signed, expiring action grants and operator review.
- Threat modeling for prompt injection and confused-deputy behavior.

## R5+: Evidence and release gates
- Signed artifacts, provenance, custody links, build verification.
- Policy-controlled release gates that distinguish PASS / FAIL / UNKNOWN.

**Never infer an effective control from a design document alone.** Ship it, exercise it, collect receipts, and retest.
