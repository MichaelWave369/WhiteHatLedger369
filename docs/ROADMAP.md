# WhiteHatLedger369 roadmap

## R0: The Watchtower (this pull request)
- Responsive React/Vite/TypeScript GitHub Pages UI.
- Read-only public repository discovery with pagination, error handling, timestamps, and status.
- Search, language filters, archived-state filters, metadata hygiene reminders.
- Explicit unassessed/unknown status; no false vulnerability verdicts.
- Tests, CI, restrictive workflow permissions, Dependabot.
- Threat model and disclosure policy.

## R1: Sentinel
- Authorized server-side dependency/advisory integration.
- Explicit provenance, timestamps, completeness, and confidence for every alert.
- Repository-by-repository opt-in scopes, least-privilege GitHub App access.
- Portable finding and triage receipts.

## R2: WhiteHat Gauntlet
- Local deliberately vulnerable targets and non-destructive scenarios.
- Written scope/consent checks before every run.
- Patch and retest receipts; no uncontrolled internet targets.

## R3: Minotaur Protocol (experimental)
- Progressive authorization restriction from normal to isolate/quarantine.
- Container/VM containment and syscall/network policy enforcement.
- Decoy environments for training only, never confused with security boundaries.

## R4: Agent authority
- Signed, expiring action grants and operator review.
- Threat modeling for prompt injection and confused-deputy behavior.

## R5+: Evidence and release gates
- Signed artifacts, provenance, custody links, build verification.
- Policy-controlled release gates that distinguish PASS / FAIL / UNKNOWN.

**Never infer an effective control from a design document alone.** Ship it, exercise it, collect receipts, and retest.
