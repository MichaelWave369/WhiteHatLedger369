/**
 * R6 Release Guardian: deterministic *advisory* policy evaluation.
 *
 * Real deployments are NOT gated. The only passing receipt example is a
 * synthetically signed fixture, which cannot authorize any live release.
 * UNKNOWN and FAIL are never promoted to PASS by absent/stale evidence.
 */
export const GUARDIAN_SCHEMA = 'whitehatledger369.guardian.v1'
export const GUARDIAN_POLICY = 'r6-advisory-2026-10'
export const SUBJECT = 'MichaelWave369/WhiteHatLedger369'
export const MAX_AGE_MS = 48 * 60 * 60 * 1000
const SHA256 = /^[a-f0-9]{64}$/
export const OUTCOMES = ['PASS','FAIL','UNKNOWN']

export function combineStatuses(statuses) {
  if (!Array.isArray(statuses) || statuses.length === 0 ||
      statuses.some(s => !OUTCOMES.includes(s))) return 'UNKNOWN'
  if (statuses.includes('FAIL')) return 'FAIL'
  if (statuses.includes('UNKNOWN')) return 'UNKNOWN'
  return 'PASS'
}
function check(id, label, status, detail, scope) {
  return { id, label, status, detail, scope }
}
export function evaluateAdvisory(sentinel, expectedManifestHash, now) {
  const scope = 'Only this repository\'s declared DIRECT npm package versions; OSV.dev advisory data'
  const unknown = (detail) => check('direct_npm_advisories','Direct npm advisory lookup','UNKNOWN',detail,scope)
  if (!sentinel || typeof sentinel!=='object' || Array.isArray(sentinel) ||
      sentinel.schema!=='whitehatledger369.sentinel.v1' ||
      sentinel.subject!==SUBJECT || !sentinel.source ||
      sentinel.source.path!=='package.json' ||
      typeof expectedManifestHash!=='string' || !SHA256.test(expectedManifestHash) ||
      sentinel.source.sha256!==expectedManifestHash ||
      !sentinel.provider || !sentinel.summary || !Array.isArray(sentinel.packages)) {
    return unknown('Report missing, invalid, or source digest does not match checked-out package.json.')
  }
  const s=sentinel.summary
  if(!['direct_declared','exact_versions_queried','matched','none_reported','unknown'].every(
      key=>Number.isSafeInteger(s[key]) && s[key]>=0))return unknown('Invalid advisory counts.')
  if(s.direct_declared!==sentinel.packages.length ||
     s.matched+s.none_reported+s.unknown!==s.direct_declared ||
     s.exact_versions_queried > s.direct_declared) return unknown('Inconsistent advisory counts.')
  if(sentinel.provider.name!=='OSV.dev' || sentinel.provider.status!=='complete')
    return unknown('External provider did not complete; no clearing assertion.')
  const stamp=typeof sentinel.generated_at==='string'?Date.parse(sentinel.generated_at):NaN
  if(!Number.isFinite(stamp) || stamp>now+5*60*1000 || now-stamp>MAX_AGE_MS)
    return unknown('External advisory data is stale, future-dated or missing.')
  if(s.matched>0)
    return check('direct_npm_advisories','Direct npm advisory lookup','FAIL',
      `${s.matched} direct package(s) have OSV advisory matches; manual investigation required.`,scope)
  if(s.unknown>0 || s.exact_versions_queried!==s.direct_declared ||
     s.none_reported!==s.direct_declared)
    return unknown('At least one declared package lacks a complete exact-version result.')
  if(sentinel.packages.some(p=>!p || p.status!=='none_reported' ||
     !Array.isArray(p.advisories) || p.advisories.length!==0 || typeof p.version!=='string'))
    return unknown('Per-package rows do not agree with complete zero-match summary.')
  return check('direct_npm_advisories','Direct npm advisory lookup','PASS',
    'OSV reported no matches for the exactly pinned direct npm packages at report time. This is NOT a complete vulnerability assessment.',scope)
}

export function evaluateGuardian({
  sentinel = null,
  manifestSha256 = null,
  evidenceVerification = null,
  now = new Date(),
  commit = null,
}={}) {
  const clock=now instanceof Date?now:new Date(now)
  if(!Number.isFinite(clock.getTime())) throw new Error('Invalid report clock')
  const fixturePass=evidenceVerification?.ok===true && evidenceVerification?.signatureValid===true &&
    evidenceVerification?.chainValid===true && evidenceVerification?.recordsChecked===3
  const fixture = check('demo_receipt_integrity','Synthetic signed receipt fixture',
    fixturePass?'PASS':'FAIL',
    fixturePass?'Independent Node verifier confirms the fixed R5 demo chain and pinned signature. Not real release evidence.':
      'Fixed synthetic signed receipt validation failed, missing, or incomplete. Never claim a clean proof.',
    'SIMULATED / lab://whitehat369/evidence ONLY')
  const advisory=evaluateAdvisory(sentinel,manifestSha256,clock.getTime())
  const controls=[
    advisory,
    check('transitive_sbom','Installed transitive dependency coverage','UNKNOWN',
      'No verified immutable lockfile/SBOM dependency tree or reproducible installed artifact evidence.', 'Production release'),
    check('deployment_attestation','Deployment artifact attestation','UNKNOWN',
      'No independently authenticated deployment/build artifact provenance or binary digest.', 'Production release'),
    check('authorized_scope','Owner consent and signed test scope','UNKNOWN',
      'No real target authorization and consent receipt was supplied or independently verified.', 'Production release'),
    check('patch_retest','Live patch and retest evidence','UNKNOWN',
      'Synthetic lab receipts are explicitly excluded from production patch/retest proof.', 'Production release'),
  ]
  // Demo fixture is visibly kept OUT of any production-release policy.
  const overall=combineStatuses(controls.map(x=>x.status))
  return {
    schema:GUARDIAN_SCHEMA,
    policy:GUARDIAN_POLICY,
    subject:SUBJECT,
    generated_at:clock.toISOString(),
    source:{commit:typeof commit==='string'&&/^[a-f0-9]{40}$/.test(commit)?commit:null,
      manifest_sha256:typeof manifestSha256==='string'&&SHA256.test(manifestSha256)?manifestSha256:null,
      integrity:'UNATTESTED_CI_ENVIRONMENT_CLAIM'},
    mode:'ADVISORY_ONLY',
    deployment_blocking:false,
    production_release:{status:overall,detail:overall==='FAIL'
      ?'At least one explicit production policy check failed; operator review required. This report does not block deployment.'
      :'Insufficient independently verifiable production evidence. No security approval or release authorization has been issued.'},
    controls,
    demonstration:fixture,
    disclaimer:'Unsigned advisory policy output. Green CI or synthetic signed receipts do not establish secure deployment. No production gate is enforced.',
  }
}
