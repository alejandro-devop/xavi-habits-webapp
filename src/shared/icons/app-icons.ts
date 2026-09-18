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

/**
 * Maps Font Awesome icon names / legacy aliases to stored app names.
 * An icon that already lives in the catalog under another name belongs here,
 * never as a second catalog entry.
 */
export const iconNameAliases: Record<string, AppIconName> = {
  house: 'home',
  'pen-to-square': 'edit',
  'magnifying-glass': 'search',
  'person-running': 'running',
  'person-walking': 'walking',
  bullseye: 'target',
  'mobile-screen': 'mobile',
  'tablet-screen-button': 'tablet',
  // Font Awesome 5 names kept alive so stored values never stop resolving.
  'soccer-ball': 'futbol',
  heartbeat: 'heart-pulse',
  'apple-alt': 'apple-whole',
  'first-aid': 'medkit',
  'kit-medical': 'medkit',
  'user-md': 'user-doctor',
  'praying-hands': 'hands-praying',
  'theater-masks': 'masks-theater',
  'birthday-cake': 'cake-candles',
  coffee: 'mug-saucer',
  university: 'building-columns',
  bank: 'building-columns',
  institution: 'building-columns',
  museum: 'building-columns',
  tasks: 'list-check',
  'hands-helping': 'handshake-angle',
  'trash-alt': 'trash-can',
  hiking: 'person-hiking',
  biking: 'person-biking',
  swimmer: 'person-swimming',
  skating: 'person-skating',
  skiing: 'person-skiing',
  'skiing-nordic': 'person-skiing-nordic',
  snowboarding: 'person-snowboarding',
  'basketball-ball': 'basketball',
  'football-ball': 'football',
  'volleyball-ball': 'volleyball',
  'baseball-ball': 'baseball',
  'table-tennis': 'table-tennis-paddle-ball',
  'utensil-spoon': 'spoon',
  'swimming-pool': 'water-ladder',
  'hands-wash': 'hands-bubbles',
  'hot-tub': 'hot-tub-person',
  'sticky-note': 'note-sticky',
  'hard-hat': 'helmet-safety',
  'chalkboard-teacher': 'chalkboard-user',
  'digging': 'person-digging',
  'balance-scale': 'scale-balanced',
  'hand-holding-usd': 'hand-holding-dollar',
  'money-check-alt': 'money-check-dollar',
  'shopping-basket': 'basket-shopping',
  'shopping-bag': 'bag-shopping',
  'archive': 'box-archive',
  'hdd': 'hard-drive',
  save: 'floppy-disk',
  cogs: 'gears',
  'address-card-alt': 'address-card',
  'comment-alt': 'message',
  'share-alt': 'share-nodes',
  'glass-cheers': 'champagne-glasses',
  'beer': 'beer-mug-empty',
  'pizza': 'pizza-slice',
  'hamburger': 'burger',
  'vector-square': 'pen-ruler',
}
