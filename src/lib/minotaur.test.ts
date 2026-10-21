import { describe, expect, it } from 'vitest'
import {
  MINOTAUR_EVENTS, MINOTAUR_LEVELS, advanceMinotaur, checkSyntheticCapability,
  createMinotaurObservation, createMinotaurState, currentTier, runMinotaurSequence,
  type MinotaurCapability,
} from './minotaur'

describe('R3 Minotaur policy simulator', () => {
  it('starts at NORMAL with explicit fixture-only capabilities', () => {
    const state = createMinotaurState()
    expect(currentTier(state).name).toBe('NORMAL')
    expect(checkSyntheticCapability(state, 'observe')).toEqual({
      capability: 'observe', tier: 'NORMAL', decision: 'ALLOW_FIXTURE_ONLY', executed: false,
    })
    expect(checkSyntheticCapability(state, 'grant').decision).toBe('DENY')
  })
  it('is monotonic and never grows authority across all seven tiers', () => {
    let state = createMinotaurState()
    const seen = [currentTier(state).name]
    let old = [...currentTier(state).capabilities]
    for (const e of MINOTAUR_EVENTS) {
      state = advanceMinotaur(state, e.id)
      const caps = [...currentTier(state).capabilities]
      expect(caps.every((cap) => old.includes(cap))).toBe(true)
      old = caps
      seen.push(currentTier(state).name)
    }
    expect(seen).toEqual(['NORMAL', 'WATCH', 'RESTRICT', 'SANDBOX', 'DECOY', 'ISOLATE', 'QUARANTINE'])
  })
  it('does not mistake labels like SANDBOX for OS security boundaries', () => {
    expect(MINOTAUR_LEVELS.find((level) => level.name === 'SANDBOX')?.description).toMatch(/NOT an OS sandbox/)
    expect(MINOTAUR_LEVELS.find((level) => level.name === 'QUARANTINE')?.capabilities).toEqual([])
  })
  it('quarantine is absorbing even if more bad events arrive', () => {
    const terminal = runMinotaurSequence()
    expect(currentTier(terminal).name).toBe('QUARANTINE')
    const repeat = advanceMinotaur(terminal, MINOTAUR_EVENTS[0].id)
    expect(currentTier(repeat).name).toBe('QUARANTINE')
    expect(repeat.transitions.at(-1)?.decision).toBe('ALREADY_QUARANTINED')
    for (const action of ['observe', 'inspect', 'simulate', 'export', 'grant'] as MinotaurCapability[]) {
      expect(checkSyntheticCapability(repeat, action).decision).toBe('DENY')
    }
  })
  it('does not mutate input state during transitions', () => {
    const before = createMinotaurState()
    const after = advanceMinotaur(before, 'SUSPICIOUS_INPUT')
    expect(before.level).toBe(0)
    expect(before.transitions).toEqual([])
    expect(after.transitions).toHaveLength(1)
    expect(after.transitions[0].withdrawn).toEqual(['export'])
  })
  it('rejects invented events and invalid states rather than escalating falsely', () => {
    expect(() => advanceMinotaur(createMinotaurState(), 'FANTASY' as never)).toThrow('Unknown')
    expect(() => advanceMinotaur({ ...createMinotaurState(), level: -1 }, 'SUSPICIOUS_INPUT')).toThrow('Invalid')
  })
  it('produces explicit unsigned, scoped fixture observations', () => {
    const receipt = createMinotaurObservation(runMinotaurSequence(), new Date('2026-10-21T00:00:00Z'))
    expect(receipt.final_tier).toBe('QUARANTINE')
    expect(receipt.proof).toBe('UNSIGNED_SIMULATION_ONLY')
    expect(receipt.transitions).toHaveLength(6)
    expect(receipt.limits).toMatch(/No deployed agent/)
  })
})
