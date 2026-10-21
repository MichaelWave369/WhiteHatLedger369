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

## R3: Minotaur Protocol (merged in PR #13, experimental)
- Browser-local, monotonic fixture capability reduction across seven named tiers.
- Inert policy checks, escalation trace, replayable event sequence, and unsigned observations.
- Separate, explicitly opt-in **local Docker smoke test** using only one bundled harmless fixture: no network, read-only mounts, no capabilities, unprivileged UID, no-new-privileges, and resource limits.
- No production integration, no untrusted payload execution, no genuine isolation in the browser. Container smoke is not proof of safety under hostile code.

## R3.1: genuine isolation design review (future)
- Dedicated VM/microVM policy, immutable/pinned images, seccomp profiles, secret isolation, measured network-denial verification, signed approvals, and independent adversarial assessment.
- Separate human authorization required before any real-target or unknown-code execution.

## R4: Agent Authority (merged in PR #14, signed offline fixture)
- Verify a **genuine Ed25519-signed**, domain-separated demo grant against a *pinned public fixture key*.
- Check issuer, audience, simulated agent subject, exact resource, operation, 24-hour lease, and in-memory replay nonce.
- Seven positive/negative verification scenarios; signature tampering and scoped denials must fail closed.
- No private key shipped and no agent/tool executed. This is an educational trust-boundary prototype, **not** a production grant broker.

## R4.1 / R4.2: real operator-controlled authority (future, separate review)
- Production key custody, rotating trust roots, revocation, atomic durable replay detection, monotonic time and actual signed audit trails.
- Owner consent + operator approvals tied to specific resources/actions/expirations; an independent trusted tool gateway must enforce each decision.
- Integrate with SuperPhiVessel **only** following explicit owner authorization, threat modeling, and independent security review.

## R5: Evidence Ledger (PR #15, synthetic signed chain)
- Three synthetic hash-linked scope/observation/retest records, with a real Ed25519-signed checkpoint.
- A pinned public fixture key, canonicalized bytes, and two **independently implemented** browser/Node verification paths.
- Deliberate modification, deletion, reordering and checkpoint-forgery tests with fail-closed results.
- Local JSON import and export for verifying **the fixed demo issuer and target only**; no keys or remote upload.

## R5.1 / R6: production readiness (future, separate review)
- Independently administered issuer keys, custody receipts, signed scope authorizations, patch/retest provenance, and key revocation.
- Lockfile/SBOM and deploy receipts with immutable target references.
- Release gates that distinguish PASS, FAIL, UNKNOWN and never treat an unsigned record as security evidence.
- **No production release gate is implemented at R5.**

**Never infer an effective control from a design document alone.** Ship it, exercise it, collect receipts, and retest.
