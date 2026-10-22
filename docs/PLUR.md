# R13: SuperWhiteHat PLUR Division

**Status:** heuristic repository-source scanner, deterministic unsigned receipts, and read-only dashboard. **Not** a security certification, general-purpose malware detector, or a mechanism that controls independently operated forks.

## Four principles, narrow measurable rules

- **Peace:** PLUR-P-001 blocks immediate evaluation of decoded payloads; PLUR-P-002 blocks download-and-execute shell pipeline patterns.
- **Love:** PLUR-L-001 sends probable literal credentials to human review; PLUR-L-002 sends committed environment-secret filenames to review.
- **Unity:** PLUR-U-001 flags explicit local PLUR disable/skip indicators for review.
- **Respect:** PLUR-R-001 flags environment-derived outbound fetch expressions; PLUR-R-002 flags broad filesystem permission assignments.

These are **heuristic matches, not established intent**. No behavioral execution, complete data-flow analysis, or malware classification is performed. A dangerous implementation may evade all rules and return PASS.

## Try it

Requires Node.js 22+. From this repo root:

    npm run test:plur
    npm run plur:check
    npm run plur:report

The reusable checker is also callable on another local project directory:

    node scripts/plur.mjs check /path/to/project

Copy the controlled policies/plur-v0.1.json manifest into that project for the advisory tool to assess it. **A local PASS is not a certified release.**

The scanner reads regular files only. It will not execute inspected code, pull dependencies, contact target websites, access GitHub credentials, or mutate the inspected project (except for the opt-in report command, which writes public/plur-report.json). Symlinks are not followed; their presence produces UNKNOWN. Missing, invalid, or altered policy manifests also produce UNKNOWN. The scanner excludes docs, generated/vendor folders, tests, and lab fixtures, limits size/depth/file count, and checks only selected source/config extensions. **Anything outside these boundaries is unassessed.**

The policy manifest is compared with the frozen expected policy inside scripts/plur-core.mjs. Altering only the policy JSON makes the check UNKNOWN; replacing both the manifest and verifier defeats this local check. A fork can remove the workflow altogether.

## Verdicts and CI behavior

- **BLOCK:** a recognized disallowed static rule matched.
- **REVIEW:** ambiguous security indicators require manual review.
- **UNKNOWN:** missing policy, incomplete coverage, or unreadable source prevents PASS.
- **PASS:** no listed rule matched the scanned subset and no reported coverage failure occurred. Never equate with harmlessness.

BLOCK outranks UNKNOWN; UNKNOWN outranks REVIEW; REVIEW outranks PASS. There is **no automated approval exception**. The check command exits nonzero unless the verdict is PASS. PR CI and the main Pages build both run offline tests and this source scan. In an upstream GitHub repository, preventing a merge additionally requires the owner to set this status check as **required** in an independently controlled branch ruleset. Only the owner-controlled Pages workflow can enforce checks for the owner-controlled publication path. An attacker-controlled fork cannot be prevented from compiling elsewhere.

The published public/plur-report.json is a build-produced **unsigned** observation, with SHA-256 hashes for the scanned source bytes, policy manifest, and receipt. A digest commits to bytes only; it is not a signature, authenticated provenance, protected issuer identity, or proof of risk elimination. The optional source commit is a **CI-provided claim**, not verified by this CLI. R9/R10 signing and custody protect the release manifest and hosted bytes under their separate existing threat boundaries; they do not make the scanner comprehensive.

## Threats, bypasses, and review process

Attacks not detected include split-line payloads, AST transforms, dynamic imports, indirect calls, generated code, non-scanned file types, hidden scripts in excluded paths, dependency attacks, hostile CI definitions, or a completely replaced scanner. Patterns can also generate false positives on authorized admin tooling or security labs.

Review evidence manually, confirm authorization and context, document reasoning and remediation in a PR, add regression tests for proven patterns, and require human approval for any justified exception. **Do not silently rewrite rules to achieve green.** Production policy sign-off, externally pinned verifier identity, GitHub ruleset enforcement, release signing eligibility, key management, independent review, and cross-repository rollout require later milestones.

Ledger above ego. Evidence above promises. PLUR by design.
