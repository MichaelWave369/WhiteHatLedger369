# R7 Dependency Vault · Lockfile resolution evidence

R7 addresses a concrete supply-chain gap in WhiteHatLedger369: previously, all CI and Pages builds invoked `npm install` against exact direct dependency versions but **unlocked transitive** resolutions.

## What R7 does

1. Commits a lockfile v3 generated on a GitHub Actions Node.js 22 runner. The temporary bootstrap workflow used to recover that lockfile was **removed before this PR**.
2. CI and Pages run `npm ci --no-fund --no-audit`. A missing or inconsistent lockfile now causes installation failure.
3. Offline checks validate the root project identity and exact manifest-to-lock dependency declarations. Each locked entry is inventoried for its version, npm registry URL and SHA-512 integrity.
4. A build-time report in `public/provenance-report.json` records lockfile and manifest SHA-256 fingerprints, full lock-entry metadata, optional/development counts, and what remains unknown.
5. Browser displays the full **lockfile declaration graph**, not an installed-package attestation.

## Boundaries and unresolved risks

| Check | R7 observation | Meaning |
| --- | --- | --- |
| Manifest ↔ lock root agreement | PASS when exact | Locked direct declarations match |
| npm registry and SHA-512 metadata | PASS when complete | Integrity metadata exists; npm can validate downloads against the committed digest |
| Installed dependency tree | UNKNOWN | Platform-specific optional binaries may be skipped; no independent machine measurement |
| Deployed artifact provenance | UNKNOWN | No cryptographically signed build identity or deploy fingerprint |
| Vulnerability status | Not established here | Sentinel's separate OSV check covers direct exact versions only |
| Real production security approval | UNKNOWN | Guardian remains advisory, no release gate |

**The lockfile is a better source of reproducible resolutions, not proof of deterministic binary outputs.** npm lifecycle scripts still execute during `npm ci` and would need a separately reviewed trust boundary. The GitHub-hosted runner can be compromised; its unsigned report does not independently establish trust.

## Operator verification

```sh
npm ci
npm run provenance:verify
npm run test:provenance
npm run provenance:report
npm run build
```

Never compare a freshly generated lock hash to a previously published value without also validating Git history and trust roots. Future work should add a signed SBOM, attested build-artifact digest and independent signer custody.

**Ledger above ego. A lockfile is evidence about declared dependencies, not evidence of a safe deploy.**
