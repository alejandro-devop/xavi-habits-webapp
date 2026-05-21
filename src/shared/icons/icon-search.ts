import { getCategoryLabel } from '@/shared/icons/categories'
import type { AppIconCategory, AppIconEntry } from '@/shared/icons/types'

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '')
}

function normalizeSearchText(value: string): string {
  return stripDiacritics(value.trim().toLowerCase())
}

function buildHaystack(entry: AppIconEntry): string {
  return normalizeSearchText(
    [
      entry.name,
      entry.label,
      entry.category,
      getCategoryLabel(entry.category),
      ...entry.keywords,
    ].join(' '),
  )
}

export function isPickerIcon(entry: AppIconEntry): boolean {
  return entry.showInPicker !== false
}

export function filterAppIcons(
  icons: readonly AppIconEntry[],
  query: string,
  options?: { pickerOnly?: boolean },
): AppIconEntry[] {
  const pool = options?.pickerOnly ? icons.filter(isPickerIcon) : [...icons]
  const q = normalizeSearchText(query)
  if (!q) return pool

  const tokens = q.split(/\s+/).filter(Boolean)
  return pool.filter((entry) => {
    const haystack = buildHaystack(entry)
    return tokens.every((token) => haystack.includes(token))
  })
}

export function groupIconsByCategory(
  icons: readonly AppIconEntry[],
  order: readonly AppIconCategory[],
): { category: AppIconCategory; label: string; icons: AppIconEntry[] }[] {
  const byCategory = new Map<AppIconCategory, AppIconEntry[]>()
  for (const entry of icons) {
    const list = byCategory.get(entry.category) ?? []
    list.push(entry)
    byCategory.set(entry.category, list)
  }

  return order
    .map((category) => ({
      category,
      label: getCategoryLabel(category),
      icons: byCategory.get(category) ?? [],
    }))
    .filter((group) => group.icons.length > 0)
}
