import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { VidaNoteLine } from '@/features/vida/components/VidaNoteLine'
import { useVidaElapsed } from '@/features/vida/hooks/useVidaElapsed'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import { VIDA_NOTE_QUESTION_RUNNING } from '@/features/vida/utils/vida-notes.utils'
import { describeOverPlan } from '@/features/vida/utils/vida-session.utils'
import { formatTimeForDisplay } from '@/features/vida/utils/vida-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { IconButton } from '@/shared/ui/IconButton'
import styles from './VidaSessionBar.module.scss'

type VidaSessionBarProps = {
  session: ActivityFollowUp
  /** El instante en que empezó: es lo que cuenta el cronómetro (criterio 3). */
  startInstant: Date | null
  /** Lo que ese bloque tenía planeado, o `null` si no se sabe (criterio 9). */
  plannedMinutes?: number | null
  /** «Terminar», de un solo toque (criterio 5). */
  onFinish: () => void
  /** El «···»: el cierre completo —duración, notas, subtareas— (criterio 6). */
  onOpenFinishModal: () => void
  /** Mientras una mutación está en vuelo (criterio 13). */
  isBusy?: boolean

  /* ── «Qué estás haciendo» (FEAT-018, tajada 2) ───────────────────────────
   *
   * Aditivas: sin `onEditNote` la barra se pinta **exactamente como hoy**.
   */

  /** Lo que se escribió en esta sesión, si hay algo (criterio 542). */
  note?: string | null
  /**
   * Abre el editor corto. **No para el cronómetro, no termina la sesión y no
   * cierra la barra** (criterio 543): lo único que hace es abrir una hoja.
   */
  onEditNote?: () => void
}

/**
 * La sesión en marcha, visible **desde cualquier pantalla del módulo Vida**
 * (criterio 7): una barra fija abajo con el nombre, el cronómetro y «Terminar».
 *
 * Reescritura de `79bece0:src/features/activities/components/RunningActivityTimer/`.
 * De allí vale la estructura —icono con el color de la categoría, título,
 * cronómetro con `aria-live="polite"`, hora de inicio y acciones— y no vale el
 * `Card` centrado: aquí es una barra del módulo entero. Y **el botón «Cancelar»
 * desaparece**: en Vida no se cancela (criterios 14 y 59). Lo que era cancelar
 * es «No era esto — no guardarla», y vive dentro del cierre completo.
 *
 * **Quién la monta:** `routes/VidaModuleLayout.tsx`, el elemento de ruta del
 * módulo. No `AppLayout`: `app-nav.config.ts` no conoce `/app/vida/semana` ni
 * las archivadas y el criterio 7 sí.
 *
 * No consulta nada: recibe la sesión de quien ya la tiene (criterio 8) y lo
 * único que tictaquea es `useVidaElapsed`, a un segundo y contra `Date.now()`.
 *
 * Pasarse del plan **no interrumpe** (criterio 9): se lee «llevas 52 min ·
 * planeado 45» junto a la hora de inicio, sin color de alarma, sin modal y sin
 * sonido. Nadie corta el trabajo.
 */
export function VidaSessionBar({
  session,
  startInstant,
  plannedMinutes = null,
  onFinish,
  onOpenFinishModal,
  isBusy = false,
  note = null,
  onEditNote,
}: VidaSessionBarProps) {
  const { label, minutes } = useVidaElapsed(startInstant)
  const category = session.activity?.category ?? null
  const title = session.activity?.title ?? 'Actividad'
  const colorStyle = category?.color
    ? ({ '--vida-category-color': category.color } as CSSProperties)
    : undefined
  const overPlan = describeOverPlan(minutes, plannedMinutes)

  return (
    <div className={styles.root} style={colorStyle}>
      <div className={styles.bar}>
        <div className={styles.row}>
          {/* Un toque en el nombre lleva a Hoy, al día de la sesión (criterio 7). */}
          <Link className={styles.identity} to={vidaPaths.hoyForDate(session.date)}>
            <span className={styles.capsule} aria-hidden>
              <AppIcon name={category?.icon ?? UNCATEGORIZED_GROUP_ICON} size="sm" decorative />
            </span>
            <span className={styles.text}>
              <span className={styles.name}>{title}</span>
              <span className={styles.meta}>
                {overPlan ?? `desde las ${formatTimeForDisplay(session.startTime)}`}
              </span>
            </span>
          </Link>

          <span className={styles.timer} aria-live="polite" aria-label={`Llevas ${label}`}>
            {label}
          </span>

          <Button size="sm" variant="primary" onClick={onFinish} disabled={isBusy}>
            Terminar
          </Button>

          <IconButton
            icon="ellipsis"
            size="sm"
            aria-label={`Terminar «${title}» con duración, notas y subtareas`}
            onClick={onOpenFinishModal}
            disabled={isBusy}
          />
        </div>

        {/* La línea de «qué estás haciendo», **debajo del cronómetro y dentro
            de la misma tarjeta** (punto 2 del render 19). Tocarla abre el
            editor y ya: el cronómetro sigue contra `Date.now()` y la barra no
            se desmonta (criterio 543). Sin `onEditNote` no se pinta. */}
        {onEditNote ? (
          <VidaNoteLine
            text={note}
            placeholder={VIDA_NOTE_QUESTION_RUNNING}
            onEdit={onEditNote}
            tone="running"
          />
        ) : null}
      </div>
    </div>
  )
}
