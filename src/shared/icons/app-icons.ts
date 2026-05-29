import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  entertainmentIcons,
  financeIcons,
  fitnessIcons,
  healthIcons,
  homeIcons,
  petsIcons,
  mindfulnessIcons,
  productivityIcons,
  studyIcons,
  systemIcons,
  technologyIcons,
  workIcons,
} from '@/shared/icons/catalog'
import type { AppIconEntry } from '@/shared/icons/types'

export type { AppIconCategory, AppIconEntry } from '@/shared/icons/types'

const catalogIcons = [
  ...systemIcons,
  ...productivityIcons,
  ...workIcons,
  ...fitnessIcons,
  ...studyIcons,
  ...healthIcons,
  ...financeIcons,
  ...technologyIcons,
  ...entertainmentIcons,
  ...mindfulnessIcons,
  ...homeIcons,
  ...petsIcons,
] as const

export const appIcons: AppIconEntry[] = catalogIcons.map((entry) => ({ ...entry }))

export type AppIconName = (typeof catalogIcons)[number]['name']

export const appIconMap = new Map<AppIconName, IconDefinition>(
  appIcons.map((entry) => [entry.name as AppIconName, entry.icon]),
)

/** Maps FA icon names / aliases to stored app names. */
export const iconNameAliases: Record<string, AppIconName> = {
  house: 'home',
  'pen-to-square': 'edit',
  'magnifying-glass': 'search',
  'person-running': 'running',
  'person-walking': 'walking',
  bullseye: 'target',
  'mobile-screen': 'mobile',
  'tablet-screen-button': 'tablet',
}
