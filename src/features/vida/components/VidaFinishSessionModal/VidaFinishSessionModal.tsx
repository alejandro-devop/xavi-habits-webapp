import { useState } from 'react'
import { VidaDurationPills } from '@/features/vida/components/VidaDurationPills'
import { useEditFollowUpSubtaskMutation } from '@/features/vida/hooks/useActivityFollowUps'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import {
  elapsedMinutes,
  followUpStartInstant,
} from '@/features/vida/utils/vida-session.utils'
import { formatTimeForDisplay } from '@/features/vida/utils/vida-time.utils'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { SteppedModal } from '@/shared/ui/SteppedModal'
import styles from './VidaFinishSessionModal.module.scss'

type VidaFinishSessionModalProps = {
  open: boolean
  onClose: () => void
  /** La sesión que se cierra: abierta, o ya cerrada si se llega desde el toast. */
  session: ActivityFollowUp
  /** Guarda con `activityFollowUpEdit`. Resuelve, no lanza (criterio 12). */
  onSave: (values: {
    id: string
    durationMinutes: number
    notes: string | null
  }) => Promise<{ ok: boolean; message?: string }>
  /** «No era esto — no guardarla» (criterio 14). */
  onDiscard: (session: ActivityFollowUp) => Promise<{ ok: boolean; message?: string }>
}

/**
 * El cierre completo de una sesión (criterio 6): **duración ajustable**, **notas
 * en texto plano** y las **subtareas** si las hay.
 *
 * Es el mismo sitio al que lleva el «añadir una nota» del toast del «Terminar»
 * (criterio 5) y el «···» de la barra y del bloque. Se llega por tres puertas y
 * es **una sola pantalla**.
 *
 * **Molde: `VidaPlaceInGapSheet`.** `SteppedModal` con `ds="aura"` y
 * `mobileSheet`, el estado aquí arriba, **una `key` por apertura** que pone
 * quien abre, y —lo que sostiene el criterio 12— el cierre en el resultado
 * **local** del guardado: si la mutación falla, la hoja **se queda abierta con
 * las notas escritas** y el fallo se lee dentro, en un `Alert`.
 *
 * **Notas en texto plano, y no vuelve tiptap** (decisión 4 del arquitecto): un
 * `textarea`. El `ActivityBitacoraModal` de `79bece0` dependía del editor
 * enriquecido y por eso no se rescató.
 *
 * **Sin «Cancelar» ni «Eliminar»** (criterios 14 y 59). La salida del diálogo
 * de descartar es «Volver», igual que al quitar un bloque del plan.
 */
export function VidaFinishSessionModal({
  open,
  onClose,
  session,
  onSave,
  onDiscard,
}: VidaFinishSessionModalProps) {
  const { confirm } = useConfirmDialog()
  const subtaskMutation = useEditFollowUpSubtaskMutation()

  // La duración de partida: la que ya tiene si está cerrada, y si sigue abierta
  // los minutos del cronómetro **en el momento de abrir**. No tictaquea dentro
  // del modal: un número que se mueve mientras se ajusta a mano no se deja
  // ajustar.
  const [durationMinutes, setDurationMinutes] = useState<number | null>(() => {
    if (typeof session.durationMinutes === 'number') return session.durationMinutes
    const start = followUpStartInstant(session)
    return start ? elapsedMinutes(start, new Date()) : 1
  })
  const [notes, setNotes] = useState(session.notes ?? '')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const title = session.activity?.title ?? 'Actividad'
  const subtasks = session.sessionSubtasks ?? []
  const doneCount = subtasks.filter((subtask) => subtask.isCompleted).length

  async function handleSave() {
    if (durationMinutes === null || durationMinutes < 1) {
      setFormError('Dinos cuánto duró: como mínimo un minuto.')
      return
    }
    setFormError(null)
    setIsSaving(true)
    const result = await onSave({
      id: session.id,
      durationMinutes,
      notes: notes.trim() ? notes.trim() : null,
    })
    setIsSaving(false)
    if (!result.ok) {
      // La sesión sigue abierta y las notas siguen escritas (criterio 12).
      setFormError(result.message ?? 'No pudimos guardarlo. Inténtalo otra vez.')
      return
    }
    onClose()
  }

  async function handleDiscard() {
    const ok = await confirm({
      title: `¿No guardar «${title}»?`,
      description:
        'La quitamos del registro, como si no la hubieras empezado. Tu actividad sigue en el catálogo y en tu plantilla.',
      confirmLabel: 'No guardarla',
      cancelLabel: 'Volver',
    })
    if (!ok) return
    setIsSaving(true)
    const result = await onDiscard(session)
    setIsSaving(false)
    if (!result.ok) {
      setFormError(result.message ?? 'No pudimos quitarla. Inténtalo otra vez.')
      return
    }
    onClose()
  }

  const footer = (
    <div className={styles.footer}>
      {/* «No era esto» sale por la izquierda y en `ghost`: es una salida, no una
          alternativa con el mismo peso que guardar. */}
      <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={isSaving}>
        No era esto — no guardarla
      </Button>
      <div className={styles.footerMain}>
        <Button variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>
          Volver
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </div>
  )

  return (
    <SteppedModal
      open={open}
      onClose={onClose}
      title={`Terminar «${title}»`}
      description={`Empezó a las ${formatTimeForDisplay(session.startTime)}. Ajusta lo que haga falta.`}
      size="md"
      ds="aura"
      mobileSheet
      footer={footer}
    >
      <div className={styles.form}>
        <section className={styles.block} aria-labelledby="vida-finish-duration">
          <h3 className={styles.legend} id="vida-finish-duration">
            Cuánto duró
          </h3>
          <VidaDurationPills
            value={durationMinutes}
            onChange={setDurationMinutes}
            disabled={isSaving}
            label="Cuánto duró"
          />
        </section>

        <section className={styles.block} aria-labelledby="vida-finish-notes">
          <h3 className={styles.legend} id="vida-finish-notes">
            Notas
          </h3>
          <textarea
            className={styles.notes}
            value={notes}
            rows={3}
            maxLength={2000}
            disabled={isSaving}
            placeholder="Lo que quieras recordar de este rato."
            aria-label="Notas de esta sesión"
            onChange={(event) => setNotes(event.target.value)}
          />
        </section>

        {/* Si no tiene subtareas **no se pinta ninguna sección** (criterio 10):
            una lista vacía sugeriría que faltan, y el catálogo dejó las
            subtareas fuera a propósito. */}
        {subtasks.length > 0 ? (
          <section className={styles.block} aria-labelledby="vida-finish-subtasks">
            <h3 className={styles.legend} id="vida-finish-subtasks">
              Subtareas{' '}
              <span className={styles.count}>
                {doneCount} de {subtasks.length}
              </span>
            </h3>
            <ul className={styles.subtasks}>
              {subtasks.map((subtask) => (
                <li key={subtask.id}>
                  <label className={styles.subtask}>
                    <input
                      type="checkbox"
                      checked={subtask.isCompleted}
                      disabled={isSaving || subtaskMutation.isPending}
                      onChange={(event) =>
                        subtaskMutation.mutate({
                          followUpId: session.id,
                          sessionSubtaskId: subtask.id,
                          isCompleted: event.target.checked,
                        })
                      }
                    />
                    <span>{subtask.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {formError ? (
          <Alert variant="danger" title="No pudimos guardarlo">
            <p className={styles.errorText}>{formError}</p>
          </Alert>
        ) : null}
      </div>
    </SteppedModal>
  )
}
