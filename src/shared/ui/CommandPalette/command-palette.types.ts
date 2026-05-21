import type { AppIconName } from '@/shared/icons'

export type CommandAction = {
  id: string
  label: string
  icon?: AppIconName | string
  keywords?: string[]
  onSelect: () => void
}
