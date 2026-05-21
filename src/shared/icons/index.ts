export {
  APP_ICON_CATEGORY_LABELS,
  APP_ICON_CATEGORY_ORDER,
  getCategoryLabel,
} from '@/shared/icons/categories'
export { appIcons, appIconMap, iconNameAliases, type AppIconEntry, type AppIconName } from '@/shared/icons/app-icons'
export type { AppIconCategory } from '@/shared/icons/types'
export { filterAppIcons, groupIconsByCategory, isPickerIcon } from '@/shared/icons/icon-search'
export {
  getIconByName,
  isAppIconName,
  normalizeIconName,
  toStoredIconName,
} from '@/shared/icons/icon-utils'
