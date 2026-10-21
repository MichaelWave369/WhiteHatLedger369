# R11: Incident Desk and Recovery Ledger

## Why R11 exists

R10 verified that the GitHub Pages site actually served bytes matching its Sigstore-attested manifest. A future failed post-deployment job does not undo a deployment and cannot safely be treated as self-healing. R11 preserves a reviewable packet and makes a human-controlled recovery process explicit.

## Workflow and evidence

R11 augments the existing `custody` job, which starts **only after** successful Pages build and deployment. It remains `contents: read`, `attestations: read`. After attempting R10 reconciliation, R11 runs `node scripts/incident.mjs` under `if: always()`. The job then uploads both `custody-report.json` and `incident-report.json` as GitHub artifacts with 30-day retention. Each is **unsigned** and should not be considered immutable independent evidence.

A generated packet contains:

- A deterministic incident ID derived from GitHub run ID, source commit SHA, exact expected manifest SHA-256, outcome and evidence classification. **Not a cryptographic signature.**
- One of `NO_CUSTODY_INCIDENT_OBSERVED`, `REVIEW_REQUIRED`, `UNASSESSED`.
- The matching run/commit/manifest digest, provenance limitation, error label, and explicit `POST_DEPLOY` timing.
- Five operator response steps and a **zero-length** allowed-automatic-actions list.
- An explicit denial of automated closure; historical failures must not be overwritten or silently forgiven.

If the R10 check failed before it could produce a readable observation, the incident packet says **UNASSESSED**. If a custody record is present but its commit/manifest digest does not match, or if reported file/attestation counts are partial, it becomes **REVIEW_REQUIRED**. A complete consistent signed-manifest and hosted-byte observation records no new custody incident, but not an overall security certification.

## Operator response protocol

1. **Preserve:** Keep the workflow URL, source/manifest hashes, custody output, packet and GitHub job logs. Never replace the original evidence in place.
2. **Verify:** Independently download the *live* manifest, validate GitHub/Sigstore provenance for the exact workflow and source commit, and compare listed served bytes.
3. **Diagnose:** Check deployment freshness and CDN propagation, missing files, source mismatch and suspicious differences. A mismatch is an observation, not proof of attack.
4. **Authorize:** The affected asset owner reviews proposed response, impact and rollback target. A future mutating tool must require separately proven scoped authorization and recorded human approval.
5. **Retest:** Preserve a fresh build/custody run as new evidence. Do not automatically close prior incidents after a successful subsequent run.

## What this does *not* do

R11 does not mutate a repository, trigger deployment/rollback, alter branch protection, create GitHub issues, send emails, rotate secrets, connect to private services, or declare a vulnerability patched. Failure to fetch public GitHub Actions metadata is **UNASSESSED**, never proof of zero incidents.

The public UI uses GitHub's unauthenticated Actions metadata and may hit rate limits. These displayed statuses are GitHub claims about the workflow, **not independently authenticated incident records**. The packet retained as a workflow artifact is likewise unsigned. Independent evidence custody and signed operator closure are future work.

## Verifying

```bash
npm run test:incident
npm run check
npm run test
npm run build
```

Test cases cover complete success, missing observations, failed records, mismatched commits/digests, partial asset checks, deterministic ID generation, and read-only workflow privileges.

**PR-only CI cannot prove a new incident packet was actually retained by a post-merge workflow.** Its runtime behavior must be inspected on a subsequent successful Pages deployment and custody run.

**Ledger above ego. Red deserves investigation, not automatic amnesia.**
