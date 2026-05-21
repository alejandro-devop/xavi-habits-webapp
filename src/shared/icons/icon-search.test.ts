import { describe, expect, it } from 'vitest'
import { appIcons } from '@/shared/icons/app-icons'
import { filterAppIcons, groupIconsByCategory } from '@/shared/icons/icon-search'
import { APP_ICON_CATEGORY_ORDER } from '@/shared/icons/categories'

describe('filterAppIcons', () => {
  it('finds fitness icons by gym keyword', () => {
    const result = filterAppIcons(appIcons, 'gym', { pickerOnly: true })
    const names = result.map((e) => e.name)
    expect(names).toContain('dumbbell')
    expect(names).toContain('running')
    expect(names).toContain('heart-pulse')
  })

  it('finds icons by category label finanzas', () => {
    const result = filterAppIcons(appIcons, 'finanzas', { pickerOnly: true })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((e) => e.category === 'finance')).toBe(true)
  })

  it('finds coding-related icons', () => {
    const result = filterAppIcons(appIcons, 'coding', { pickerOnly: true })
    const names = result.map((e) => e.name)
    expect(names).toContain('code')
    expect(names).toContain('terminal')
    expect(names).toContain('laptop-code')
  })

  it('excludes system icons when pickerOnly', () => {
    const result = filterAppIcons(appIcons, 'check', { pickerOnly: true })
    expect(result.find((e) => e.name === 'check')).toBeUndefined()
  })

  it('matches multi-token queries', () => {
    const result = filterAppIcons(appIcons, 'trabajo remoto', { pickerOnly: true })
    expect(result.some((e) => e.name === 'laptop')).toBe(true)
  })
})

describe('groupIconsByCategory', () => {
  it('groups filtered icons by category order', () => {
    const filtered = filterAppIcons(appIcons, '', { pickerOnly: true })
    const groups = groupIconsByCategory(filtered, APP_ICON_CATEGORY_ORDER)
    expect(groups.length).toBeGreaterThan(0)
    expect(groups[0]?.icons.length).toBeGreaterThan(0)
    expect(groups.every((g) => g.label.length > 0)).toBe(true)
  })
})
