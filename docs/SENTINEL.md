# Sentinel R1: Security boundaries and claim policy

**Scope lock:** `MichaelWave369/WhiteHatLedger369` only, specifically the exact versions of *direct* npm `dependencies`, `devDependencies`, and `optionalDependencies` in the checked-out `package.json`.

This is a **passive OSV.dev vulnerability-advisory lookup**, not penetration testing. No other target is scanned, and no private credentials or user-supplied API base URLs are used.

## Data flow

1. GitHub Actions checks out this repository with `contents: read`.
2. `scripts/sentinel.mjs` reads the local `package.json`, rejecting malformed inputs.
3. `scripts/sentinel-core.mjs` extracts direct declarations and queries only exact semantic versions via HTTPS to the fixed URL `https://api.osv.dev/v1/querybatch`.
4. Each advisory ID is validated. Per-result OSV paging is followed to completion with a bounded loop.
5. A JSON observation with source SHA-256, commit ID, time, provider status, package status, and OSV IDs is written to `public/sentinel-report.json`.
6. Vite packages that JSON into GitHub Pages. The browser only **reads** and displays it.

## Truth table

| Situation | Display status | Claim permitted |
| --- | --- | --- |
| OSV responds completely with advisory IDs | MATCHED | OSV returned IDs for this name + version at scan time; independently triage before severity or exploit claims |
| OSV responds completely with no IDs | NONE REPORTED | No matching advisory ID *reported by OSV* for this name + version at scan time; **not** safe/secure |
| Unpinned version or non-registry spec | UNKNOWN | Actual installed version not established |
| OSV error, timeout, malformed response, incomplete paging | UNKNOWN | Source unavailable, no clearing assertion |
| Report missing, never run, or over 48h old | STALE / UNKNOWN | Nothing currently established |

Counts do not cover transitive dependencies, installed versions, PHP, server infrastructure, private repositories, or the Watchtower's other public inventory entries.

## Receipts and governance

R1 creates an **unsigned machine-readable observation**, not a signature-backed, tamper-proof security receipt. The SHA-256 field is a *claim* that will be independently verified in a later release. No repository passes a release security gate on the strength of this report.

## Operator commands

```bash
npm run test:sentinel
npm run sentinel:scan
```

The tests do not perform live API calls. The scan command performs a bounded read-only advisory lookup from the local project and writes the report.

## Future expansion

Lockfile/SBOM transitive coverage, source provenance verification, signed findings, and explicit permission-gated cross-project access are separate future milestones, not implicit R1 capabilities.

OSV endpoint documentation: https://google.github.io/osv.dev/post-v1-querybatch/
