# R0 / The Watchtower: threat model and assurance boundaries

**Status:** R0 design / scope frozen for PR #1. **Purpose:** visibility, not vulnerability detection.

## Trust boundaries

1. The browser is an untrusted presentation environment.
2. GitHub's public REST API is an external data source, not an assurance authority.
3. Repo names, descriptions, languages, and links are untrusted text and must be rendered by React as text, never injected as HTML.
4. The public web app does **not** hold tokens, private credentials, or repo-admin permissions.
5. No network contact occurs beyond GitHub public API requests and loading optional font resources from Google Fonts. Font loading does not affect inventory correctness.

## Risks and controls

| Risk | R0 control | Residual risk |
| --- | --- | --- |
| False sense of protection | Every active repo is UNASSESSED; UI explicitly says no security scanning | Users may still mistake metadata cues for vulnerabilities |
| API rate limits | Paginated requests, HTTP status handling, no partial-snapshot success | Public API can be unavailable; no server-side fallback |
| Missing repos | Stop and reject incomplete pagination; only public repos owned by selected user are in scope | Private, organization, and collaborator repos deliberately excluded |
| Injection in descriptions | React escaped text rendering; no dangerous HTML rendering | External links target GitHub and open in another tab |
| Token leakage | No login, token entry, or authenticated browser requests | Browser extensions and network intermediaries are outside app control |
| UI stale | Capture timestamp and manual refresh | Data can change immediately after capture |
| Supply chain | Dependabot and CI checks; pinned direct package versions | No committed lockfile yet; transitive versions not reproducible |
| Untrusted execution | None exists in R0 | Later modules require server-side sandboxing and explicit authorization |

## Observations versus findings

**Observations** in R0 are public metadata facts: languages, archival flags, Pages settings, license metadata, and last push timestamps.

**Metadata review cues** are reminders, not vulnerabilities. Neither missing descriptions nor unknown license metadata nor old push timestamps demonstrate a security issue.

**Findings** (not implemented in R0) require a tested assertion, scope and consent receipts, artifact hashes, proof, severity justification, remediation, and independent retest.

## Phase gates

- R0: public read-only inventory only.
- R1: server-side authenticated advisory checks with least-privileged access, explicit secret boundaries, and proof provenance.
- R2: authorized non-destructive testing in isolated labs.
- R3: hard isolation for risky workloads; decoys never replace OS-level containment.
- R4+: agent grants scoped by tool, target, expiry, and operator approval.

The WhiteHatLedger369 master principle is **"Public verifier, private keys."**
