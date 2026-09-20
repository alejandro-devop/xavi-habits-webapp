import {
  useCreateVidaItemMutation,
  useUpdateVidaItemMutation,
} from '@/features/vida/hooks/useVidaItems'
import type {
  VidaDayOfWeek,
  VidaItem,
  VidaItemCreateInput,
  VidaItemUpdateInput,
} from '@/features/vida/types/vida-item.types'
import { VIDA_DAY_ORDER } from '@/features/vida/utils/vida-date.utils'

/**
 * Guardar la plantilla de **una** actividad desde su hoja: el interruptor
 * «ponerla en mi plantilla», sus siete días y —desde FEAT-003— **a qué hora** y
 * **cuánto**.
 *
 * Es un **orquestador**, no acceso nuevo al API: decide cuál de las dos
 * mutaciones de F0 toca y las llama. Tres reglas, y las tres son criterios:
 *
 * - Encendido **sin** `VidaItem`: se crea (criterio 17).
 * - Encendido **con** `VidaItem`: se **actualiza el mismo**, nunca se crea otro
 *   (criterio 19). Si estaba desactivado, vuelve con `isActive: true` y con su
 *   nota intacta —por eso la página pide la plantilla con `includeInactive`—.
 * - Apagado con `VidaItem` activo: `isActive: false`. **No se borra**: los días
 *   y la nota se quedan donde están (criterio 20). `vidaItemDelete` no se usa.
 *
 * Y una cuarta que no es criterio pero evita un viaje y un toast de mentira:
 * si nada cambió (apagado sin ítem, o encendido con los mismos días, la misma
 * hora, la misma duración y ya activo), no se llama a nadie y el `onSuccess`
 * corre igual.
 *
 * **Hora y duración son opcionales** (criterio 5): un ítem con días y sin hora
 * es legal y es lo que tienen todos los creados antes de FEAT-003. Por eso al
 * actualizar se manda `null` explícito para limpiarlas —omitir el campo las
 * dejaría como estaban, que es justo lo contrario de quitarlas— y al crear no se
 * manda el campo si no hay valor.
 */
export type SaveVidaItemForActivityInput = {
  activityId: string
  /** El `VidaItem` que ya existe para esa actividad, **activo o desactivado**. */
  item: VidaItem | null | undefined
  /** El interruptor. */
  inTemplate: boolean
  /** Los días marcados, en cualquier orden. */
  days: VidaDayOfWeek[]
  /** `HH:mm` o `null` si no tiene hora. */
  startTime: string | null
  /** Entero > 0, o `null` si no tiene duración. */
  durationMinutes: number | null
}

export type VidaItemSavePlan =
  | { kind: 'nothing' }
  | { kind: 'create'; input: VidaItemCreateInput }
  | { kind: 'update'; input: VidaItemUpdateInput }

/** De lunes a domingo y sin repetidos: al API no le llega el orden de los clics. */
export function sortVidaDays(days: VidaDayOfWeek[]): VidaDayOfWeek[] {
  return VIDA_DAY_ORDER.filter((day) => days.includes(day))
}

/** `null`, `undefined` y `''` son lo mismo aquí: «no tiene hora». */
function normalizeOptionalTime(time: string | null | undefined): string | null {
  const trimmed = time?.trim()
  return trimmed ? trimmed : null
}

/** Solo un entero positivo es una duración; lo demás es «no tiene». */
function normalizeOptionalDuration(minutes: number | null | undefined): number | null {
  if (minutes === null || minutes === undefined) return null
  if (!Number.isFinite(minutes)) return null
  const rounded = Math.round(minutes)
  return rounded > 0 ? rounded : null
}

function sameDays(a: VidaDayOfWeek[], b: VidaDayOfWeek[]): boolean {
  const left = sortVidaDays(a)
  const right = sortVidaDays(b)
  return left.length === right.length && left.every((day, index) => day === right[index])
}

/**
 * La decisión, en puro: qué mutación toca y con qué. Fuera del hook para poder
 * probarla sin montar React ni una caché.
 */
export function planVidaItemSave({
  activityId,
  item,
  inTemplate,
  days,
  startTime,
  durationMinutes,
}: SaveVidaItemForActivityInput): VidaItemSavePlan {
  if (!inTemplate) {
    // Nada que apagar si no hay ítem o ya estaba desactivado. La hora y la
    // duración **se quedan donde están**, como los días y la nota (criterio 20).
    if (!item || !item.isActive) return { kind: 'nothing' }
    return { kind: 'update', input: { id: item.id, isActive: false } }
  }

  const wanted = sortVidaDays(days)
  const wantedStart = normalizeOptionalTime(startTime)
  const wantedDuration = normalizeOptionalDuration(durationMinutes)

  if (!item) {
    return {
      kind: 'create',
      input: {
        activityId,
        days: wanted,
        // Al crear no se manda lo que no hay: el API ya los deja nulos.
        ...(wantedStart ? { startTime: wantedStart } : {}),
        ...(wantedDuration ? { durationMinutes: wantedDuration } : {}),
      },
    }
  }

  const sameStart = normalizeOptionalTime(item.startTime) === wantedStart
  const sameDuration = normalizeOptionalDuration(item.durationMinutes) === wantedDuration
  if (item.isActive && sameDays(item.days, wanted) && sameStart && sameDuration) {
    return { kind: 'nothing' }
  }

  return {
    kind: 'update',
    input: {
      id: item.id,
      days: wanted,
      isActive: true,
      // Aquí sí va el `null` explícito: es lo que **limpia** la hora o la
      // duración en el API. Omitirlo dejaría la vieja puesta.
      startTime: wantedStart,
      durationMinutes: wantedDuration,
    },
  }
}

export function useSaveVidaItemForActivity() {
  const createMutation = useCreateVidaItemMutation()
  const updateMutation = useUpdateVidaItemMutation()

  /**
   * El `onSuccess` es **local**, como en el resto de la hoja: quien llama
   * decide qué pasa después (cerrar la hoja) y, si esto falla, la hoja se
   * queda abierta con lo escrito (criterio 16).
   */
  function save(input: SaveVidaItemForActivityInput, options?: { onSuccess?: () => void }) {
    const plan = planVidaItemSave(input)

    if (plan.kind === 'nothing') {
      options?.onSuccess?.()
      return
    }

    if (plan.kind === 'create') {
      createMutation.mutate(plan.input, { onSuccess: () => options?.onSuccess?.() })
      return
    }

    updateMutation.mutate(plan.input, { onSuccess: () => options?.onSuccess?.() })
  }

  return {
    save,
    isPending: createMutation.isPending || updateMutation.isPending,
    isError: createMutation.isError || updateMutation.isError,
  }
}
