# R0 / The Watchtower: threat model and assurance boundaries

**Status:** R0 design / scope frozen for PR #1. **Purpose:** visibility, not vulnerability detection.

## Trust boundaries

1. The browser is an untrusted presentation environment.
2. GitHub's public REST API is an external data source, not an assurance authority.
3. Repo names, descriptions, languages, and links are untrusted text and must be rendered by React as text, never injected as HTML.
4. The public web app does **not** hold tokens, private credentials, or repo-admin permissions.
5. No application-initiated network contact occurs beyond GitHub's public API. The UI uses system fonts and loads no third-party scripts or fonts.

## Risks and controls

| Risk | R0 control | Residual risk |
| --- | --- | --- |
| False sense of protection | Every active repo is UNASSESSED; UI explicitly says no security scanning | Users may still mistake metadata cues for vulnerabilities |
| API rate limits | Paginated requests, HTTP status handling, no partial-snapshot success | Public API can be unavailable; no server-side fallback |
| Missing repos | Stop and reject incomplete pagination; only public repos owned by selected user are in scope | Private, organization, and collaborator repos deliberately excluded |
| Injection in descriptions | React escaped text rendering; no dangerous HTML rendering | External links target GitHub and open in another tab |
| Token leakage | No login, token entry, or authenticated browser requests | Browser extensions and network intermediaries are outside app control |
| UI stale | Capture timestamp and manual refresh | Data can change immediately after capture |
| Supply chain | Dependabot and CI checks; pinned direct package versions | No committed lockfile yet; transitive versions not reproducible |
| Untrusted execution | None exists in R0 | Later modules require server-side sandboxing and explicit authorization |

## Observations versus findings

**Observations** in R0 are public metadata facts: languages, archival flags, Pages settings, license metadata, and last push timestamps.

**Metadata review cues** are reminders, not vulnerabilities. Neither missing descriptions nor unknown license metadata nor old push timestamps demonstrate a security issue.

**Findings** (not implemented in R0) require a tested assertion, scope and consent receipts, artifact hashes, proof, severity justification, remediation, and independent retest.

## Phase gates

- R0: public read-only inventory only.
- R1: server-side authenticated advisory checks with least-privileged access, explicit secret boundaries, and proof provenance.
- R2: authorized non-destructive testing in isolated labs.
- R3: hard isolation for risky workloads; decoys never replace OS-level containment.
- R4+: agent grants scoped by tool, target, expiry, and operator approval.

The WhiteHatLedger369 master principle is **"Public verifier, private keys."**


## R1 addition: scoped OSV advisor

R1 adds a server-side GitHub Actions job that reads **only this checked-out project's package.json**. It sends explicitly declared exact npm package versions to the OSV.dev public querybatch endpoint. GitHub's hosted runner is the execution boundary; no browser token or additional GitHub permissions are requested. A generated public JSON report contains the package names/versions already public in this repository, manifest SHA-256, CI commit, OSV IDs, and timestamp; it never includes private repository information.

**Explicit non-goals:** transitive/lockfile dependencies, deployment runtime versions, package integrity, CVSS calculation, severity classification, scan of any other repository, and active exploitation. A clean OSV response is an advisory observation, not an independent security verification.

Failure modes: OSV failure, timeouts, malformed JSON, incomplete pagination, unpinned dependency, and stale report become **UNKNOWN** in the UI. Staleness cutoff is 48 hours. Scheduled jobs may be delayed by GitHub. Published source hashes are *not digital signatures*; a future proof/custody system must validate them independently. The data published in `public/sentinel-report.json` is overwritten at build time; the checked-in placeholder is never evidence of a completed scan.


## R2 addition: in-browser synthetic Gauntlet

R2 does not cross a production execution boundary. It evaluates **hardcoded training grants, operations, nonces, timestamps, and payloads** against a local in-memory `FixtureGate`. Synthetic targets use a non-routable `lab://whitehat369/` namespace. There are no target URLs fetched, arbitrary scripts evaluated, shell commands run, model invocations, or credentials handled by R2. The only generated artifact is a user-triggered downloadable JSON observation, produced locally by the browser's Blob API.

A positive control and adverse probe are evaluated for each scenario. A deliberate `replay-disabled` fault-injection mode must cause at least one scenario to fail. The artifact digest is SHA-256 used for **integrity comparison only**; it is not a digital signature or independent trust anchor. Lower-trust instruction text is inert fixture data and is never sent to a model. Grant checking is illustrative and must not be transplanted into a real agent or auth service without a full threat model, robust identity bindings, authorization, storage, process isolation, and independent security review.

All 7/7 passes establish is that bundled fixture tests produced their expected observations. They say nothing about real-world resilience. Exports are unsigned, unauthenticated, and have no authority outside the local exercise.

## R3 addition: Minotaur policy simulator + optional local container smoke

**Browser boundary:** The R3 ladder is purely a deterministic reducer for fixed simulated incident identifiers and simulated capabilities. The words `SANDBOX`, `DECOY`, `ISOLATE`, and `QUARANTINE` are **status labels, not technical containment controls**. Browser decisions never execute a tool, affect real agents, or add permissions. Exported receipts are unsigned and live under the user's local browser trust boundary.

**Operator machine boundary:** An optional Node.js CLI uses a fixed Docker image name, a fixed source-controlled fixture file, and fixed restrictive runtime arguments. It requires an explicit environment-variable opt-in, checks that an image exists locally, never pulls or accepts arbitrary code, and does not expose a Docker socket inside the container. The fixture reads `/proc`, local mount metadata, network interface names, and tests denial of local writes. No off-host connections occur from the fixture.

**Risks left open:** Docker daemon access is itself privileged; Docker Desktop and host security settings affect isolation; a locally cached tag is mutable and is *not digest-pinned*; filesystem/in-process checks are not a substitute for independent network, kernel, and seccomp audits; missing protections on some operating systems will make smoke tests fail. This is intentionally not a production isolation API and is inappropriate for attacker-controlled code.

Any future real workload must be confined using a reviewed process/VM isolation design, distinct identities, grant authority, network policy, explicit consent, verified provenance, and operational audit. A visually green simulation cannot satisfy these requirements.
