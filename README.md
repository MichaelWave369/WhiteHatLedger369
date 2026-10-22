# WhiteHatLedger369 🛡️

**The Ethical Reverse Lab** | PHI369 Security & Adversarial Assurance

> Break only what you are allowed to heal. Test only what you own or are explicitly authorized to examine. Every action earns a receipt.

## R13: SuperWhiteHat PLUR Division

R13 introduces a versioned Peace/Love/Unity/Respect static-source policy, deterministic unsigned source-hash receipts, offline negative-control tests and a read-only dashboard. CI and Pages builds run the checker, which exits nonzero for REVIEW, BLOCK or UNKNOWN. This narrow scanner does **not** establish harmless intent, prevent forks from removing checks, certify software safety or create a production release signer. Owner-controlled GitHub branch rulesets must mark its CI check as required for merge enforcement.

Run `npm run test:plur`, `npm run plur:check`, and `npm run plur:report`. See [R13 PLUR specification](docs/PLUR.md) for bypasses and limitations.

## R0: The Watchtower

A **read-only, public GitHub repository inventory** built with React, Vite, and TypeScript.

**What works:** enumerate a user's owned public repositories (paginated, not just first 100), count active/archived and Pages-enabled repositories, search, filter by language or metadata cue, inspect last-push and license metadata, and follow links to GitHub. Every full snapshot includes a capture time; partial results are rejected if retrieval fails.

**What it does *not* do:** detect vulnerabilities, check PHP versions, inspect dependencies, read private repos, verify CI/security policies, scan secrets, run code, or execute any penetration testing. All active repos are **UNASSESSED**. "Metadata review" means an administrative hygiene reminder, **not** an actual vulnerability. Do not call R0 a security scanner.

## R1: Sentinel / advisory observatory

The Watchtower now includes a **server-generated OSV.dev advisory observation panel**, intentionally scoped to **WhiteHatLedger369's own pinned direct npm dependencies declared in package.json**. No browser-side API keys are used. The server-side scanner posts only package names and pinned versions to OSV.dev; it does not contact or probe any website listed in the public inventory.

- Reports include the manifest SHA-256, optional GitHub commit, report timestamp, external source, query completeness, advisory IDs, and explicit `UNKNOWN` states.
- Ranges (`^`, `~`), `latest`, Git URLs, and anything not pinned to an exact semantic version remain **UNKNOWN**. R1 does not guess their installed versions.
- OSV failures, malformed responses, incomplete pages, or timeouts lead to **UNKNOWN**, never a false no-advisory verdict.
- Reports are **unsigned** and are not vulnerability confirmations or a software security certification.
- R1 does **not** inspect lockfiles/transitive dependencies, other repositories, PHP runtime versions, deployed sites, code injection, or secrets. It is a first observation layer, not a comprehensive scan.
- The Pages workflow regenerates the report on pushes to main, daily scheduled runs, and manual runs. GitHub Actions may delay schedules; the UI flags reports older than 48 hours as stale.

To exercise the scanner directly (internet access to api.osv.dev required):

```sh
npm run test:sentinel    # all OSV requests mocked, safe/offline
npm run sentinel:scan   # local manifest, POST to OSV.dev, writes public/sentinel-report.json
```

The source checkout has a **NOT RUN** placeholder report. Only a successful CI/Pages build that runs the scanner produces an actual observation. Reports with failed external checks still publish as **UNKNOWN** so the UI cannot silently display stale data as current.

See [R1 assurance notes](docs/SENTINEL.md) for limitations and receipt details.

## R2: The WhiteHat Gauntlet (synthetic laboratory)

An **offline, browser-local fixture lab** that challenges a miniature authorization gate. Seven scenarios each run an authorized positive control and a synthetic adversarial probe:

- Request outside the fixture namespace
- Substituted target not covered by consent scope
- Expired capability lease
- Mutation attempt under an observe-only grant
- Nonce replay
- Payload modification versus a trusted SHA-256 digest
- Lower-trust instruction trying to add a tool capability

Click **Run defended gauntlet** to execute the complete suite. Click **Inject replay fault** to intentionally disable the *synthetic* replay rule, causing one scenario to fail. The point is to prove the suite catches a deliberately introduced mistake, not to train or deploy offensive tooling. Export an **unsigned local JSON lab report** containing verdicts and reason codes. The browser does not contact any target, upload tests, run third-party code, or call an AI model.

**IMPORTANT:** These tests exercise only bundled fixture logic. They do not test WhiteHatLedger369 in production, the repositories in Watchtower, or any real software deployment. A 7/7 lab pass is **not** a security certification. See [R2 Gauntlet design](docs/GAUNTLET.md).

## R3: Minotaur Protocol

Minotaur adds a **browser-local seven-stage capability-reduction simulator**:

`NORMAL → WATCH → RESTRICT → SANDBOX → DECOY → ISOLATE → QUARANTINE`

Each synthetic incident advances one tier. Permitted fixture capabilities only shrink; no check dispatches a real tool. A transition ledger and unsigned observation export demonstrate the rules. **The tier names do not confer operating-system isolation.** No actual agent, repository, process, or internet service is constrained by the browser dashboard.

### Optional local Docker isolation smoke test

R3 adds a separate, **opt-in local CLI** that runs only the bundled harmless `lab/minotaur/fixture.mjs` in a container configured with no network, a read-only root filesystem and fixture mount, no effective capabilities, an unprivileged user, no-new-privileges, and CPU/memory/PID limits. The fixture checks observable runtime restrictions and exits nonzero if checks fail.

Docker Desktop (or Docker Engine) and a **locally present, operator-reviewed** `node:22-alpine` image are required. The runner **never pulls images** and never accepts arbitrary user code, image arguments, or target URLs. It is not run by CI or GitHub Pages.

**PowerShell (Windows):**
```powershell
docker pull node:22-alpine   # explicitly review image first; one-time operator action
$env:MINOTAUR_CONFIRM = 'synthetic-only'
npm run minotaur:smoke
```

**Bash:**
```bash
docker pull node:22-alpine
MINOTAUR_CONFIRM=synthetic-only npm run minotaur:smoke
```

Only operators who trust their local Docker installation should run this. Docker daemon control is privileged. A basic container smoke test **does not authorize executing unknown malware, attacker-controlled plugins, or hostile multi-tenant code**. Use an appropriate dedicated VM and professionally reviewed threat model for truly untrusted workloads.

See [Minotaur isolation boundaries](docs/MINOTAUR.md).

## R4: Agent Authority (Ed25519 verification laboratory)

R4 introduces a **real Ed25519 signature verifier** for a **fixed, signed, 24-hour training fixture** representing a read-only simulated agent grant. A pinned public key is baked into the demo; the one-time signing private key was not stored in the repository, build, or browser.

The verifier checks the signed bytes against the pinned trust anchor, then enforces the exact issuer, audience, subject, resource, operation, `notBefore`, `expiresAt`, and local-session nonce replay rule. The browser does **not** mint grants or execute agents or tools, regardless of the result. The demo uses a **frozen test time, October 21, 2026 at 12:00 UTC**, so expected outcomes stay reproducible even after this sample expires in real time.

Try the **seven signed-fixture scenarios**: valid baseline, altered signed content, untrusted key ID, wrong resource, unauthorized operation, expired grant, and nonce replay. Negative checks must be blocked. The browser does not upload the results or make external calls for R4. See [Agent Authority R4](docs/AUTHORITY.md).

**Crucial distinction:** A trusted signature proves only that some holder of that key signed the specific bytes. It does not by itself establish that the issuer is authorized in your environment, that tools obey the verdict, or that the agent isn't compromised. Real use requires a trusted server-side or OS-isolated execution boundary, independent identity/consent verification, persistent atomic replay state, key revocation/rotation, audit receipts, and human approvals.

## R5: Evidence Ledger (signed sample and dual verifiers)

R5 adds a **cryptographically verified, synthetic hash-linked evidence chain** with three records representing a fictional authorized scope, observation, and retest. Each record is SHA-256 linked to its predecessor. An Ed25519-signed checkpoint commits to the chain's final head. The sample's signing key was generated only to create this fixture; **the signing private key is not published, shipped, or made available to the web UI**.

**Two independent verification paths** check the exact bytes and pinned public demo key:

1. Browser Web Crypto verifier in the R5 Evidence Ledger panel, including local JSON import/export and tamper, deletion, reordering, and forged-checkpoint demonstrations.
2. Offline Node.js `crypto` verifier with independent canonicalization logic, run by CI.

```sh
npm run test:evidence
npm run evidence:verify
```

Any mismatched hash, unexpected schema/issuer/subject, record removal/reorder, or changed signed checkpoint must be rejected. The verifier **never** trusts a new public key supplied within a JSON report. A copied sample has exactly the same verification result: the signer attested *bytes*, not truth.

**No production claim:** The fixture is entirely synthetic; verification **does not** establish that its text is true, a real system was tested, a security patch occurred, or an external issuer was authorized. Real issuance, protected key custody, independent distribution of trust roots, external ownership/consent checks, transparent publication of revocations, and release gating remain future work. See [R5 Evidence Ledger notes](docs/EVIDENCE.md).

## R6: Release Guardian (non-blocking, evidence-led policy)

R6 introduces an **advisory-only** policy report covering `MichaelWave369/WhiteHatLedger369`. The Pages workflow generates `guardian-report.json` **after Sentinel's OSV check**. The dashboard shows what can actually be established, with statuses `PASS`, `FAIL`, and `UNKNOWN`.

**Production posture checks** deliberately separate these domains:

- **Direct exact-version npm advisory results:** a fresh, complete, source-matched OSV report with zero findings can PASS **only this narrow advisory condition**. A reported OSV match leads to FAIL/manual triage; missing/stale/partial data produces UNKNOWN.
- **Transitive dependency tree/SBOM:** UNKNOWN until independently evidenced.
- **Build and deployment attestation:** UNKNOWN. A CI environment variable is not an authenticated provenance signature.
- **Signed consent and scope:** UNKNOWN until real owner-issued proof exists.
- **Live patch and retest receipt:** UNKNOWN. R5's signed synthetic demonstration is not a real retest.

Overall: `FAIL` dominates; otherwise any `UNKNOWN` makes the result `UNKNOWN`. The R5 sample has a separate status and is **never counted as production release evidence**.

The UI includes a small local policy training panel with separate synthetic PASS/UNKNOWN/FAIL examples. These examples cannot modify real reports.

**This is not an active deployment blocker or security certification.** CI still verifies code and publishes Pages, while R6 reports the state of evidence. A future enforcing release gate requires independently anchored signing keys, immutable build provenance, owner consent, release-target identity, and a dedicated security review.

```sh
npm run test:guardian     # offline policy tests
npm run guardian:report   # local unsigned advisory JSON, uses fixed files
```

Details: [Release Guardian R6](docs/GUARDIAN.md).

## R7: The Dependency Vault (npm lockfile integrity)

R7 replaces floating transitive resolutions at install time with a **committed npm v3 `package-lock.json`**. It was resolved using a Node 22 GitHub Actions runner and checked into this repository, and the one-off bootstrap workflow was removed. CI and GitHub Pages now install using `npm ci` rather than `npm install`. This gives **reproducible dependency resolutions under the same platform/toolchain**, not deterministic identical binary artifacts across machines.

The `scripts/provenance-core.mjs` verifier checks exact `package.json` root and direct dependency declarations against the lockfile. It catalogs the entire lock graph including optional/platform and dev packages, lockfile SHA-256, package version, registry origin, and SHA-512 integrity metadata, then generates a public unsigned report displayed by the **Dependency Vault** panel.

```sh
npm run provenance:verify
npm run test:provenance
npm run provenance:report
```

**Scope is honest:** this report is a lockfile **declaration**, not a server inspection or signed SBOM. Installed optional packages vary by platform, and the generated report is not independently attested by a trusted signer. Registry integrity hashes alone do not prove that a package is safe, correctly maintained, or free of malicious code. **R6 Guardian's independently verified SBOM and deployment attestation controls remain UNKNOWN** until a separate genuine provenance milestone.

See [R7 Supply Chain documentation](docs/PROVENANCE.md).

## R8: Artifact Witness (whole-build integrity)

R8 adds `scripts/artifact-core.mjs`, an **unsigned, deterministic static-build fingerprint**. After `npm run build`, the new `artifact:stamp` command lists **every file in `dist/` other than the manifest itself**, records exact byte sizes and SHA-256 digests, and derives a root SHA-256 over a sorted, canonical file listing. It also records source manifest/lockfile SHA-256 values and an optional GitHub commit claim.

`artifact:verify` independently re-reads the built files and **fails** if any file is changed, removed, added, or replaced by a symlink. CI and GitHub Pages now run **stamp → verify** after building. Mutation tests deliberately corrupt bytes and prove detection.

```sh
npm run build
npm run artifact:stamp
npm run artifact:verify
npm run test:attestation
npm run test:custody
npm run test:incident
npm run test:recovery
npm run test:artifact
```

The R8 **Artifact Witness** panel loads the published manifest and lets visitors re-download **only same-origin static files** and rehash them in the browser to check their bytes against the self-published manifest. This is a meaningful drift detector, **not independent source authenticity or a signed attestation**. A malicious publisher can change both the manifest and files. The generated manifest is excluded from its own hash inventory to avoid a circular digest; a future third-party signature or external trust anchor is needed to protect it.

R6 Guardian's independently verified deployment attestation remains **UNKNOWN**. No production release is blocked or certified. See [R8 Artifact Witness](docs/ARTIFACT.md).

## R9: Attested Build Manifest (GitHub/Sigstore provenance)

R9 adds a **real, native GitHub artifact-attestation issuance step** for the completed R8 build manifest `dist/artifact-manifest.json` using `actions/attest@v4`. GitHub's Actions OIDC identity is used to request a short-lived Sigstore signing certificate. The signed provenance is published to GitHub's attestation service, rather than to or solely by the Pages site.

The Pages build job requests `id-token: write` and `attestations: write` **only in the deployment workflow**. Pull-request CI retains `contents: read`. Before uploading Pages, the workflow must verify the newly signed subject using GitHub CLI and enforce both the exact signing workflow `MichaelWave369/WhiteHatLedger369/.github/workflows/pages.yml` and `refs/heads/main` source ref. A failed or missing attestation now fails that Pages build; it cannot silently publish a new build as successful.

**Independent verification, once the post-merge Pages run issues an attestation:**

```sh
# Download CURRENT published bytes of the attested manifest.
curl -fL -o artifact-manifest.json https://michaelwave369.github.io/WhiteHatLedger369/artifact-manifest.json

# Install and authenticate GitHub CLI if needed, then independently verify:
gh attestation verify artifact-manifest.json \
  -R MichaelWave369/WhiteHatLedger369 \
  --signer-workflow MichaelWave369/WhiteHatLedger369/.github/workflows/pages.yml \
  --source-ref refs/heads/main
```

The page has an R9 "Independent Witness" panel that shows the SHA-256 of the **delivered** manifest and gives these verification instructions. The browser intentionally shows **NOT VERIFIED HERE** instead of a fake green attestation badge.

**Limitations:** A PR green CI check cannot demonstrate attestation issuance. Only a successful **main** Pages run can do that. The attestation binds GitHub's workflow identity to the manifest **bytes**; verifying the separately served static files against the manifest still requires R8. Neither action proves freedom from vulnerabilities, real ownership consent, uncompromised build tools, nor a secure production deploy. R6 Guardian stays advisory and its unresolved evidence remains UNKNOWN.

See [R9 independent build provenance](docs/ATTESTATION.md).

## R10: Public Chain of Custody (post-deploy byte reconciliation)

R10 closes the gap between a **signed build manifest** and the **actual bytes served by GitHub Pages**. R9 already produces a real GitHub/Sigstore attestation for the R8 manifest. R10 adds a **separate post-deployment read-only job** to `.github/workflows/pages.yml`. Once Pages deployment succeeds, that job:

1. Reads the **exact SHA-256 digest of the completed build's manifest** from the build job output. It does **not** substitute whatever digest the public site happens to provide.
2. Downloads the actual public `artifact-manifest.json` from the fixed, owned GitHub Pages site, verifies its exact digest and expected commit.
3. Runs GitHub CLI `gh attestation verify` on the **downloaded bytes**, requiring the exact `pages.yml` workflow identity, `refs/heads/main`, **the precise source commit digest**, and disallowing self-hosted runners.
4. Downloads **every asset listed by the already validated manifest** from the same first-party GitHub Pages origin and verifies each SHA-256 and byte count against it.
5. Writes an **unsigned custody observation** to the workflow run and reports success or failure, with an explicit link to the evidence and uncertainty in the dashboard.

R10's job is scoped to public files under `https://michaelwave369.github.io/WhiteHatLedger369/` and the associated GitHub attestation service only. It takes no target URL arguments, credentials to other systems, GitHub write permissions, or arbitrary executable scripts.

**Crucial limit:** The reconciliation job runs **after deployment**. Failure marks the post-deploy workflow incomplete/failed, but it cannot magically roll back a site already served. It does not claim the content is vulnerability-free or that the underlying CI runner was uncompromised. R6 Guardian remains broader **advisory only**.

**PR-only CI cannot prove this post-deploy verification succeeded**, because the job only runs after merge and an actual Pages publication. Offline tests verify the matching algorithm, fail-closed controls, and first-party scoping.

```sh
npm run test:custody
```

See [R10 Public Chain of Custody](docs/CUSTODY.md).

## R11: Incident Desk (advisory post-deployment response)

R11 adds **deterministic, read-only incident and recovery packets** to the R10 post-deploy custody job. The workflow now runs the R11 incident classifier **even if the R10 custody check fails**. It retains `custody-report.json` and `incident-report.json` side-by-side as unsigned GitHub Actions artifacts (30-day retention) and adds a structured operator checklist to the Actions job summary.

The classifier recognizes:
- `NO_CUSTODY_INCIDENT_OBSERVED`: an internally consistent R10 observation reports matching hosted bytes and a GitHub-verified attestation. **Not** a security certification.
- `REVIEW_REQUIRED`: verification explicitly failed, an observation was inconsistent, or it named the wrong source commit/manifest digest.
- `UNASSESSED`: no usable observation exists. Missing evidence **never** becomes a silent PASS.

Each packet includes a deterministic ID based on the run, source commit, expected manifest digest and incident class, a named provenance limitation and five operator-only steps: **preserve, independently verify, diagnose, authorize, retest**.

The **Incident Desk** dashboard reads the latest four public GitHub Actions runs and their post-deployment job results. It displays workflow status only and clearly distinguishes that from a cryptographically independently audited incident register.

**There is NO automatic rollback, re-deploy, issue creation, credential rotation, remediation or operator-closure action.** The site may already be live when a custody error occurs. A subsequent green run cannot delete the earlier failed run or certify incident closure.

```sh
npm run test:incident
```

See [R11 Incident Response](docs/INCIDENT.md).

## R12: Recovery Proposal Forge (manual owner approval, no execution)

R12 adds an interactive **browser-local proposal studio** and independent Node verification for **unsigned recovery review drafts**. A draft binds the R11 incident ID, run number, original commit and manifest SHA-256 to a distinct 40-character recovery candidate commit and 64-character build-manifest SHA-256. Operator reason, potential user impact and a bounded review deadline are part of the fixed canonical JSON; SHA-256 fingerprints the entire draft.

The studio can **export** a local JSON proposal or check another local R12 JSON for self-consistency, time limit and fixed scope without uploading the file. The Node verifier checks the same schema and fingerprint:

```sh
npm run test:recovery
node scripts/recovery-verify.mjs path/to/draft.json
```

**This is NOT a signed owner approval and has no execution capability.** The immutable *references* are exact commit/digest strings, but they are **operator input**, not independently verified release provenance. Anyone can recompute a plain SHA-256 digest; R12 signatures and owner identity are deliberately **not implemented**. Drafts remain `NOT_GRANTED_REQUIRES_INDEPENDENT_OWNER_AUTHORIZATION`, `UNVERIFIED_OPERATOR_CANDIDATE`, `DISABLED_NO_TOOL_ACCESS`. There is **no GitHub write token, rollback, auto-deployment, issue creation or incident closure**.

The R11 incident packet must be separately inspected, the candidate source/build provenance verified independently, and the asset owner must authorize any real recovery with trustworthy evidence. The existing R10 deployed-byte custody control remains separate. See [R12 Recovery Review](docs/RECOVERY.md).

## Run locally

Requires Node.js 22+.

```sh
npm ci
npm run dev
npm run check
npm run test
npm run test:sentinel
npm run test:minotaur
npm run test:evidence
npm run evidence:verify
npm run test:guardian
npm run guardian:report
npm run provenance:verify
npm run test:provenance
npm run provenance:report
npm run test:artifact
npm run build
npm run artifact:stamp
npm run artifact:verify
```

Vite uses a `/WhiteHatLedger369/` base path for GitHub Pages. In production, visit `https://michaelwave369.github.io/WhiteHatLedger369/` after Pages deployment succeeds.

The browser calls GitHub's unauthenticated public REST API. GitHub's anonymous rate limit may temporarily block requests. The UI shows an error instead of declaring an incomplete inventory complete.

## Deploy

1. Merge R0 once CI checks pass.
2. In **Settings → Pages**, set **Build and deployment → Source: GitHub Actions**.
3. The included Pages workflow builds and publishes on pushes to `main`, daily schedule, or manual dispatch. If Pages is not enabled for the repository, the deploy step may fail until enabled.
4. Never put a PAT, GitHub App private key, or any secret in browser JavaScript or a `VITE_*` variable.

## Security and governance

This public dashboard has no authenticated scanner or active-testing capability. R1's non-invasive advisory lookup runs in GitHub Actions against this project's own direct declared npm dependencies only. Private repo scans and cross-project advisory monitoring require a later, least-privilege, explicitly authorized backend.

Read [Security Policy](SECURITY.md), [Threat Model](docs/THREAT_MODEL.md), and [Roadmap](docs/ROADMAP.md).

- **Consent before contact.**
- **Receipts over vibes.**
- **Public verifier, private keys.**
- **Unknown is never equivalent to secure.**

The R2 Gauntlet, R3 browser Minotaur, R4 agent-grant demo, R5 Evidence Ledger is a synthetic demonstration, and R6 Release Guardian is explicitly advisory-only, never substitutes for authorized testing of production systems. The R3 optional local Docker fixture performs only a bounded configuration smoke test. The original WhiteHatLedger369 Ethical Reverse Lab master specification was drafted June 20, 2026. R0 implements only the inventory foundation, not the full specification.

MIT licensed. Copyright © 2026 Michael Hughes.
