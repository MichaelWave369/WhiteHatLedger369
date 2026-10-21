# WhiteHatLedger369 🛡️

**The Ethical Reverse Lab** | PHI369 Security & Adversarial Assurance

> Break only what you are allowed to heal. Test only what you own or are explicitly authorized to examine. Every action earns a receipt.

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
