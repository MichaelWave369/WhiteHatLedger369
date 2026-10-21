# Security policy

WhiteHatLedger369 is a defensive, consent-first security project.

## Reporting

**Do not post working exploits, tokens, personal data, or sensitive attack details in public issues.** Use the repository's **Security → Report a vulnerability** private reporting flow if enabled. If it is not available, open a public issue requesting a private disclosure channel **without** including the vulnerability details.

## Authorized scope

The R0 Watchtower performs **only read-only requests to GitHub's public repository metadata API**. It does not grant permission to probe, attack, scrape protected content, exploit, or access any other system. Ownership of a GitHub repository does not by itself authorize testing its third-party integrations, hosting platforms, or users.

R2's WhiteHat Gauntlet is a self-contained, simulated training lab: only inert `lab://` fixtures and in-memory policy checks run. Its adversarial probes never access live systems, issue HTTP requests, or execute third-party code. Exported results are unsigned and do not certify deployed software.

R3 adds an **inert browser-only capability ladder** and an optional local Docker smoke test for a fixed harmless checked-in script. Running the local smoke test requires explicit opt-in and control of a trusted Docker daemon. Neither path authorizes executing arbitrary external code or third-party tools.

Future **real-target** testing modules must verify written target scope, ownership/consent, time limits, tools, evidence limits, and stop conditions before taking an action.

## Supported version

- R0 inventory is not a security scanner; R1 is only a limited OSV advisory observation; R2 and the R3 browser ladder are synthetic simulators; R3's separate local Docker runner only checks a bounded benign fixture.
- No build, check, or dashboard badge constitutes a security certification.
- Vulnerability findings require independently reproducible evidence, a patch or risk-acceptance decision, and a retest receipt.
