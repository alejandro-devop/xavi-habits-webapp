import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export type AppIconCategory =
  | 'work'
  | 'fitness'
  | 'study'
  | 'health'
  | 'finance'
  | 'home'
  | 'technology'
  | 'social'
  | 'entertainment'
  | 'mindfulness'
  | 'pets'
  | 'productivity'
  | 'other'

export type AppIconEntry = {
  name: string
  label: string
  category: AppIconCategory
  icon: IconDefinition
  keywords: string[]
  /** @default true */
  showInPicker?: boolean
}
