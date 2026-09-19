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
  socialIcons,
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
  ...socialIcons,
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
