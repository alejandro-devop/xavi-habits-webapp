export {
  APP_ICON_CATEGORY_LABELS,
  APP_ICON_CATEGORY_ORDER,
  getCategoryLabel,
} from '@/shared/icons/categories'
// `appIcons` y `appIconMap` **no** salen por aquí a propósito: arrastran las
// 850 entradas del catálogo, y este barril lo importa medio arranque. Quien de
// verdad necesite la lista entera la pide a `@/shared/icons/app-icons` —y con
// eso se va al trozo perezoso— o la espera con `loadIconCatalog()`.
export type { AppIconEntry, AppIconName } from '@/shared/icons/app-icons'
export { iconNameAliases } from '@/shared/icons/icon-aliases'
export type { AppIconCategory } from '@/shared/icons/types'
export { filterAppIcons, groupIconsByCategory, isPickerIcon } from '@/shared/icons/icon-search'
export {
  getRegisteredIcon,
  isIconCatalogLoaded,
  loadIconCatalog,
  registerIconCatalog,
} from '@/shared/icons/icon-registry'
export { useAppIcon } from '@/shared/icons/useAppIcon'
export {
  getIconByName,
  isAppIconName,
  normalizeIconName,
  toStoredIconName,
} from '@/shared/icons/icon-utils'
