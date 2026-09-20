export interface UserSettings {
  userId: number
  hideHiddenHabits: boolean
  sleepActivityCategoryId: string | null
  standupTodoFolderId: string | null
  /**
   * Hora local `HH:mm` en que empieza y termina el día del módulo Vida. **Nulos
   * por defecto**: mientras lo estén, el cliente usa 06:30 y 23:00
   * (`useVidaDayHours`), y eso se lee en pantalla como valor por defecto, no
   * como elección del usuario.
   */
  vidaDayStartTime: string | null
  vidaDayEndTime: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateUserSettingsInput {
  hideHiddenHabits?: boolean
  sleepActivityCategoryId?: string | null
  standupTodoFolderId?: string | null
  /** `HH:mm`, o `null` para limpiar y volver al valor por defecto del cliente. */
  vidaDayStartTime?: string | null
  vidaDayEndTime?: string | null
}
