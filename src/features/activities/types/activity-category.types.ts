export interface ActivityCategory {
  id: string
  userId: number
  orderIndex: number
  name: string
  description: string | null
  icon: string | null
  color: string | null
}

export interface ActivityCategoryInput {
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  orderIndex?: number
}

export interface ActivityCategoryEditInput {
  id: string
  name?: string
  description?: string | null
  icon?: string | null
  color?: string | null
  orderIndex?: number
}

export interface ActivityCategoryFormValues {
  name: string
  description: string
  icon: string | null
  color: string
  orderIndex: string
}
