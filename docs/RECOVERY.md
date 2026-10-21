# R12: Recovery Proposal Forge

## Scope and motivation

R11 retains post-deployment incident packets. R12 adds the first **non-executable, exportable recovery proposal** so that a human can review a candidate before any destructive or availability-impacting changes.

**Important:** R12 is a **drafting and self-integrity layer**, not a trusted approval service. Even a valid proposal has `approval: NOT_GRANTED_REQUIRES_INDEPENDENT_OWNER_AUTHORIZATION` and `execution: DISABLED_NO_TOOL_ACCESS`.

## Draft provenance fields

Each JSON draft uses `schema=whitehatledger369.recovery-proposal.v1` and is locked to repository `MichaelWave369/WhiteHatLedger369`. It requires:

- R11 incident ID, incident status REVIEW_REQUIRED or UNASSESSED, and full numeric Actions run ID.
- Exact source commit (40 lowercase hex) and exact failing source build-manifest SHA-256 (64 hex).
- Distinct proposed candidate commit (40 hex) and candidate build-manifest SHA-256 (64 hex).
- Reason, explicit risk/user-impact assessment, time of preparation, and a review deadline no more than 72 hours later.
- Fixed action `REQUEST_MANUAL_REDEPLOYMENT_REVIEW`; fixed candidate state `UNVERIFIED_OPERATOR_CANDIDATE`.
- Fixed non-approval and disabled execution states.

The fixed-format JSON payload is serialized in a published field order and hashed as `SHA256(UTF8("WHL369-R12-RECOVERY-DRAFT-V1\\n"+canonicalPayload))`. The draft's ID is a short prefix of that digest. The **entire digest** is recorded too. A string's full SHA does not independently verify a source commit or published artifact.

## Local workflow

1. Read the **retained** R11 incident packet from the affected GitHub Actions run and independently check that it belongs to this repo/run.
2. Identify a *distinct* proposed candidate source commit, and separately obtain the candidate's signed manifest/provenance from GitHub. R12 itself **does not check candidate existence or signatures**.
3. Enter reason and risk/impact text; generate an unsigned proposal draft in the browser.
4. Download and share its JSON through your own approved channels. It remains non-authoritative.
5. Use `node scripts/recovery-verify.mjs <draft.json>` or the browser's local-check control to catch accidental edits and expired review deadlines.

```sh
npm run test:recovery
node scripts/recovery-verify.mjs ./my-r12-draft.json
```

The CLI loads only the local file passed by the operator, enforcing an 8 KB maximum. It will exit unsuccessfully on an altered/expired/invalid draft and explicitly says a successful check authorizes **no deployment**.

## Why this does not authorize recovery

A SHA-256 hash has no owner-authenticity or key custody property. Anybody can write a new proposal and recompute that hash. There is no private signing key, verified owner consent, independent authorization service, release mutation, GitHub issue creation, rollback, incident resolution, or deployment action. A valid R12 draft cannot become `APPROVED` by editing JSON; such a file fails validation.

For future R13, independently signed owner approval needs trusted identity verification, issuer and audience binding, exact candidate provenance, scoped action, deadlines, nonce replay/revocation and an **independent trusted execution gateway**. Any such rollout requires new explicit owner authorization and threat-model review.

**Ledger above ego. A proposal earns review, not power.**
