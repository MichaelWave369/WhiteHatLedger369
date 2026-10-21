# R8 Artifact Witness · build-byte fingerprinting

**Status:** Real byte-by-byte fingerprinting of a local static build and optional hosted-file equality checks, but **unsigned and untrusted as independent deployment evidence**.

## Build pipeline

The existing GitHub Pages workflow performs:

1. `npm ci` using the committed dependency lockfile.
2. Existing offline tests and production app typecheck.
3. Generate current Sentinel, Dependency Vault and Guardian JSON.
4. `npm run build` to produce `dist/`.
5. `npm run artifact:stamp` to compute an exact inventory of built files, their byte lengths and SHA-256 digests.
6. `npm run artifact:verify` to **rescan** the built directory and reject changed, additional or removed files before upload.
7. Upload the Pages directory, including its self-reported manifest.

CI also stamps and verifies a local production build but does **not** publish it.

## Manifest format

`dist/artifact-manifest.json` is generated after the static build, with:
- `schema: whitehatledger369.artifact-witness.v1`
- `subject`, `generated_at`, `mode: SELF_REPORTED_BUILD_DIGESTS`
- SHA-256 of the checked-out `package.json` and `package-lock.json`
- optional claimed `GITHUB_SHA` (not a signature)
- exact sorted `[{path, bytes, sha256}]` over **all** static output files *except the manifest itself*
- a domain-separated SHA-256 root of the canonical sorted file list
- an explicit unsigned-data disclaimer.

The manifest excludes itself because including its own hash would create a circular claim.

Both CLI and browser enforce strictly relative paths, deterministic order, count and byte budgets. The CLI refuses symbolic links and special files, and compares the **complete** file set.

## Hosted self-check

The R8 panel can re-fetch same-origin static files declared by the manifest, compute their SHA-256 digests using browser Web Crypto, and display MATCH/MISMATCH/UNAVAILABLE. This is an actual byte-level consistency check for the user's currently served website **relative to that same website's manifest**.

**Security limitation:** An attacker who controls the website/CI may change the JavaScript verifier, manifest, and assets together. There is no independently distributed public key, external witness or attestation. Neither R8 checks nor hashes can certify the builder, GitHub Pages deployment identity, authorization scope, or absence of compromise. The R6 Guardian deploy attestation therefore remains **UNKNOWN**.

## Run and negative tests

```sh
npm ci
npm run test:artifact
npm run build
npm run artifact:stamp
npm run artifact:verify
```

The offline tests use temporary local files to establish that changed byte content, added/deleted entries, edited checkpoint values, source mismatches and symlinks cannot produce a successful verification.

## Next trust boundary

For independent source/build provenance, later work must issue signed attestations through an authenticated issuer (for example, an appropriately permissioned build attestation service) and verify them against a trust root outside the potentially compromised website. A release gate requires additional independent validation and owner-approved policy, not just more hash fields.

**Ledger above ego. A hash isn't a witness unless the witness can be trusted.**
