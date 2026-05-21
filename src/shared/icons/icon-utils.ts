import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { appIconMap, iconNameAliases, type AppIconName } from '@/shared/icons/app-icons'

/** Stored value for forms/API — uses app name, not raw FA `iconName`. */
export function toStoredIconName(icon: IconDefinition, appName?: AppIconName): string {
  if (appName) return appName
  const faName = icon.iconName
  return iconNameAliases[faName] ?? faName
}

function camelToKebab(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * Normalizes Font Awesome variants to stored app name.
 * `faBell` → `bell`, `fa-bell` → `bell`, `faCalendarDays` → `calendar-days`
 */
export function normalizeIconName(input: string): string {
  let value = input.trim()
  if (!value) return ''

  if (value.startsWith('fa-')) {
    value = value.slice(3)
  } else if (value.startsWith('fa') && value.length > 2) {
    const rest = value.slice(2)
    value = rest.includes('-') ? rest : camelToKebab(rest)
  }

  const kebab = value.includes('-') ? value.toLowerCase() : camelToKebab(value)
  return iconNameAliases[kebab] ?? kebab
}

export function getIconByName(name: string): IconDefinition | null {
  const normalized = normalizeIconName(name) as AppIconName
  return appIconMap.get(normalized) ?? null
}

export function isAppIconName(name: string): name is AppIconName {
  const normalized = normalizeIconName(name)
  return appIconMap.has(normalized as AppIconName)
}
