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

## R5: Evidence Ledger (merged in PR #15, synthetic signed chain)
- Three synthetic hash-linked scope/observation/retest records, with a real Ed25519-signed checkpoint.
- A pinned public fixture key, canonicalized bytes, and two **independently implemented** browser/Node verification paths.
- Deliberate modification, deletion, reordering and checkpoint-forgery tests with fail-closed results.
- Local JSON import and export for verifying **the fixed demo issuer and target only**; no keys or remote upload.

## R6: The Release Guardian (merged in PR #16, NON-BLOCKING)
- Deterministic PASS / FAIL / UNKNOWN policy, with FAIL dominating and UNKNOWN never promoting to PASS.
- Build-time advisory JSON generated from current R1 Sentinel observations and independently verified R5 lab fixture.
- Source-matched and freshness-bounded direct npm advisory assessment; missing, stale, partial, or mismatched data remains UNKNOWN.
- R5 demo signature verification shown as a separate synthetic test, explicitly EXCLUDED from production policy.
- Unknown by design: real owner consent, transitive/SBOM coverage, signed build/deploy attestations, and patch/retest proof.
- A live dashboard and local policy training cases; GitHub Pages deploy remains **non-blocking**.

## R7: The Dependency Vault (merged in PR #17, reproducible npm resolution)
- Committed npm v3 `package-lock.json` generated by GitHub Actions and all CI/Pages installs switched to `npm ci`.
- Validate full lockfile/root-manifest consistency, registry resolved metadata, and package SHA-512 integrity values.
- Generate a read-only unsigned dependency inventory, present locked package versions and metadata in a searchable dashboard.
- Explicitly distinguish locked dependency graph from independently attested installed tree, security scan, SBOM, or deployed artifact.
- Guardian production release controls remain UNKNOWN until independent provenance is established.

## R8: Artifact Witness (merged in PR #18, unsigned build-file checksums)
- Hash all produced static files with SHA-256 and derive a canonical sorted build-root fingerprint.
- CI and Pages regenerate and independently re-read the entire built directory; mutation/added/missing-file/symlink tests enforce failures.
- Visitors can re-fetch same-origin files to compare against the host-provided unsigned manifest.
- Source manifest/lockfile fingerprints are recorded as untrusted CI claims; unsigned evidence is not an independently anchored attestation.
- R6 Guardian deployment-attestation policy remains UNKNOWN. No enforcement.

## R9: The Independent Witness (merged in PR #19, native attested manifest)
- GitHub Actions `actions/attest@v4` emits GitHub/Sigstore SLSA provenance for R8's exact built `dist/artifact-manifest.json` after the byte-integrity check.
- Main-only Pages build job holds scoped attestation/OIDC permissions; ordinary PR CI stays read-only.
- GitHub CLI independently verifies subject, exact signer workflow and `refs/heads/main` before uploading Pages; failure stops that **build's publication**.
- Website publishes a verification guide and delivered-manifest SHA-256, explicitly NOT claiming browser-based attestation verification.
- Authenticity of the manifest does not independently verify deployed asset bytes, source safety, ownership consent, or the Pages host. R6 production Guardian remains advisory.

## R10: Public Chain of Custody (merged in PR #20, post-deploy verifier)
- Post-deploy GitHub Actions job downloads **actual hosted** manifest, checks its SHA-256 against the exact build job output, verifies GitHub/Sigstore identity and source commit through `gh attestation verify`.
- Fetches every public hosted file listed by the attested manifest and validates exact SHA-256/byte counts.
- Negative-control tests cover same-length changes, missing assets, mismatched expected build or signing identity.
- Public GitHub Actions result metadata appears in read-only UI, not as browser-verified cryptographic trust.
- Post-deploy failure flags the run; **it cannot roll back an already published website**. No owner approval or vulnerability certification inferred.

## R11: Incident Desk (PR #21, advisory incident/recovery packets)
- On every completed R10 custody job, including failures, generate an unsigned run-bound incident packet with a deterministic ID and strict result classes.
- Missing/inconsistent evidence is UNASSESSED or REVIEW_REQUIRED; later green runs cannot erase or silently resolve previous failures.
- Retain custody plus incident JSON together with 30-day GitHub Actions artifact retention; no GitHub write credentials or automatic actions.
- Public Incident Desk shows latest Actions custody results and an operator-only recovery playbook, not unverified security conclusions.
- Real restoration, rollbacks, issue filing and closure require separately approved and verifiable human actions.

## R11.1 / R12: trusted recovery (future, separate review)
- Independently managed issuer keys, revocation, owner-scoped consent receipts, actual patch/retest provenance and verifiable artifact custody.
- Verified lockfile/SBOM with immutable deployment digests and signer roots distributed outside the audited website.
- A carefully staged real release gate with human-approved override receipts; *not* automatic until evidence and policy are independently audited.

**Never infer an effective control from a design document alone.** Ship it, exercise it, collect receipts, and retest.
