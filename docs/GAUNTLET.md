# R2 WhiteHat Gauntlet: controlled simulation protocol

**Status:** Synthetic browser-local exercise engine. **No live target tests are authorized or performed.**

## Mission

Prove that a small, demonstrative policy engine can reject deliberately malformed requests and, just as importantly, that the test suite detects an intentionally weakened control. The Gauntlet is useful for engineering education and regression testing, not for certifying PHI369 infrastructure.

## Boundary definition

| Resource | Allowed in R2? | Notes |
| --- | --- | --- |
| Bundled `lab://whitehat369/*` fixture target strings | Yes | Inert identifiers, not network addresses |
| In-memory synthetic grant, nonce, and payload processing | Yes | No disk or backend mutation |
| Browser-native SHA-256 via Web Crypto | Yes | Content fingerprint, not a signature |
| User-clicked export of local JSON observations | Yes | Unsigned local file |
| Public/private repository scanning | **No** | R2 never reads repository code |
| Live HTTP probing or target URLs | **No** | URL-like strings are inert sample text only |
| Shell commands, sandboxed remote code, AI model calls | **No** | Not implemented |
| Production access control / agent hardening | **No** | Lab gate isn't a production service |

The GitHub API requests elsewhere on the Watchtower dashboard and Sentinel's pre-generated public report remain independent. **Clicking R2 controls never initiates a network request.**

## Frozen fixture cases

1. `OUTSIDE_SCOPE`: request outside the synthetic namespace.
2. `TARGET_SUBSTITUTION`: valid lab namespace but wrong exact target.
3. `EXPIRED_LEASE`: grant expiry.
4. `CAPABILITY_ESCALATION`: `mutate` under `observe`-only authority.
5. `RECEIPT_REPLAY`: duplicate nonce.
6. `ARTIFACT_TAMPERING`: changed bytes, unchanged expected digest.
7. `UNTRUSTED_INSTRUCTION`: inert lower-trust directive attempts an unauthorized `issue-grant` operation.

Each case must have **positive control = ALLOW**, **adversarial probe = BLOCK** to score PASS. Rejected positive controls also count as FAIL so a gate that simply blocks everything cannot win.

### Fault injection / negative control

`replay-disabled` bypasses the **training-only** seen-nonce check. That scenario is expected to FAIL; the other six should PASS. This demonstrates that the fixture pack is sensitive to a specific deliberately weakened control. No real application behavior is changed.

## Report semantics

The exported report uses schema `whitehatledger369.gauntlet.v1`, fixture-pack identifier, random run ID, local run timestamp, control/probe decisions with reason codes, failure counts, and disclaimers.

**This is an unsigned observation, not an externally trustworthy receipt.** The local user's browser controls the fixture and report. Reports do not establish custody, attested tool behavior, approved penetration-testing scope, or real production safety.

## Verification

```bash
npm run test
npm run check
npm run build
```

Automated tests cover all 7 scenarios, replay-fault sensitivity, SHA-256, scope boundaries, nonce reuse, privilege escalation attempts, payload integrity, and expiry.

## R2.1 / R3 later

A future authorized testing harness may consume signed scope grants and test only specifically permitted assets in an actual isolated process or container. It will require a separate security design review. Inert UI simulations are not an isolation mechanism.

**Working motto:** Break only what you are allowed to heal. Receipts over vibes.
