/**
 * R4: offline-only Ed25519 verification demonstration.
 *
 * Pinned public key and static signed lab fixture ONLY. No private key is
 * stored in this repository; the sample signing private key was destroyed
 * immediately after the fixture was created. No real authority is granted.
 */
export const GRANT_SCHEMA = 'whitehatledger369.agent-grant.v1' as const
export const AUTHORITY_DEMO_CLOCK = '2026-10-21T12:00:00.000Z'
export const AUTHORITY_DOMAIN = 'WHL369-R4-GRANT-V1\n'
export const FIXTURE_AUDIENCE = 'whitehat369-r4-lab'
export const FIXTURE_RESOURCE = 'lab://whitehat369/agent-demo'
export const FIXTURE_SUBJECT = 'simulated-spv-agent'
export const FIXTURE_ISSUER = 'whitehat369-fixture-issuer'
export const TRUSTED_KEY_ID = 'r4-demo-public-1'
export const TRUSTED_PUBLIC_KEY = 'eGTy_KjVQ7YghSDoNQ6VjPHTgzlNsEL0LP2keyr_ETE'
export const SIGNED_FIXTURE = {
  keyId: TRUSTED_KEY_ID,
  payload: '{"schema":"whitehatledger369.agent-grant.v1","issuer":"whitehat369-fixture-issuer","audience":"whitehat369-r4-lab","subject":"simulated-spv-agent","resource":"lab://whitehat369/agent-demo","operations":["observe"],"notBefore":"2026-10-21T00:00:00.000Z","expiresAt":"2026-10-22T00:00:00.000Z","nonce":"demo-grant-01"}',
  signature: 'wfWuM_6YWEAkCrUO1732j2JGZf8XlgcNC8hVpgDAjdiCw8vTIBi6of2O1ttu-LPStAqyJgJJZU80HcH05zrOCQ',
} as const

export type AuthorityReason =
  | 'SIGNATURE_VERIFIED'
  | 'KEY_NOT_TRUSTED'
  | 'BAD_ENVELOPE'
  | 'SIGNATURE_INVALID'
  | 'CRYPTO_UNAVAILABLE'
  | 'CLAIMS_INVALID'
  | 'NOT_YET_VALID'
  | 'EXPIRED'
  | 'AUDIENCE_MISMATCH'
  | 'SUBJECT_MISMATCH'
  | 'RESOURCE_MISMATCH'
  | 'OPERATION_DENIED'
  | 'REPLAY'

export type FixtureOperation = 'observe' | 'mutate' | 'issue-grant'

export interface SignedEnvelope {
  keyId: string
  payload: string
  signature: string
}
interface ParsedGrant {
  schema: typeof GRANT_SCHEMA
  issuer: typeof FIXTURE_ISSUER
  audience: typeof FIXTURE_AUDIENCE
  subject: typeof FIXTURE_SUBJECT
  resource: typeof FIXTURE_RESOURCE
  operations: ['observe']
  notBefore: string
  expiresAt: string
  nonce: string
}

export interface AuthorityRequest {
  audience: string
  subject: string
  resource: string
  operation: FixtureOperation
  at: string
}
export interface AuthorityVerdict {
  signature: 'VALID' | 'INVALID' | 'UNAVAILABLE'
  decision: 'ALLOW_FIXTURE_ONLY' | 'DENY'
  reason: AuthorityReason
  executed: false
  scope: 'SIGNED_SAMPLE_ONLY'
}

function decodeBase64url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null
  const normalized = text.replace(/-/g, '+').replace(/_/g, '/')
  try {
    const binary = atob(normalized)
    return Uint8Array.from(binary, char => char.charCodeAt(0))
  } catch {
    return null
  }
}
function exactKeys(object: Record<string, unknown>, keys: readonly string[]): boolean {
  const own = Object.keys(object)
  return own.length === keys.length && own.every(key => keys.includes(key))
}
function isPlainObject(input: unknown): input is Record<string, unknown> {
  return Boolean(input && typeof input === 'object' && !Array.isArray(input) && Object.getPrototypeOf(input) === Object.prototype)
}
function parseGrant(raw: string): ParsedGrant | null {
  if (raw.length > 2048) return null
  let data: unknown
  try { data = JSON.parse(raw) } catch { return null }
  if (!isPlainObject(data) ||
      !exactKeys(data, ['schema','issuer','audience','subject','resource','operations','notBefore','expiresAt','nonce'])) return null

  if (data.schema !== GRANT_SCHEMA ||
      data.issuer !== FIXTURE_ISSUER ||
      data.audience !== FIXTURE_AUDIENCE ||
      data.subject !== FIXTURE_SUBJECT ||
      data.resource !== FIXTURE_RESOURCE ||
      !Array.isArray(data.operations) || data.operations.length !== 1 || data.operations[0] !== 'observe' ||
      typeof data.notBefore !== 'string' || typeof data.expiresAt !== 'string' ||
      typeof data.nonce !== 'string' || !/^demo-grant-[0-9]{2}$/.test(data.nonce)) return null

  // Signed 24-hour, exact-millisecond UTC fixture only.
  const strictTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  if (!strictTime.test(data.notBefore) || !strictTime.test(data.expiresAt)) return null
  const start = Date.parse(data.notBefore), end = Date.parse(data.expiresAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start > 86_400_000) return null
  if (new Date(start).toISOString() !== data.notBefore || new Date(end).toISOString() !== data.expiresAt) return null
  return data as unknown as ParsedGrant
}

export function sampleAuthorityRequest(at = AUTHORITY_DEMO_CLOCK): AuthorityRequest {
  return { audience: FIXTURE_AUDIENCE, subject: FIXTURE_SUBJECT, resource: FIXTURE_RESOURCE, operation: 'observe', at }
}

function deny(reason: AuthorityReason, signature: AuthorityVerdict['signature']): AuthorityVerdict {
  return { signature, decision: 'DENY', reason, executed: false, scope: 'SIGNED_SAMPLE_ONLY' }
}
export class FixtureAuthoritySession {
  private consumed = new Set<string>()
  reset(): void { this.consumed.clear() }
  hasConsumed(nonce: string) { return this.consumed.has(nonce) }
  consume(nonce: string): void { this.consumed.add(nonce) }
}

export async function verifyFixtureAuthority(
  envelope: SignedEnvelope,
  request: AuthorityRequest,
  session: FixtureAuthoritySession,
): Promise<AuthorityVerdict> {
  // Crucial: TRUSTED_PUBLIC_KEY comes only from source code, not envelope input.
  if (envelope.keyId !== TRUSTED_KEY_ID) return deny('KEY_NOT_TRUSTED', 'INVALID')
  if (typeof envelope.payload !== 'string' || typeof envelope.signature !== 'string' ||
      envelope.payload.length > 2048 || envelope.signature.length > 256) return deny('BAD_ENVELOPE','INVALID')
  const keyBytes = decodeBase64url(TRUSTED_PUBLIC_KEY)
  const signatureBytes = decodeBase64url(envelope.signature)
  if (!keyBytes || keyBytes.length !== 32 || !signatureBytes || signatureBytes.length !== 64) return deny('BAD_ENVELOPE','INVALID')
  if (!globalThis.crypto?.subtle) return deny('CRYPTO_UNAVAILABLE','UNAVAILABLE')

  let verified = false
  try {
    const key = await globalThis.crypto.subtle.importKey('raw', keyBytes as BufferSource, 'Ed25519', false, ['verify'])
    const signedData = new TextEncoder().encode(AUTHORITY_DOMAIN + envelope.payload)
    verified = await globalThis.crypto.subtle.verify('Ed25519', key, signatureBytes as BufferSource, signedData)
  } catch {
    return deny('CRYPTO_UNAVAILABLE','UNAVAILABLE')
  }
  if (!verified) return deny('SIGNATURE_INVALID','INVALID')
  const grant = parseGrant(envelope.payload)
  if (!grant) return deny('CLAIMS_INVALID','VALID')

  const at = Date.parse(request.at)
  if (!Number.isFinite(at) || !/^\d{4}-\d{2}-\d{2}T/.test(request.at)) return deny('CLAIMS_INVALID','VALID')
  if (at < Date.parse(grant.notBefore)) return deny('NOT_YET_VALID','VALID')
  if (at >= Date.parse(grant.expiresAt)) return deny('EXPIRED','VALID')
  if (request.audience !== grant.audience) return deny('AUDIENCE_MISMATCH','VALID')
  if (request.subject !== grant.subject) return deny('SUBJECT_MISMATCH','VALID')
  if (request.resource !== grant.resource) return deny('RESOURCE_MISMATCH','VALID')
  if (!grant.operations.includes(request.operation as 'observe')) return deny('OPERATION_DENIED','VALID')
  if (session.hasConsumed(grant.nonce)) return deny('REPLAY','VALID')
  session.consume(grant.nonce)
  return { signature: 'VALID', decision: 'ALLOW_FIXTURE_ONLY', reason: 'SIGNATURE_VERIFIED', executed: false, scope: 'SIGNED_SAMPLE_ONLY' }
}

export type AuthorityScenario = 'valid' | 'tamper' | 'wrong-key' | 'wrong-resource' | 'denied-op' | 'expired' | 'replay'
export interface ScenarioResult {
  scenario: AuthorityScenario
  label: string
  verdict: AuthorityVerdict
  expected: 'ALLOW_FIXTURE_ONLY' | 'DENY'
  matchedExpectation: boolean
}

export const SCENARIOS: readonly { id: AuthorityScenario; label: string; description: string }[] = [
  { id: 'valid', label: 'Signed baseline', description: 'Original signed fixture checked at the frozen demonstration clock.' },
  { id: 'tamper', label: 'Signature tampering', description: 'A byte of the signed payload changes. The public-key verifier must reject it.' },
  { id: 'wrong-key', label: 'Untrusted issuer key', description: 'An envelope cites an untrusted key identifier; the fixed trust anchor does not change.' },
  { id: 'wrong-resource', label: 'Resource substitution', description: 'An otherwise verified grant is presented to the wrong fixture asset.' },
  { id: 'denied-op', label: 'Privilege escalation', description: 'An observe-only grant is asked to authorize simulated mutation.' },
  { id: 'expired', label: 'Expired lease', description: 'The sample is cryptographically valid but time-bounded and no longer authorized.' },
  { id: 'replay', label: 'Nonce replay', description: 'The same signature/grant is checked twice within one in-memory session.' },
]

export async function runAuthorityScenario(id: AuthorityScenario): Promise<ScenarioResult> {
  if (!SCENARIOS.some(s => s.id === id)) throw new Error('Unknown authority fixture')
  const session = new FixtureAuthoritySession()
  const request = sampleAuthorityRequest()
  let envelope: SignedEnvelope = { ...SIGNED_FIXTURE }
  if (id === 'tamper') envelope = { ...envelope, payload: envelope.payload.replace('"observe"', '"mutate"') }
  if (id === 'wrong-key') envelope = { ...envelope, keyId: 'untrusted-key' }
  if (id === 'wrong-resource') request.resource = 'lab://whitehat369/other'
  if (id === 'denied-op') request.operation = 'mutate'
  if (id === 'expired') request.at = '2026-10-23T00:00:00.000Z'
  if (id === 'replay') await verifyFixtureAuthority(envelope, request, session)
  const verdict = await verifyFixtureAuthority(envelope, request, session)
  const expected = id === 'valid' ? 'ALLOW_FIXTURE_ONLY' : 'DENY'
  const label = SCENARIOS.find(s => s.id === id)!.label
  return { scenario: id, label, verdict, expected, matchedExpectation: verdict.decision === expected }
}
