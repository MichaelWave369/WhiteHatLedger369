# R14 · Identity Shield: privacy-first OSINT report review

Identity Shield is an **offline-in-browser report reviewer**, not a live scanner.
It adds an optional, consent-gated desk to the WhiteHatLedger369 GitHub Pages app.
No server, identity database, remote scan, Tor, proxy, webhook, MCP or third-party
script is embedded in the published site.

## Why import instead of running a scan on Pages?

[ALIENS EYE](https://github.com/arxhr007/Aliens_eye) is an independently
maintained Python username scanner (MIT licensed). A GitHub Pages React app is
a static site: it cannot execute Python, safely maintain an authorization
registry, or circumvent cross-origin access restrictions on 840+ platforms.
Pretending a button could perform those checks would be a security theater.

The R14 workflow:

1. Audit only your own accounts, or an account covered by express authorization.
2. Optionally run ALIENS EYE yourself **outside** WhiteHatLedger369 in a
   trusted local environment, following upstream documentation and site terms.
   Request its **JSON** output. Do not upload the report to GitHub.
3. Open WhiteHatLedger369, select **Identity exposure desk**, provide the
   local JSON file (or paste its contents), type its exact `base_username`,
   and explicitly affirm permission before clicking **Review import**.
4. Review the unverified source status categories and, if useful, download the
   **de-identified** local summary receipt.
5. Click **Clear memory** or close the tab to discard the imported report.
   Do not commit detailed profile reports or post them to public issues.

The **Synthetic demo** deliberately contains fake observations and does not
assert authorization or retrieve live profiles.

## Trust model

| Input | Trust and interpretation |
| --- | --- |
| `scan_summary.total_sites_scanned` | Third-party claim, not reverified |
| `variations[handle].sites[site].status` | Scanner report, **not** proof an identity exists |
| `confidence` | Scanner score, not independently validated probability |
| `Found` | Scanner-reported public presence; ownership remains unknown |
| `Maybe` | Hypothesis requiring authorized manual review |
| `Not Found` | No match reported; not evidence of absence |
| Other status / missing score | **UNKNOWN**, never quietly converted into PASS |
| Consent checkbox | User assertion; not a signed ownership proof |

ALIENS EYE can omit negative site rows with `--only-found`. The reviewer
distinguishes **reported sites scanned** from **rows imported**, and never
converts omitted rows to Not Found.

Parser accepts the upstream JSON export structure:
`{ "scan_summary": {...}, "variations": { "<handle>": { "sites": { "<site>": { "status": "...", "confidence": 0, "url": "..." } } } } }`.

Reports are limited to 2 MB, 256 variations, and 12,000 site rows. Only
safe external HTTPS URLs without embedded credentials render as outbound links.
Imported free-text biography, display name, photos, or cross-identity
correlation are not displayed. Text is rendered through React text nodes, not
untrusted HTML. The privacy-minimized receipt omits usernames, profile URLs,
names and biographies. Reports are in memory only; **no localStorage** is used.

## Next milestones (not implemented)

- Opt-in local PhiOS/PhiKeyhole369 scanner worker behind a signed,
  expiring, narrow target and purpose grant.
- Pin and audit the exact ALIENS EYE dependency/version and its outbound
  requests before executing it.
- Per-site rate limits, audit trail, cancellation, and permissions boundary.
- Independently signed execution receipts and redaction-on-export review.
- Optional authenticated import bridge; never run a public open proxy.

None of these future features is claimed as delivered by R14.

## Test

```sh
npm ci
npm test -- src/lib/identity.test.ts
npm run build
```

R14 does not authenticate imported reports or verify control of the inspected
identity. **Ledger above ego:** a report isn't a warrant, and a username is not
a person.
