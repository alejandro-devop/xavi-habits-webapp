import type { AppIconCategory } from '@/shared/icons/types'

export const APP_ICON_CATEGORY_LABELS: Record<AppIconCategory, string> = {
  productivity: 'Productividad',
  work: 'Trabajo',
  fitness: 'Ejercicio',
  study: 'Estudio',
  health: 'Salud',
  finance: 'Finanzas',
  technology: 'Tecnología',
  social: 'Social',
  entertainment: 'Entretenimiento',
  mindfulness: 'Bienestar',
  home: 'Hogar y día a día',
  pets: 'Mascotas',
  other: 'Otros',
}

/** Display order in IconPicker when not searching. */
export const APP_ICON_CATEGORY_ORDER: AppIconCategory[] = [
  'productivity',
  'work',
  'fitness',
  'study',
  'health',
  'finance',
  'technology',
  'social',
  'entertainment',
  'mindfulness',
  'home',
  'pets',
  'other',
]

export function getCategoryLabel(category: AppIconCategory): string {
  return APP_ICON_CATEGORY_LABELS[category]
}
