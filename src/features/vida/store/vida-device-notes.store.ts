import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { storage } from '@/shared/lib/storage'

/**
 * Las dos cosas de Vida que **se quedan en este aparato** (D7 y D8).
 *
 * El API no tiene dónde ponerlas —`ActivityDayPlanItem` solo lleva
 * `completedAt`, y la razón de un «No se pudo» no es una nota de ninguna
 * sesión—, así que viven en `localStorage`, igual que
 * `features/habits/store/habit-identity.store.ts`, que es el molde de este
 * archivo carácter a carácter (mismo `persist`, mismo `createJSONStorage`
 * sobre `shared/lib/storage`, mismo `partialize`).
 *
 * **Es lo único de toda la feature que escribe en el aparato**, y está dicho en
 * pantalla, no escondido: el editor de la razón lleva su línea («Esta nota se
 * queda en este dispositivo») y la deuda está anotada en el dossier. **No
 * viaja**: en otro dispositivo la pregunta del tramo sin dato vuelve a salir y
 * las razones no se ven. Es el precio de no tocar el API en esta fase
 * (criterios 44 y 49).
 *
 * `shared/lib/storage` ya envuelve el `localStorage` que **lanza** (Safari en
 * privado, cuota llena): si no se puede escribir, no se rompe nada y lo único
 * que pasa es que la respuesta no se recuerda.
 */

export const VIDA_DEVICE_NOTES_STORAGE_KEY = 'xavi.vida.deviceNotes'

/** Un bloque que **no se pudo** hacer, con su razón opcional (criterio 43). */
export type VidaBlockNote = {
  /** Siempre `true` hoy: el único estado que se guarda del aparato. */
  couldNot: true
  /** Texto plano, o `null` cuando no se quiso contar. No pedirla es válido. */
  reason: string | null
}

export interface VidaDeviceNotesState {
  /** `fecha|itemId` → lo que se dijo de ese bloque. */
  blockNotes: Record<string, VidaBlockNote>
  /** `fecha|HH:mm-HH:mm` de los tramos sin dato que se dejaron así. */
  dismissedNoData: string[]
  /**
   * `lunes|itemId` de los avisos del puente que se dejaron como estaban
   * (FEAT-006, criterio 58). Va **en este mismo store y en esta misma clave**:
   * es un campo más, no un segundo `localStorage`.
   */
  dismissedBridges: string[]

  /** «No se pudo», con razón o sin ella. Vuelve a llamarse para cambiarla. */
  markBlockCouldNot: (date: string, itemId: string, reason: string | null) => void
  /** Quita la nota: el bloque vuelve a estar solo «no hecho», sin explicación. */
  clearBlockNote: (date: string, itemId: string) => void
  /** «Dejarlo así»: ese tramo no vuelve a preguntar ese día en este aparato. */
  dismissNoData: (date: string, sliceId: string) => void
  /** «Dejarlo como está»: ese aviso no vuelve **esa semana** (criterio 58). */
  dismissBridge: (weekMonday: string, itemId: string) => void
}

/** `2026-09-20|a1b2`: la fecha delante para que se lea de un vistazo. */
export function vidaBlockNoteKey(date: string, itemId: string): string {
  return `${date}|${itemId}`
}

/** `2026-09-20|08:15-10:55`: el tramo se identifica por sus horas, no por índice. */
export function vidaNoDataKey(date: string, sliceId: string): string {
  return `${date}|${sliceId}`
}

/** Lo que se dijo de este bloque, o `null`. Envoltorio para no repetir la clave. */
export function getBlockNote(
  notes: Record<string, VidaBlockNote>,
  date: string,
  itemId: string,
): VidaBlockNote | null {
  return notes[vidaBlockNoteKey(date, itemId)] ?? null
}

/**
 * `2026-09-14|a1b2`: **el lunes de la semana** delante del ítem.
 *
 * La semana entra en la clave a propósito: «Dejarlo como está» cierra el aviso
 * de **esa** semana (criterio 58), no para siempre. Si la semana siguiente el
 * dato lo vuelve a sostener, la pregunta se puede volver a hacer — que es lo
 * contrario de callar un aviso definitivamente por haberlo visto una vez.
 */
export function vidaBridgeKey(weekMonday: string, itemId: string): string {
  return `${weekMonday}|${itemId}`
}

/** Si este aviso ya recibió un «dejarlo como está» en este aparato (58). */
export function isBridgeDismissed(
  dismissed: string[],
  weekMonday: string,
  itemId: string,
): boolean {
  return dismissed.includes(vidaBridgeKey(weekMonday, itemId))
}

/** Si este tramo ya recibió un «dejarlo así» en este aparato (criterio 49). */
export function isNoDataDismissed(dismissed: string[], date: string, sliceId: string): boolean {
  return dismissed.includes(vidaNoDataKey(date, sliceId))
}

export const useVidaDeviceNotesStore = create<VidaDeviceNotesState>()(
  persist(
    (set) => ({
      blockNotes: {},
      dismissedNoData: [],
      // Un estado guardado **antes** de FEAT-006 no trae este campo: el merge
      // por defecto de `persist` es superficial y arranca con `[]`, así que no
      // hace falta ni `version` ni migración (A7).
      dismissedBridges: [],

      markBlockCouldNot: (date, itemId, reason) =>
        set((state) => {
          const trimmed = reason?.trim() ? reason.trim() : null
          return {
            blockNotes: {
              ...state.blockNotes,
              [vidaBlockNoteKey(date, itemId)]: { couldNot: true, reason: trimmed },
            },
          }
        }),

      clearBlockNote: (date, itemId) =>
        set((state) => {
          const key = vidaBlockNoteKey(date, itemId)
          if (!(key in state.blockNotes)) return state
          const { [key]: _removed, ...rest } = state.blockNotes
          return { blockNotes: rest }
        }),

      dismissNoData: (date, sliceId) =>
        set((state) => {
          const key = vidaNoDataKey(date, sliceId)
          if (state.dismissedNoData.includes(key)) return state
          return { dismissedNoData: [...state.dismissedNoData, key] }
        }),

      dismissBridge: (weekMonday, itemId) =>
        set((state) => {
          const key = vidaBridgeKey(weekMonday, itemId)
          if (state.dismissedBridges.includes(key)) return state
          return { dismissedBridges: [...state.dismissedBridges, key] }
        }),
    }),
    {
      name: VIDA_DEVICE_NOTES_STORAGE_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name) => storage.getItem(name),
        setItem: (name, value) => storage.setItem(name, value),
        removeItem: (name) => storage.removeItem(name),
      })),
      partialize: (state) => ({
        blockNotes: state.blockNotes,
        dismissedNoData: state.dismissedNoData,
        dismissedBridges: state.dismissedBridges,
      }),
    },
  ),
)
