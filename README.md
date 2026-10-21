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

## Run locally

Requires Node.js 22+.

```sh
npm install
npm run dev
npm run check
npm run test
npm run test:sentinel
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

The R2 Gauntlet runs local, inert synthetic exercises and never substitutes for authorized testing of production systems. The original WhiteHatLedger369 Ethical Reverse Lab master specification was drafted June 20, 2026. R0 implements only the inventory foundation, not the full specification.

MIT licensed. Copyright © 2026 Michael Hughes.
