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

## Run locally

Requires Node.js 22+.

```sh
npm install
npm run dev
npm run check
npm run test
npm run test:sentinel
npm run test:minotaur
npm run test:evidence
npm run evidence:verify
npm run build
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

The R2 Gauntlet, R3 browser Minotaur, R4 agent-grant demo, and R5 Evidence Ledger are synthetic demonstrations, never substitutes for authorized testing of production systems. The R3 optional local Docker fixture performs only a bounded configuration smoke test. The original WhiteHatLedger369 Ethical Reverse Lab master specification was drafted June 20, 2026. R0 implements only the inventory foundation, not the full specification.

MIT licensed. Copyright © 2026 Michael Hughes.
