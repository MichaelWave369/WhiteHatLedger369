# R10: Public Chain of Custody

## Mission

R9 issues GitHub/Sigstore provenance for the R8 manifest while files are still in the GitHub Actions builder. R10 verifies that the **actual public files delivered by GitHub Pages** correspond to that exact attested manifest. This introduces a real cross-boundary consistency check between builder, GitHub's attestation service and hosting origin.

## The exact post-deploy verification contract

`.github/workflows/pages.yml` keeps the existing main-branch Pages build/deploy jobs. It now records `SHA256(dist/artifact-manifest.json)` as a **job output** after R8's stamp-and-verify stage. Only the build job holds signing/OIDC privileges. The separate `custody` job runs after both successful `build` and `deploy`, with `contents: read` and `attestations: read`.

The custody verifier `scripts/custody-verify.mjs` performs:

1. **Exact expected digest:** Require a 64-hex job-output `EXPECTED_MANIFEST_SHA256` and 40-hex workflow `GITHUB_SHA`.
2. **Public source:** Download `https://michaelwave369.github.io/WhiteHatLedger369/artifact-manifest.json`, with body-size limits, no redirects and no credentials.
3. **Builder/host equality:** SHA-256 of downloaded manifest must match the **build job's digest**, not one supplied by the Pages host. The manifest must be a valid R8 schema, with matching `source.git_commit`.
4. **External signer trust:** Run `gh attestation verify` on downloaded bytes, scoped to `MichaelWave369/WhiteHatLedger369`, exact `pages.yml` signer workflow, `refs/heads/main`, exact `GITHUB_SHA`, and deny self-hosted runners. Fail closed unless GitHub CLI/Sigstore verifies.
5. **All public assets:** For each path enumerated by the validated R8 file-list manifest, download only from the fixed `michaelwave369.github.io/WhiteHatLedger369/` prefix, compute SHA-256 and verify byte length. Report any difference or missing file.
6. **Evidence handling:** Publish a small unsigned JSON observation to the workflow artifacts and GitHub Actions job summary. It identifies what was checked and its limitations.

At most five attempts with a short delay are used because GitHub Pages/CDN propagation may temporarily lag the deploy API. Persistent mismatch fails the job.

The dashboard's **Delivery Witness** panel fetches public GitHub Actions run/job status metadata only. A green job represents GitHub's claim about these checks, not a cryptographic proof that the visitor's browser verified anything itself. Users can independently download the manifest and run the R9 `gh attestation verify` command.

## Security limitations

**This check is POST-deployment.** A failed custody job marks the workflow red, but the Pages deployment is already live. The code does not implement rollback, blocking production policy, revocation, owner authorization, incident containment, or a public security certificate.

An attacker who can change both builder code and the trusted signer workflow might generate a legitimately signed malicious manifest. GitHub/Sigstore validates the issuer and signed bytes, not whether the app is safe. Hosted file hashes validate delivered content relative to that manifest, not the absence of malicious behavior. The public report is unsigned and comes from GitHub Actions. It cannot by itself independently prove the runner was uncompromised.

No external targets, developer secrets, Docker daemon, untrusted scripts, or privileged agent permissions are contacted by R10.

## Tests and observability

```sh
npm run test:custody
```

Offline tests cover correct signed-manifest input assumptions, exact digest mismatch, wrong commit, byte changes of the same length, missing files, unsupported manifest schemas, and fixed network/signer scope constraints.

**Real post-deploy success cannot be claimed until this PR is merged and the new Pages workflow's `custody` job completes successfully.** PR CI only verifies unit tests and static workflow code.

## Next work

Real release assurance requires branch protections, independently trustworthy deployment signing, durable receipts, secure rollback policy, independently documented owner consent, and vulnerability/patch evidence. R6 Guardian keeps these missing production facts UNKNOWN.

**Ledger above ego. A signed build must also be delivered faithfully.**
