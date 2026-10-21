# R5 Evidence Ledger · independently verified synthetic receipts

## Status
**Real cryptographic primitives, synthetic evidence only. No production receipt signer, trusted issuer administration, or real security test is implemented.**

## Fixed demonstration record chain

The committed `public/evidence-ledger.json` carries exactly three examples:

1. **SCOPE:** a fictional `lab://whitehat369/evidence` training authorization.
2. **OBSERVATION:** a fictional policy check result, explicitly not a live test.
3. **RETEST:** a fictional regression test, explicitly not a deployed patch result.

All three have `provenance: "SIMULATED"`. No public or private repo, real infrastructure, credential, or AI agent is involved.

## Canonical format (frozen)

Each record has precisely these fields, in order:

```json
{
  "schema": "whitehatledger369.receipt.v1",
  "sequence": 1,
  "previous": "GENESIS",
  "subject": "lab://whitehat369/evidence",
  "kind": "SCOPE",
  "summary": "Synthetic lab:// scope recorded; no production target authorized.",
  "observedAt": "2026-10-21T12:00:00.000Z",
  "provenance": "SIMULATED"
}
```

Each record hash is `SHA256(UTF8("WHL369-R5-ENTRY-V1\\n" + JSON.stringify(record-fields-in-the-order-above)))`. The record's own `hash` field is **excluded** from the hashed payload.

Every record's `previous` field equals the previous record's hash, starting from the literal `GENESIS`. The checkpoint embeds the final hash and exact record count.

The checkpoint canonical string has fields (in order): `schema`, `ledgerId`, `issuer`, `recordCount`, `head`, `issuedAt`. It is signed over the UTF-8 bytes of `"WHL369-R5-CHECKPOINT-V1\\n" + JSON.stringify(checkpoint)` using Ed25519.

The public fixture verification key is **pinned in source**, not extracted from the supplied report:

```text
-Ym9ee4U6o3sgpBqnrXDwmLhJQ1Iv6TrYp5CiBeM2bQ
```

The signing private key was generated transiently to make the fixture, **not distributed or stored in the repo**. The public key is **only** a demonstration trust anchor. These records do not describe a real incident or attest a real patch.

## Independent verification

**Browser:** `src/lib/evidence.ts` computes hash links with Web Crypto SHA-256 and verifies the checkpoint with Web Crypto Ed25519.

**Node.js:** `scripts/evidence-verifier-core.mjs` independently reconstructs payloads and checks SHA-256 and Ed25519 using Node's built-in crypto implementation. The CLI only reads `public/evidence-ledger.json`; it does not accept URL targets or signing keys.

```sh
npm run test:evidence
npm run evidence:verify
npm run test
```

Negative controls mutate summary bytes, reorder entries, remove one, alter the signed checkpoint, and replace trusted issuer/subject metadata. These should all be rejected.

The browser also lets an operator select a **local** JSON file (64 KB max), check it using the fixed demo trust anchor, and export displayed JSON. A user-supplied public key never replaces the pinned trust key. Everything R5 verifies remains limited to this synthetic demonstration scope.

## Independent truth versus integrity

A valid hash chain establishes that the receipt bytes are *consistent with the signed head*. A matching signature establishes that a holder of the corresponding private signing key signed those bytes. Neither establishes the author actually performed the described work, obtained permission, repaired a vulnerability, or used an uncompromised host.

A public key delivered from the same site as the verifier **cannot protect against a compromise of that same site**; external trust-root distribution is required.

No persistent signing or revocation service, real provenance, release gate, or production patch/retest attestation exists at R5. Building such a system requires an independent threat model and consent-oriented rollout.

**Ledger above ego. Evidence is not belief.**
