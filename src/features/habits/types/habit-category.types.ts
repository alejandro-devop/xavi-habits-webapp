export interface HabitCategoryInput {
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  orderIndex?: number
}

export interface HabitCategoryEditInput extends HabitCategoryInput {
  id: string
}

export interface HabitCategoryFormValues {
  name: string
  description: string
  icon: string | null
  color: string | null
  orderIndex: string
}
