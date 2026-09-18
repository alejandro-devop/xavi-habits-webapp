import { getCategoryLabel } from '@/shared/icons/categories'
import type { AppIconCategory, AppIconEntry } from '@/shared/icons/types'

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '')
}

function normalizeSearchText(value: string): string {
  return stripDiacritics(value.trim().toLowerCase())
}

/**
 * Searchable text per entry, computed once and reused on every keystroke.
 * With a catalog of ~450 entries, rebuilding it on each key was the whole cost
 * of filtering. Keyed by the entry object, so custom catalogs also benefit.
 */
const haystackCache = new WeakMap<AppIconEntry, string>()

function buildHaystack(entry: AppIconEntry): string {
  const cached = haystackCache.get(entry)
  if (cached !== undefined) return cached

  const haystack = normalizeSearchText(
    [
      entry.name,
      entry.label,
      entry.category,
      getCategoryLabel(entry.category),
      ...entry.keywords,
    ].join(' '),
  )
  haystackCache.set(entry, haystack)
  return haystack
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
