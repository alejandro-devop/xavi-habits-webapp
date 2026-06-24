export interface UserSettings {
  userId: number
  hideHiddenHabits: boolean
  sleepActivityCategoryId: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateUserSettingsInput {
  hideHiddenHabits?: boolean
  sleepActivityCategoryId?: string | null
}
