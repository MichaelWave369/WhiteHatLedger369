# R9: The Independent Witness · GitHub/Sigstore artifact attestation

R9 adds **actual signing capability**, not just another local hash calculation. Its output is **restricted to the R8 build manifest file** and issued by GitHub Actions/Sigstore after merging to `main`.

## What is authenticated?

The action `actions/attest@v4` attests one file:

```text
dist/artifact-manifest.json
```

This is the R8 file that enumerates the completed production `dist/` file set and SHA-256 digests and excludes itself from its own root hash. GitHub Actions uses a short-lived OIDC-backed Sigstore certificate and uploads a SLSA provenance statement to GitHub. The signing key does **not** belong in a browser, source file, GitHub secret, or user-generated keypair.

No extra subject is signed. The actual attestation only exists **after a successful post-merge Pages run** with configured GitHub permissions. A static test of the YAML is not proof of issuance.

## Workflow isolation

`.github/workflows/pages.yml` is triggered by `main`, daily schedule, and workflow dispatch. Its `build` job receives `contents: read`, `id-token: write`, and `attestations: write`. The `deploy` job retains narrowly scoped `pages: write` and `id-token: write` for Pages publication. The separate `.github/workflows/ci.yml` handling untrusted pull requests has only `contents: read` and **cannot issue an attestation**.

Attestation is generated **after** `npm run artifact:stamp` and `npm run artifact:verify` and **before** `actions/upload-pages-artifact`. The Pages build will not proceed to upload unless `gh attestation verify` passes, scoped to:

- `-R MichaelWave369/WhiteHatLedger369`
- `--signer-workflow MichaelWave369/WhiteHatLedger369/.github/workflows/pages.yml`
- `--source-ref refs/heads/main`

The workflow uses a limited retry loop for possible API propagation delay but ultimately **fails closed**.

## Verifying the actual published manifest independently

Install GitHub CLI `gh` and ensure network access to GitHub's artifact attestation service. Then download the actual current manifest from GitHub Pages. Do not replace the downloaded bytes with an old local `dist/` copy:

```bash
curl -fL -o artifact-manifest.json https://michaelwave369.github.io/WhiteHatLedger369/artifact-manifest.json

gh attestation verify artifact-manifest.json \
  -R MichaelWave369/WhiteHatLedger369 \
  --signer-workflow MichaelWave369/WhiteHatLedger369/.github/workflows/pages.yml \
  --source-ref refs/heads/main
```

A successful `gh` exit code establishes that the downloaded manifest **matches a GitHub-issued signature and asserted workflow identity**, assuming GitHub/Sigstore trust roots and verification tools are trusted. On any failure, missing attestation, ref mismatch, or unknown signer, do **not** infer release legitimacy. Show **UNKNOWN / NOT VERIFIED**.

On Windows PowerShell you can download the manifest with `Invoke-WebRequest -Uri "https://michaelwave369.github.io/WhiteHatLedger369/artifact-manifest.json" -OutFile "artifact-manifest.json"`, and run the `gh` command on a single line.

For a fuller evidence inspection use `gh attestation verify artifact-manifest.json -R MichaelWave369/WhiteHatLedger369 --format json`, and inspect signer certificate identity and SLSA predicate cautiously. Predicate fields can reflect untrusted workflow-controlled statements; the validated certificate and subject digest carry the trust claim.

After GitHub signature verification, use R8 to compare all **actually hosted** static files against the manifest's checksums. GitHub Pages hosting is separate from attestation issuance.

## What remains UNKNOWN

- A PR green check says nothing about whether a future **main** attestation will be issued.
- A valid GitHub-issued attestation cannot establish that the builder ran non-malicious source, npm packages or scripts, or that the GitHub-hosted runner was uncompromised.
- Attestation does not prove asset-owner consent, user/security privacy guarantees, actual patch/retest validity, or absence of vulnerabilities.
- An attacker with permission to change the trusted main workflow may cause it to attest malicious bytes; protect branches, workflow edits, and dependencies separately.
- R6 Guardian **remains advisory only**. R9 adds one independently verifiable manifest-identity control, not proof that every required production security control is satisfied.

## References

- [GitHub artifact attestation how-to](https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations)
- [GitHub CLI attestation verification](https://cli.github.com/manual/gh_attestation_verify)

**Ledger above ego. A verifiable builder identity is a beginning, not the end.**
