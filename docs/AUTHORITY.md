# R4 Agent Authority · Signed demo grant verification

**Scope:** fixed signed sample, pinned Ed25519 public fixture key, local browser verification. **Status:** training demonstration, not deployed authority enforcement.

## Why this version exists

R2 established scenario-based positive and adversarial controls. R3 illustrated monotone capability reduction. R4 adds a **cryptographically authentic** fixture grant: an Ed25519 signature over exactly the signed claim bytes, with an application-specific domain separator.

Unlike a naïve text-only allowlist, a forged change to the signed payload fails signature verification. The sample is deliberately constrained to `lab://whitehat369/agent-demo`; no tool is executed.

## Grant shape (frozen R4 fixture)

- `schema`: `whitehatledger369.agent-grant.v1`
- `issuer`: `whitehat369-fixture-issuer`
- `audience`: `whitehat369-r4-lab`
- `subject`: `simulated-spv-agent`
- `resource`: `lab://whitehat369/agent-demo`
- `operations`: `["observe"]`
- `notBefore`: `2026-10-21T00:00:00.000Z`
- `expiresAt`: `2026-10-22T00:00:00.000Z`
- `nonce`: `demo-grant-01`

R4 verifies `Ed25519.Sign(privateKey, UTF8("WHL369-R4-GRANT-V1\\n" + payload))` using a pinned public key. The *transient* private sample signer was generated locally and was **not saved in source, uploaded as a file, or integrated with the browser**. The pinned demo key is not a production trust anchor. No live key issuance is implemented.

The example uses a frozen test time to keep historical cases deterministic. Using the actual current clock after expiration MUST return EXPIRED; historical replay-mode success is **not** current authorization.

## Test matrix

| Scenario | Expected outcome | Boundary demonstrated |
| --- | --- | --- |
| Signed baseline | ALLOW_FIXTURE_ONLY | Valid sample at frozen fixture time |
| Alter signed payload | DENY: SIGNATURE_INVALID | Integrity/authenticity rejection |
| Wrong key ID | DENY: KEY_NOT_TRUSTED | Key substitution fails closed |
| Wrong resource | DENY: RESOURCE_MISMATCH | Exact target binding |
| Disallowed operation | DENY: OPERATION_DENIED | Observe-only scope |
| Expired lease | DENY: EXPIRED | Signature remains valid but permission expires |
| Reuse nonce | DENY: REPLAY | Session-local replay prevention |

The browser never executes any operation. `executed=false` is part of every result. Browser local replay state is **not durable** and resets each session.

## Threat model: unresolved production requirements

1. **Issuer and identity:** a real system requires an independently maintained issuer trust store and authenticated operator consent.
2. **Key custody:** signing keys should live in a strongly controlled service or hardware-backed key manager; never browser public source or model context.
3. **Replay:** persistent, atomic one-time redemption across multiple processes, devices, and retries.
4. **Time:** trusted clock, short leases, server-controlled expiration, revocation, and skew policy.
5. **Authorization:** validate exact audience, subject, resource, operation, and contextual asset owner consent at a *trusted enforcement point*.
6. **Tool boundary:** production tool invocations must be intercepted at a server/OS-controlled gateway, not a web UI.
7. **Audit:** signed and independent receipts, provenance, disclosure-safe logging, and incident response.
8. **Agent risks:** prompt injection, confused-deputy behavior, key substitution, privilege escalation, cross-tenant scope, and compromise of the requesting agent.
9. **Browser compromise:** a modified page can spoof any visual outcome; client-side verification alone cannot protect a real tool.

## Verification commands

```sh
npm run test
npm run check
npm run build
```

Vitest includes actual signature verification, seven scenarios, time-bound expiry, audience and subject mismatch, replay, and tamper checks. No network, keys, privileged tools, or AI models are required.

## Integration roadmap

First prove independent cryptographic verification and immutable receipts; then propose a separate consent-reviewed trusted execution gateway for SuperPhiVessel. Do **not** give the public Watchtower app a token or make a browser verifier authoritative for live tools.

**Ledger above ego. Authorization must be enforced, not just displayed.**
