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
  /**
   * **Tu noche** (FEAT-012). Las dos horas son `HH:mm` local y `vidaNightDays`
   * nombra las noches **por el día en que te acuestas** (D3), con los mismos
   * valores que `VidaItem.days`.
   *
   * Los tres son **nulos por defecto** y nulos significan «no hay noche»: el
   * módulo se comporta exactamente como antes de esta feature (criterio 310).
   *
   * **`vidaNightWakeTime` puede ser anterior a `vidaNightBedTime`**: `23:00 →
   * 05:00` cruza la medianoche y `01:00 → 06:40` no, y las dos son legales. El
   * servidor no las compara (criterio 262) — no se le aplica `isEndAfterStart`.
   */
  vidaNightBedTime: string | null
  vidaNightWakeTime: string | null
  vidaNightDays: string[] | null
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
  /**
   * `HH:mm`, o `null` para quitar la noche (criterio 270).
   *
   * **`vidaNightDays: []` lo rechaza el servidor** (`.min(1)` en
   * `user-settings.schemas.ts`): «ninguna noche» se manda como `null`, nunca
   * como lista vacía (criterio 265).
   */
  vidaNightBedTime?: string | null
  vidaNightWakeTime?: string | null
  vidaNightDays?: string[] | null
}
