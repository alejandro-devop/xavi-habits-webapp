import { createContext, useContext } from 'react'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'

export type VidaSessionUiValue = {
  /** Abre el cierre completo sobre esa sesión (criterio 6). */
  openFinishModal: (session: ActivityFollowUp) => void
  /**
   * Abre **solo la nota** de esa sesión (FEAT-018, criterio 538): el editor
   * corto de «¿Qué hiciste?». Va por aquí y no por props por lo mismo que el
   * cierre completo —entre el layout y la fila de la agenda hay un `Outlet`— y
   * se monta **una sola vez**, en el layout, porque se llega desde la fila del
   * día, desde la barra y desde antes de empezar.
   */
  openNoteSheet: (session: ActivityFollowUp) => void
}

/**
 * La única pieza de la sesión que **no** es dato: quién abre el cierre completo.
 *
 * El modal se monta **una sola vez**, en `routes/VidaModuleLayout.tsx`, porque
 * se llega a él por tres puertas —el «···» de la barra, el «···» del bloque en
 * marcha y el «añadir una nota» del toast del «Terminar»— y montarlo una vez por
 * puerta serían tres modales con tres estados que se pueden contradecir.
 *
 * Es un contexto y no una prop porque entre el layout del módulo y el bloque de
 * la agenda hay una ruta por medio: bajarlo a mano sería atravesar `Outlet`.
 *
 * El valor por defecto **no hace nada**: una pantalla montada suelta en un test
 * o en un arnés sigue funcionando, y lo que no puede abrir simplemente no se
 * abre. Sin `throw`: esto es cromo, no dato.
 *
 * Archivo `.ts` y sin componente `Provider` propio a propósito: un archivo que
 * exportara el contexto **y** un componente rompe `react-refresh/only-export-components`,
 * que es error en este repositorio. El layout usa `VidaSessionUiContext.Provider`
 * directamente.
 */
export const VidaSessionUiContext = createContext<VidaSessionUiValue>({
  openFinishModal: () => {},
  openNoteSheet: () => {},
})

export function useVidaSessionUi(): VidaSessionUiValue {
  return useContext(VidaSessionUiContext)
}
