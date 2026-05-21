import { describe, expect, it } from 'vitest'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import { getIconByName, normalizeIconName, toStoredIconName } from '@/shared/icons/icon-utils'

describe('icon-utils', () => {
  it('normalizes faBell, fa-bell and bell to bell', () => {
    expect(normalizeIconName('faBell')).toBe('bell')
    expect(normalizeIconName('fa-bell')).toBe('bell')
    expect(normalizeIconName('bell')).toBe('bell')
  })

  it('normalizes faHouse to home', () => {
    expect(normalizeIconName('faHouse')).toBe('home')
    expect(normalizeIconName('fa-home')).toBe('home')
  })

  it('getIconByName resolves stored names', () => {
    expect(getIconByName('bell')).toBeTruthy()
    expect(getIconByName('faBell')?.iconName).toBe(faBell.iconName)
  })

  it('toStoredIconName uses app alias when provided', () => {
    expect(toStoredIconName(faBell, 'bell')).toBe('bell')
  })

  it('normalizes faBriefcase to briefcase', () => {
    expect(normalizeIconName('faBriefcase')).toBe('briefcase')
    expect(getIconByName('briefcase')).toBeTruthy()
  })

  it('returns null for unknown icon', () => {
    expect(getIconByName('unknown-icon-xyz')).toBeNull()
  })
})
