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

## R4 addition: signed agent-grant **sample** verifier

**Trust anchor:** The R4 browser demo pins one Ed25519 **public fixture key** in source. It verifies a fixed, byte-exact message prefixed by `WHL369-R4-GRANT-V1\\n` (domain separation). A transient one-time signing key produced this sample, and no signing private key was saved or committed. Caller-supplied `keyId` cannot replace the pinned verifier key.

**What it actually proves:** the signed fixture was not modified relative to its signature and pinned public key; the application also checks narrow audience, subject, resource, operations, validity window, and in-memory nonce replay. All ALLOW results are explicitly `ALLOW_FIXTURE_ONLY` with `executed=false`. Nothing reaches a real agent, model, backend, GitHub permission, or tool. Unit tests deliberately mutate signed payload bytes and attempt forbidden operations and targets.

**What it cannot prove:** Identity of a real issuer, operator consent, independent key custody, protection against a modified browser/page, durable revocation, atomic replay protection between devices, monotonic wall time, a secure action dispatcher, or actual SuperPhiVessel integration. The historical fixture clock is *frozen for reproducibility*. It is not a current authorization oracle; this 24-hour sample expires on 2026-10-22 00:00 UTC. The browser itself is an untrusted execution environment and cannot be an authoritative production trust boundary.

**Production non-goals:** no private-key management, permission issuance API, remote agent commands, delegated GitHub tokens, or real scope enforcement. A future backend must independently bind caller identity, scope, owner consent, action execution, trust-root rotation, revocation, tamper-evident logging, and human approvals before real operations can occur.

## R5 addition: signed hash-chain sample and verifier boundaries

R5 introduces **one fixed synthetic 3-record chain** pinned to a publicly committed Ed25519 demo public key. Each record includes sequence, previous hash, kind, exact lab subject, synthetic provenance, timestamp, and summary; SHA-256 covers the canonicalized record fields with an explicit domain prefix. The signed checkpoint covers issuer, ledger ID, record count, head and issue time with a separate domain prefix. A modified, removed, reordered or forged record is rejected.

Two independent verification implementations (browser Web Crypto and Node crypto) deliberately re-implement the same canonical format and trust root. Their successful results demonstrate sample integrity **relative to this code's trust anchor**, not objective truth, security certification, independent authorization, or actual incident handling. The signing private key was ephemeral, and no real issuance system is available.

Browser code can be modified by a compromised host. A trust root shipped from the same website is **not independently anchored**. Uploaded JSON is read locally, constrained to 64 KB in the UI, and schema/issuer/subject-validated before acceptance. The Node CLI reads only the fixed checked-in fixture. Neither path connects to real repositories or executes agents.

R5 limitations: no protected production signer, issuer PKI, revocation list, trusted wall time, durable anti-replay ledger, real artifact custody, or verified cross-system evidence. A signer can sign a false statement; hash chaining cannot establish whether it is true. Production authority and remediation proof remain **UNKNOWN** until separately verified.

## R6 addition: advisory release policy, not a trusted production gate

R6's build-time Node policy reads only this repository's fixed `package.json`, `public/sentinel-report.json`, and `public/evidence-ledger.json`. It verifies the frozen signed sample with the Node verifier and checks the direct-dependency advisory report's source hash, timestamps, count consistency, and status. There is **no outside target probing, API key, or private repository access** from R6.

**Truthful outcomes:** a complete zero-match OSV advisory report may yield PASS for the narrow *direct npm advisory lookup* condition only. Matches yield FAIL/manual triage, missing/stale/partial data yield UNKNOWN. Missing production controls for signed consent, immutable SBOM, build/deployment attestation, and real patch/retest are hardcoded UNKNOWN. The signed laboratory R5 fixture is an EXCLUDED example and cannot make a production-release policy pass. An unsigned CLI/CI context field is merely a claim, not independent provenance.

**Execution:** the deployment remains non-blocking. A red or unknown Guardian advisory does not automatically stop GitHub Pages publishing. Hard-blocking releases without reliable issuer identity, owner consent, independent signer trust, and an operator appeal process would cause a false sense of assurance or unwanted disruption.

**Unresolved:** a compromised GitHub Action, host, or browser could falsify Guardian's unsigned JSON; self-reported evidence cannot establish system integrity. Genuine enforcement needs a separate trusted control plane, verifiable supply-chain evidence and independently distributed trust anchors.

## R7 addition: locked npm dependency declarations

R7 introduces a committed npm v3 lockfile, checked for exact manifest-root dependency equality. CI and Pages now use `npm ci`, reducing unreviewed transitive-resolution drift between runs. The lockfile records resolved versions, platform-optional packages, npm-registry URLs, and SHA-512 subresource integrity metadata. A build-time report uses SHA-256 of both manifest and lockfile to document **claimed checked-out sources**.

**Trust boundary:** A registry SHA-512 value protects package-tarball byte integrity *relative to the committed lockfile*, not package author reputation, malicious maintainer actions, local install scripts, or the actual installed/deployed artifact. Platform-optional packages are lockfile entries, not necessarily installed on the current platform. The report is unsigned and generated inside the same CI trust domain that it documents.

**R6 implications:** full dependency-lock metadata helps future supply-chain assurance but does not independently prove a protected build/runner identity, production SBOM, deploy artifact digest, or third-party attestation. Thus Guardian's production `transitive_sbom` and `deployment_attestation` remain **UNKNOWN**. Any move to PASS requires independently verified provenance, not merely more fields in a JSON report.

## R8 addition: build output integrity vs authentic provenance

R8's local post-build CLI records a sorted list of **all** `dist/` files (excluding `artifact-manifest.json` to avoid self-reference), with SHA-256 digests and exact byte counts. The root hash commits to the canonical list with a domain-separated prefix. The local verifier scans `dist/` again, rejecting missing/extra/modified files, unsupported paths, symlinks, and source manifest/lockfile hash discrepancies. CI and Pages run this after the Vite build.

The browser may re-download all **same-origin** files named by the manifest and recompute every digest. This verifies only equality of website bytes with **that same website's self-published manifest**; the browser does not have an independently anchored source-of-truth and the host could serve manipulated code and matching hashes. Imported external URLs, credentials, and remote targets are not supported.

**Security boundary:** build-file hash consistency is not an authenticated SLSA provenance statement, not signed build-identity attestation, and does not establish that the GitHub Actions runner or deployed backend is trustworthy. A malicious builder can forge the entire manifest or alter the UI itself. R6 Guardian's missing authenticated deployment and owner-consent evidence stays UNKNOWN. A future external signer/trust root is needed before considering independent proof.

## R9 addition: GitHub-issued attestations of completed build manifests

R9 asks GitHub Actions to issue an artifact-attestation binding the exact `dist/artifact-manifest.json` bytes to a workflow identity using GitHub OIDC and Sigstore. The short-lived signing certificate and associated evidence are issued/stored outside the public static website. The build job alone receives `id-token: write`, `attestations: write`, and `contents: read`; pull-request CI receives only read permission.

After signing, the workflow runs `gh attestation verify` on the local manifest **before uploading the Pages build**, requiring the repository, specific `pages.yml` signer workflow, and `refs/heads/main`. This is a narrower, concrete release-step authenticity check. A verification failure blocks publication of the affected new Pages build. R6's broader release-security policy stays explicitly advisory and does not block releases.

**Trust assumptions:** Verification trusts GitHub's attestation APIs, GitHub Actions OIDC identity, Sigstore certificate/identity validation, and the GitHub CLI. An attacker with authority to modify the main workflow or compromise its runner could sign a malicious manifest via a legitimately identified workflow. Attestation proves the certified actor claimed those bytes; it does NOT prove the bytes were built safely, that the GitHub Pages host serves the attested manifest or other assets unchanged, or that owner consent/security patch evidence exists. Clients must download the actual served manifest, verify its attestation **outside the web page**, then compare page asset bytes against the verified manifest using R8; even this does not prove vulnerability absence.

**No deception:** The R9 browser panel never says that Sigstore verification occurred in-browser. GitHub workflow issuance cannot be proven from PR CI alone. The actual signed artifact only exists after a successful post-merge Pages workflow. A GitHub attestation for this manifest is not a universal production security certification, nor an authenticated SBOM or an owner approval.

## R10 addition: post-deployment public file reconciliation

R10 strengthens the chain of custody by distinguishing `dist/` files on the builder from bytes actually served by the Pages host. The build exports its exact manifest SHA-256 as an internal job output after R8's stamp/verify step. A **separate post-deploy job** downloads the public manifest, requires the **same exact hash**, verifies the downloaded manifest using GitHub CLI/Sigstore with repo, workflow identity, `main` source ref and exact source commit, then downloads each same-origin asset under an allowlisted first-party URL and compares its SHA-256/size to the verified manifest.

The checker cannot be redirected to external destinations or arbitrary URLs and has no write permissions to GitHub content. The result is **public Actions metadata and an unsigned retained report**, not a separately signed auditor receipt. A failure marks the R10 job failed and makes the workflow red; it **does not prevent the preceding deployment from already being live**, nor does it perform rollback. The job retries boundedly because Pages CDN propagation may lag the deploy event.

**Trust assumptions:** GitHub-hosted runner, GitHub Actions and Sigstore identity, GitHub CLI implementation, Pages HTTPS origin/DNS, and job-to-job output integrity. A malicious CI workflow with authorized signing rights could sign a malicious manifest; R10 then faithfully verifies malicious bytes. There is no proof of vulnerability absence, correctness of app behavior, production-owner consent, or freedom from runtime attacks. The R6 broader release policy therefore remains advisory and contains UNKNOWN controls. Public GitHub Actions metadata displayed in the UI is not cryptographic verification performed by the browser.

## R11 addition: incident evidence and manual recovery

A post-deploy check can fail **after a website has already been published**. R11's Incident Desk addresses the operational danger of treating a red check as an automatically resolved problem. The custody workflow, running with **read-only** GitHub permissions, writes a deterministic incident packet after each R10 custody job, **even on failure**, using `if: always()`. The original custody observation and derived incident packet are retained as unsigned workflow artifacts for 30 days.

Three classifications exist: an internally consistent R10 byte-match observation (no new custody incident observed), a failed/inconsistent observation (review required), and no usable observation (unassessed). The run, exact commit and expected manifest digest are bound to the packet. This does **not** prove exploitability, actual malicious activity, or a vulnerability's resolution. Packet IDs are stable hashes of context/classification, not signatures, and **are not authorization tokens**.

The public dashboard uses unauthenticated, read-only GitHub Actions metadata. It may be incomplete or rate limited. GitHub action success displayed in a browser is an **observation**, not independent cryptographic verification by the browser. A compromised runner or unauthorized workflow modification can lie in a report. No automated rollback, protected branch mutation, issue creation, secrets/credential rotation or incident closure is implemented.

**Future controls:** independently signed operator approvals, truly immutable external evidence retention, scoped rollback proposals, recovery simulations, and an audited trust boundary between human consent and any mutating deployment operation.

## R12 addition: non-executable recovery drafts

R12 lets an operator prepare a **local, unsigned** JSON recovery proposal after an R11 incident, pinned by strings to a 40-hex incident commit and manifest SHA-256 plus a distinct 40-hex candidate commit and manifest SHA-256. It collects rationale, user-risk assessment and a time-bounded review deadline; a domain-separated SHA-256 digest protects only relative self-consistency of that draft. A malicious party can edit all fields **and recompute the hash**; this does not establish origin, consent or secure candidate provenance.

The web studio does not fetch or authenticate R11 incident artifacts automatically. Imported JSON is checked locally with size limits. Every proposal carries fixed `approval: NOT_GRANTED_REQUIRES_INDEPENDENT_OWNER_AUTHORIZATION` and `execution: DISABLED_NO_TOOL_ACCESS` labels, enforced by browser and Node tests. The GitHub workflow has no code path that takes R12 drafts and deploys anything.

A future trusted release/recovery gateway must independently verify the repo owner, specific source+candidate GitHub refs, build attestation, operator consent and expiry, reviewer separation, revocation, atomic single-use execution, and signed custody of the approval before it may carry out any deployment. No such authority has been granted at R12.
