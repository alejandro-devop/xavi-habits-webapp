import { describe, expect, it } from 'vitest'
import { appIcons, appIconMap, iconNameAliases } from '@/shared/icons/app-icons'
import { APP_ICON_CATEGORY_LABELS, APP_ICON_CATEGORY_ORDER } from '@/shared/icons/categories'
import { filterAppIcons, groupIconsByCategory, isPickerIcon } from '@/shared/icons/icon-search'
import type { AppIconCategory } from '@/shared/icons/types'

/** Categories the user picks from. `other` holds UI/system icons. */
const PICKABLE_CATEGORIES = APP_ICON_CATEGORY_ORDER.filter((c) => c !== 'other')

const pickerIcons = appIcons.filter(isPickerIcon)

describe('catálogo de iconos — integridad', () => {
  it('no tiene nombres duplicados', () => {
    const seen = new Map<string, number>()
    for (const entry of appIcons) {
      seen.set(entry.name, (seen.get(entry.name) ?? 0) + 1)
    }
    const duplicated = [...seen.entries()].filter(([, count]) => count > 1).map(([name]) => name)
    expect(duplicated).toEqual([])
  })

  it('todas las entradas resuelven a un IconDefinition real', () => {
    const broken = appIcons
      .filter((entry) => {
        const icon = entry.icon
        return (
          !icon ||
          typeof icon.iconName !== 'string' ||
          !Array.isArray(icon.icon) ||
          typeof icon.icon[4] !== 'string' ||
          icon.icon[4].length === 0
        )
      })
      .map((entry) => entry.name)
    expect(broken).toEqual([])
    expect(appIconMap.size).toBe(appIcons.length)
  })

  it('no repite el mismo icono de Font Awesome en dos entradas', () => {
    const byIcon = new Map<string, string[]>()
    for (const entry of appIcons) {
      const key = `${entry.icon.prefix}:${entry.icon.iconName}`
      byIcon.set(key, [...(byIcon.get(key) ?? []), entry.name])
    }
    const repeated = [...byIcon.entries()]
      .filter(([, names]) => names.length > 1)
      .map(([key, names]) => `${key} → ${names.join(', ')}`)
    expect(repeated).toEqual([])
  })

  it('cada entrada trae etiqueta y palabras clave', () => {
    const incomplete = appIcons
      .filter((entry) => entry.label.trim().length === 0 || entry.keywords.length === 0)
      .map((entry) => entry.name)
    expect(incomplete).toEqual([])
  })

  it('usa nombres en kebab-case y categorías conocidas', () => {
    const categories = new Set<AppIconCategory>(APP_ICON_CATEGORY_ORDER)
    for (const entry of appIcons) {
      expect(entry.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(categories.has(entry.category)).toBe(true)
      expect(APP_ICON_CATEGORY_LABELS[entry.category]).toBeTruthy()
    }
  })

  it('los alias apuntan a nombres que existen y no pisan una entrada', () => {
    for (const [alias, target] of Object.entries(iconNameAliases)) {
      expect(appIconMap.has(target)).toBe(true)
      expect(appIcons.some((entry) => entry.name === alias)).toBe(false)
    }
  })
})

describe('catálogo de iconos — inventario', () => {
  it('ofrece al menos 25 iconos en cada categoría elegible', () => {
    const counts = new Map<AppIconCategory, number>()
    for (const entry of pickerIcons) {
      counts.set(entry.category, (counts.get(entry.category) ?? 0) + 1)
    }
    const flaky = PICKABLE_CATEGORIES.filter((category) => (counts.get(category) ?? 0) < 25)
    expect(flaky).toEqual([])
  })

  it('muestra un catálogo grande en el selector', () => {
    expect(pickerIcons.length).toBeGreaterThanOrEqual(380)
  })

  it('muestra la categoría Social con sus iconos', () => {
    const groups = groupIconsByCategory(pickerIcons, APP_ICON_CATEGORY_ORDER)
    const social = groups.find((group) => group.category === 'social')
    expect(social).toBeDefined()
    expect(social?.label).toBe('Social')
    expect(social?.icons.length).toBeGreaterThanOrEqual(25)
  })
})

describe('catálogo de iconos — búsqueda en español', () => {
  const cases: [string, string][] = [
    ['pesas', 'dumbbell'],
    ['yoga', 'om'],
    ['lavadora', 'jug-detergent'],
    ['familia', 'people-roof'],
    ['idiomas', 'language'],
    ['respiración', 'lungs'],
    ['basura', 'trash-can'],
    ['cocinar', 'kitchen-set'],
    ['medicación', 'pills'],
    ['ahorro', 'piggy-bank'],
    ['videollamada', 'users-rectangle'],
    ['senderismo', 'person-hiking'],
    ['regalo', 'gift'],
    ['diario', 'book-bookmark'],
    ['verdura', 'carrot'],
  ]

  it.each(cases)('«%s» encuentra %s', (query, expected) => {
    const names = filterAppIcons(appIcons, query, { pickerOnly: true }).map((e) => e.name)
    expect(names).toContain(expected)
  })

  it('ignora acentos y mayúsculas', () => {
    const names = filterAppIcons(appIcons, 'MEDITACION', { pickerOnly: true }).map((e) => e.name)
    expect(names).toContain('person-praying')
  })
})
