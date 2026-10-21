# WhiteHatLedger369 🛡️

**The Ethical Reverse Lab** | PHI369 Security & Adversarial Assurance

> Break only what you are allowed to heal. Test only what you own or are explicitly authorized to examine. Every action earns a receipt.

## R0: The Watchtower

A **read-only, public GitHub repository inventory** built with React, Vite, and TypeScript.

**What works:** enumerate a user's owned public repositories (paginated, not just first 100), count active/archived and Pages-enabled repositories, search, filter by language or metadata cue, inspect last-push and license metadata, and follow links to GitHub. Every full snapshot includes a capture time; partial results are rejected if retrieval fails.

**What it does *not* do:** detect vulnerabilities, check PHP versions, inspect dependencies, read private repos, verify CI/security policies, scan secrets, run code, or execute any penetration testing. All active repos are **UNASSESSED**. "Metadata review" means an administrative hygiene reminder, **not** an actual vulnerability. Do not call R0 a security scanner.

## Run locally

Requires Node.js 22+.

```sh
npm install
npm run dev
npm run check
npm run test
npm run build
```

Vite uses a `/WhiteHatLedger369/` base path for GitHub Pages. In production, visit `https://michaelwave369.github.io/WhiteHatLedger369/` after Pages deployment succeeds.

The browser calls GitHub's unauthenticated public REST API. GitHub's anonymous rate limit may temporarily block requests. The UI shows an error instead of declaring an incomplete inventory complete.

## Deploy

1. Merge R0 once CI checks pass.
2. In **Settings → Pages**, set **Build and deployment → Source: GitHub Actions**.
3. The included Pages workflow builds and publishes on pushes to `main`. If Pages is not enabled for the repository, the deploy step may fail until enabled.
4. Never put a PAT, GitHub App private key, or any secret in browser JavaScript or a `VITE_*` variable.

## Security and governance

This public dashboard has no authenticated security-scanning capability. Private repo scans, code execution, and advisory monitoring require a later least-privilege server-side service and explicit authorization.

Read [Security Policy](SECURITY.md), [Threat Model](docs/THREAT_MODEL.md), and [Roadmap](docs/ROADMAP.md).

- **Consent before contact.**
- **Receipts over vibes.**
- **Public verifier, private keys.**
- **Unknown is never equivalent to secure.**

The original WhiteHatLedger369 Ethical Reverse Lab master specification was drafted June 20, 2026. R0 implements only the inventory foundation, not the full specification.

MIT licensed. Copyright © 2026 Michael Hughes.
