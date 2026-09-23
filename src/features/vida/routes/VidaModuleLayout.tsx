import { useMemo, useState } from 'react'
import { Outlet } from 'react-router'
import { VidaFinishSessionModal } from '@/features/vida/components/VidaFinishSessionModal'
import { VidaNoteSheet } from '@/features/vida/components/VidaNoteSheet'
import { VidaSessionBar } from '@/features/vida/components/VidaSessionBar'
import { VidaStaleSessionPrompt } from '@/features/vida/components/VidaStaleSessionPrompt'
import { useVidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import {
  useVidaOpenSession,
  useVidaSessionPlannedMinutes,
} from '@/features/vida/hooks/useVidaOpenSession'
import { useVidaActivityNoteHistory } from '@/features/vida/hooks/useVidaActivityNoteHistory'
import { useVidaSessionActions } from '@/features/vida/hooks/useVidaSessionActions'
import { useVidaSessionNote } from '@/features/vida/hooks/useVidaSessionNote'
import { VidaSessionUiContext } from '@/features/vida/hooks/useVidaSessionUi'
import type { VidaStartNoteRequest } from '@/features/vida/hooks/useVidaSessionUi'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import {
  VIDA_NOTE_QUESTION_DONE,
  VIDA_NOTE_QUESTION_NEXT,
  VIDA_NOTE_QUESTION_RUNNING,
} from '@/features/vida/utils/vida-notes.utils'
import { formatTimeForDisplay } from '@/features/vida/utils/vida-time.utils'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import styles from './VidaModuleLayout.module.scss'

/**
 * El elemento de ruta del módulo Vida: lo que se ve **en todas** sus pantallas.
 *
 * Aquí viven la **barra de la sesión en marcha** (criterio 7), la **pregunta por
 * la sesión que quedó abierta de otro día** (criterio 16), el **cierre completo**
 * (criterio 6) y el hueco reservado abajo para que la barra no tape el último
 * bloque de la agenda ni los botones de una hoja (criterio 60).
 *
 * **Por qué aquí y no en `AppLayout`.** El subárbol de rutas es la frontera
 * exacta que pide el criterio 7 —«todas las pantallas del módulo», «fuera del
 * módulo, nada»—, sale gratis y no se puede desincronizar. `AppLayout` sabe cuál
 * es el módulo activo, pero lo sabe por `app-nav.config.ts`, que **no conoce**
 * `/app/vida/semana` ni `/app/vida/actividades/archivadas` (están fuera a
 * propósito): la condición se equivocaría justo donde importa. Y tampoco un
 * portal por página: se montaría una vez por pantalla y rompería el criterio 8.
 *
 * **Una sola consulta para todo el módulo** (criterio 8): `useVidaOpenSession`
 * envuelve `vidaKeys.followUps.open()`, que ya estaba cacheada. Las URL no
 * cambian: este componente es el `element` de un nodo de ruta que ya existía.
 */
export function VidaModuleLayout() {
  const { session, startInstant, isFromAnotherDay, isDisabled, isError, refetch } =
    useVidaOpenSession()
  const plannedMinutes = useVidaSessionPlannedMinutes(session)
  const dayHours = useVidaDayHours()

  // La sesión que se está cerrando con detalle. Puede ser la abierta (desde el
  // «···») o una **recién cerrada** (desde el «añadir una nota» del toast), y
  // por eso es su propio estado y no `session`.
  const [finishing, setFinishing] = useState<ActivityFollowUp | null>(null)
  const [finishOpen, setFinishOpen] = useState(false)
  // Una `key` por apertura, como en `VidaActividadesPage`: la hoja se remonta
  // limpia sin que nadie tenga que vaciarla a mano.
  const [finishSession, setFinishSession] = useState(0)

  function openFinish(target: ActivityFollowUp) {
    setFinishing(target)
    setFinishSession((value) => value + 1)
    setFinishOpen(true)
  }

  // **Solo la nota** (FEAT-018). Estado propio y `key` propia por el mismo
  // motivo que el cierre completo: se llega desde la fila del día —hoy o
  // cualquier día pasado— y desde la barra, y una hoja por puerta serían dos
  // estados que se contradicen.
  const [noting, setNoting] = useState<ActivityFollowUp | null>(null)
  // **Antes de empezar** (tajada 3): aquí no hay sesión todavía, así que lo
  // que se guarda no va al API — vuelve a quien lo pidió, que lo deja en su
  // borrador hasta que se pulse «▶ Empezar». Es **la misma** hoja: los dos
  // estados no pueden estar puestos a la vez porque abrir uno apaga el otro.
  const [startNote, setStartNote] = useState<VidaStartNoteRequest | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteSession, setNoteSession] = useState(0)

  function openNote(target: ActivityFollowUp) {
    setStartNote(null)
    setNoting(target)
    setNoteSession((value) => value + 1)
    setNoteOpen(true)
  }

  function openStartNote(request: VidaStartNoteRequest) {
    setNoting(null)
    setStartNote(request)
    setNoteSession((value) => value + 1)
    setNoteOpen(true)
  }

  const actions = useVidaSessionActions({ onAddNote: openFinish })
  const { saveNote } = useVidaSessionNote()
  /**
   * «Lo de otras veces» (criterio 546). **Solo con el editor abierto**: sin
   * hoja no hay consulta, así que entrar en cualquier pantalla del módulo
   * cuesta exactamente lo mismo que antes de esta feature.
   */
  const noteHistory = useVidaActivityNoteHistory({
    activityId: noting?.activityId ?? startNote?.activityId ?? null,
    enabled: noteOpen && (noting !== null || startNote !== null),
    excludeId: noting?.id ?? null,
  })
  // Lo que el bloque en marcha de la agenda necesita del layout: abrir el
  // cierre completo y el editor de la nota. Va por contexto porque entre los
  // dos hay un `Outlet`.
  const sessionUi = useMemo(
    () => ({
      openFinishModal: openFinish,
      openNoteSheet: openNote,
      openStartNoteSheet: openStartNote,
    }),
    [],
  )

  // Sin sesión de usuario no se pinta nada de esto (criterio 64): ni barra, ni
  // pregunta, ni hueco reservado.
  const hasBar = !isDisabled && session !== null && !isFromAnotherDay
  const hasPrompt = !isDisabled && session !== null && isFromAnotherDay

  return (
    <div className={styles.root} data-session-bar={hasBar ? 'on' : undefined}>
      {/* Si no pudimos saber si hay algo en marcha, **se dice** (hallazgo 1 de
          la revisión de la tajada 1): callarlo se lee como «no tienes nada» y
          deja un «▶ Empezar» que acaba en «Ya tenías algo en marcha» sin
          ninguna barra para terminarla. Nada afirma lo que no sabe. */}
      {!isDisabled && isError ? (
        <Alert variant="warning" title="No pudimos saber si tienes algo en marcha">
          <p className={styles.errorText}>
            Si dejaste una sesión abierta, sigue guardada. Vuelve a intentarlo y aparece.
          </p>
          <Button variant="secondary" size="sm" onClick={refetch}>
            Reintentar
          </Button>
        </Alert>
      ) : null}

      {hasPrompt && session ? (
        <VidaStaleSessionPrompt
          session={session}
          plannedMinutes={plannedMinutes}
          dayEndTime={dayHours.endTime}
          onResolve={actions.resolveStale}
        />
      ) : null}

      <VidaSessionUiContext.Provider value={sessionUi}>
        <Outlet />
      </VidaSessionUiContext.Provider>

      {hasBar && session ? (
        <VidaSessionBar
          session={session}
          startInstant={startInstant}
          plannedMinutes={plannedMinutes}
          isBusy={actions.isBusy}
          onFinish={() => void actions.finishNow()}
          onOpenFinishModal={() => openFinish(session)}
          // **Qué estás haciendo** (FEAT-018, criterios 542 a 545). Abrir el
          // editor es solo abrir una hoja: ni pausa, ni termina, ni desmonta
          // la barra (criterio 543).
          note={session.notes}
          onEditNote={() => openNote(session)}
        />
      ) : null}

      {finishing ? (
        <VidaFinishSessionModal
          key={finishSession}
          open={finishOpen}
          onClose={() => setFinishOpen(false)}
          session={finishing}
          onSave={actions.finishWith}
          onDiscard={actions.discard}
        />
      ) : null}

      {/* El editor corto de la nota. **Es una pregunta, no un campo**
          (criterio 532): «¿Qué estás haciendo?» mientras corre, «¿Qué hiciste?»
          en cualquier otro momento. */}
      {noting ? (
        <VidaNoteSheet
          key={noteSession}
          open={noteOpen}
          onClose={() => setNoteOpen(false)}
          title={noting.isOpen ? VIDA_NOTE_QUESTION_RUNNING : VIDA_NOTE_QUESTION_DONE}
          subtitle={noteSubtitle(noting)}
          initialValue={noting.notes ?? ''}
          suggestions={noteHistory.suggestions}
          isSuggestionsPending={noteHistory.isPending}
          onSave={(notes) => saveNote(noting, notes)}
        />
      ) : null}

      {/* La **misma** hoja, antes de que exista la sesión (criterio 548).
          Guardar aquí no escribe en el API: deja el borrador en la pantalla
          que empezará, y el «▶ Empezar» sigue siendo un toque. */}
      {startNote ? (
        <VidaNoteSheet
          key={noteSession}
          open={noteOpen}
          onClose={() => setNoteOpen(false)}
          title={VIDA_NOTE_QUESTION_NEXT}
          subtitle={startNote.title}
          initialValue={startNote.initialValue}
          suggestions={noteHistory.suggestions}
          isSuggestionsPending={noteHistory.isPending}
          // Sin `Promise` y sin resultado: no hay nada que pueda fallar
          // —esto no escribe en el API—, así que la hoja cierra sola.
          onSave={(notes) => startNote.onSave(notes)}
        />
      ) : null}
    </div>
  )
}

/** «Trabajo en lululemon · 11:40»: de qué rato hablamos, sin repetir la pregunta. */
function noteSubtitle(session: ActivityFollowUp): string {
  const title = session.activity?.title ?? 'Actividad'
  return `${title} · ${formatTimeForDisplay(session.startTime)}`
}
