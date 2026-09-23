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
  /**
   * **«Empecé antes»** (FEAT-013, criterio 342): corregir desde cuándo cuenta
   * esto, **sin terminarlo**. La puerta es **la línea de la hora**, un toque.
   * Sin esta prop esa línea es el texto de siempre y la barra se pinta
   * exactamente como antes de FEAT-013.
   */
  onCorrectStart?: () => void
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
  onCorrectStart,
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
  // Lo que se lee bajo el nombre: «llevas 52 min · planeado 45» cuando te pasas
  // del plan (criterio 9), y «desde las 9:00» el resto del tiempo.
  const metaLabel = overPlan ?? `desde las ${formatTimeForDisplay(session.startTime)}`

  return (
    <div className={styles.root} style={colorStyle}>
      <div className={styles.bar}>
        <div className={styles.row}>
          <span className={styles.identity}>
            <span className={styles.capsule} aria-hidden>
              <AppIcon name={category?.icon ?? UNCATEGORIZED_GROUP_ICON} size="sm" decorative />
            </span>
            <span className={styles.text}>
              {/* Un toque en el nombre lleva a Hoy, al día de la sesión
                  (criterio 7). El enlace envuelve **el nombre**, no la línea de
                  debajo: un botón dentro de un enlace no se puede escribir. */}
              <Link className={styles.name} to={vidaPaths.hoyForDate(session.date)}>
                {title}
              </Link>
              {/* **La hora es la puerta de «Empecé antes»** (FEAT-013, criterio
                  342, en la forma que pidió el revisor): la línea que ya dice
                  «desde las 9:00» es literalmente el dato que se viene a
                  corregir, así que tocarla es **un** toque y el «···» se queda
                  como estaba. Molde: `VidaNoteLine` —texto que se puede tocar,
                  hermano del enlace, dentro de la misma tarjeta—. Sin
                  `onCorrectStart` es el mismo texto de siempre. */}
              {onCorrectStart ? (
                <button
                  type="button"
                  className={styles.meta}
                  // El texto visible va **dentro** del nombre accesible: quien
                  // dicta «desde las 9:00» acierta el control.
                  aria-label={`${metaLabel} — corregir a qué hora empezaste «${title}»`}
                  onClick={onCorrectStart}
                  disabled={isBusy}
                >
                  {metaLabel}
                </button>
              ) : (
                <span className={styles.meta}>{metaLabel}</span>
              )}
            </span>
          </span>

          <span className={styles.timer} aria-live="polite" aria-label={`Llevas ${label}`}>
            {label}
          </span>

          <Button size="sm" variant="primary" onClick={onFinish} disabled={isBusy}>
            Terminar
          </Button>

          {/* **El «···» sigue siendo un toque** al cierre completo, como antes
              de esta feature: la puerta de «Empecé antes» es la línea de la
              hora de aquí arriba, no una entrada de menú (FEAT-013, tajada 2,
              devolución del revisor). «Terminar y añadir una nota» no cambia
              ni de sitio ni de precio (criterio 349). */}
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
