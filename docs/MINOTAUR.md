# R3 Minotaur Protocol · Simulation versus containment

## Mission

Demonstrate a property of **monotonically declining simulated authority** and separately provide an **opt-in** smoke test for selected container restrictions on a local machine.

This project intentionally separates three claims:

1. **Simulated policy:** a training state machine responds to six fixed synthetic events.
2. **Runtime configuration observation:** one harmless bundled file runs under explicit Docker restrictions when opted into by a local operator.
3. **Genuine hostile-code containment:** NOT implemented or proven in R3.

## Tier diagram

`NORMAL → WATCH → RESTRICT → SANDBOX → DECOY → ISOLATE → QUARANTINE`

| Tier | Simulated fixture capabilities |
| --- | --- |
| NORMAL | observe, inspect, simulate, export |
| WATCH | observe, inspect, simulate |
| RESTRICT | observe, inspect |
| SANDBOX | observe |
| DECOY | observe |
| ISOLATE | none |
| QUARANTINE | none |

The union of permissions can **never grow within a session**; post-quarantine events do not restore access. The UI has an explicit Reset Lab command because the simulator is deliberately user-controlled. **Reset has no authority over any actual process or user.**

The interactive `ALLOW_FIXTURE_ONLY` result is *not* an operation dispatch; `executed` is always false. Incident labels have no production telemetry attached. The state machine is for educational regression, not a real authorization layer.

## Isolated smoke test (local opt-in)

The optional runner `scripts/minotaur-container.mjs` is separate from the browser and GitHub Pages. Its only job is to run the fixed `lab/minotaur/fixture.mjs` in a local, Docker-managed container.

Explicit Docker runtime arguments include:

- `--pull=never`: avoid automatic retrieval of an unreviewed image
- `--network=none`: disable the container's network interface beyond loopback
- `--read-only`: immutable container root filesystem
- `--cap-drop=ALL`: remove Linux capabilities
- `--security-opt=no-new-privileges`: block privilege elevation via exec
- `--pids-limit=32`, `--memory=128m`, `--cpus=0.5`: resource bounds
- `--user=65534:65534`: nonroot uid/gid
- `--tmpfs /tmp:rw,nosuid,nodev,noexec,size=16m`: small isolated temporary area
- A **read-only bind mount** containing only the bundled fixed source directory. No Docker socket or repository root bind.

The fixture checks UID, effective capability set, no-new-privileges, root and fixture mount flags, denied writes, and interface list. **An observed check passing is not proof against kernel bugs, Docker escapes, or a malicious daemon.**

The image is intentionally operator-reviewed and locally available. `node:22-alpine` is a mutable tag, and **not a trusted digest-pinned supply-chain artifact**. A future hardening milestone should pin a trusted immutable digest and provide signed image provenance and a dedicated VM isolation policy.

### Commands

Windows PowerShell:

```powershell
docker pull node:22-alpine
$env:MINOTAUR_CONFIRM = 'synthetic-only'
npm run minotaur:smoke
```

Bash:

```bash
docker pull node:22-alpine
MINOTAUR_CONFIRM=synthetic-only npm run minotaur:smoke
```

This **does not run automatically in CI**. CI runs static argument tests and browser unit tests, not a container or attacker-provided payload.

### Safety and stop conditions

- Do not grant web visitors or autonomous agents access to the Docker daemon.
- Do not mount source repositories with secrets or the Docker socket.
- Do not replace the fixed local fixture with external downloaded scripts.
- Do not treat Docker alone as hardened sandboxing for arbitrary malicious code.
- Failed or unavailable Docker smoke checks are UNKNOWN/FAIL, never PASS.
- Never scan or access targets outside written consent and validated scope.

## R3 evidence

- Vitest unit tests verify tier transitions, monotonicity, quarantine terminal behavior, and fixture-only non-executing decisions.
- Node offline runner tests assert the presence of required restrictive Docker arguments; they **do not attest runtime behavior**.
- Optional smoke output is unsigned JSON with observed runtime checks and explicit disclaimer.

**Ledger above ego. The design is not the evidence.**
