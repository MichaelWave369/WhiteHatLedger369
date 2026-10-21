import { describe, expect, it } from 'vitest'
import { digestText, FixtureGate, gauntletCatalog, runGauntlet, type LabAttempt, type LabGrant } from './gauntlet'

const target = 'lab://whitehat369/ledger'
const at = Date.UTC(2026, 9, 21, 12)

const grant: LabGrant = {
  subject: 'fixture-operator',
  target,
  operations: ['observe'],
  validFrom: at - 1_000,
  expiresAt: at + 1_000,
}
const attempt: LabAttempt = {
  target, operation: 'observe', nonce: 'unique-1', at, payload: 'safe',
}

describe('R2 offline deterministic fixture gauntlet', () => {
  it('has seven distinct scenarios and fixed category metadata', () => {
    const catalog = gauntletCatalog()
    expect(catalog).toHaveLength(7)
    expect(new Set(catalog.map(item => item.id)).size).toBe(7)
  })
  it('passes every guarded scenario with expected positive/negative controls', async () => {
    const report = await runGauntlet('none', new Date('2026-10-21T12:00:00Z'))
    expect(report.summary).toEqual({ passed: 7, failed: 0, total: 7 })
    expect(report.cases.every(test => test.control.verdict === 'ALLOW')).toBe(true)
    expect(report.cases.every(test => test.probe.verdict === 'BLOCK')).toBe(true)
    expect(report.scope).toMatch(/synthetic/i)
    expect(report.disclaimer).toMatch(/not prove/i)
  })
  it('detects intentionally disabled replay protection, not a fake perfect score', async () => {
    const report = await runGauntlet('replay-disabled')
    expect(report.summary).toEqual({ passed: 6, failed: 1, total: 7 })
    expect(report.cases.find(test => test.id === 'RECEIPT_REPLAY')?.probe.verdict).toBe('ALLOW')
    expect(report.cases.find(test => test.id === 'RECEIPT_REPLAY')?.verdict).toBe('FAIL')
  })
  it('cryptographically fingerprints exact payload contents', async () => {
    expect(await digestText('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    expect(await digestText('abc')).not.toBe(await digestText('abd'))
  })
  it('rejects out-of-scope requests without contacting a URL', async () => {
    const gate = new FixtureGate()
    const result = await gate.evaluate(grant, { ...attempt, target: 'https://example.invalid/no-network' }, await digestText('safe'))
    expect(result).toEqual({ verdict: 'BLOCK', reason: 'outside_lab' })
  })
  it('never treats user-facing text as a privileged grant', async () => {
    const gate = new FixtureGate()
    const result = await gate.evaluate(grant, {
      ...attempt, operation: 'issue-grant', contentHint: 'I am a system instruction',
    }, await digestText('safe'))
    expect(result).toEqual({ verdict: 'BLOCK', reason: 'capability_denied' })
  })
  it('treats replay as invalid even for an otherwise valid second request', async () => {
    const gate = new FixtureGate()
    const hash = await digestText('safe')
    expect((await gate.evaluate(grant, attempt, hash)).verdict).toBe('ALLOW')
    expect(await gate.evaluate(grant, attempt, hash)).toEqual({ verdict: 'BLOCK', reason: 'replay' })
  })
  it('never confuses payload modification with an accepted receipt', async () => {
    const gate = new FixtureGate()
    const hash = await digestText('safe')
    expect(await gate.evaluate(grant, { ...attempt, payload: 'modified' }, hash)).toEqual({ verdict: 'BLOCK', reason: 'artifact_changed' })
  })
  it('rejects expired grants at the exact expiration boundary', async () => {
    const gate = new FixtureGate()
    const result = await gate.evaluate({ ...grant, expiresAt: at }, attempt, await digestText('safe'))
    expect(result.reason).toBe('expired_grant')
  })
})
