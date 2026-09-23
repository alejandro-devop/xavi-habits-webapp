import type { CSSProperties } from 'react'
import { VidaNoteLine } from '@/features/vida/components/VidaNoteLine'
import { useDeleteActivityFollowUpMutation } from '@/features/vida/hooks/useActivityFollowUps'
import type { ActivityFollowUp } from '@/features/vida/types/activity-followup.types'
import type { ExecutionSessionEntry } from '@/features/vida/utils/vida-execution.utils'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import { formatTimeForDisplay, minutesToTime } from '@/features/vida/utils/vida-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { IconButton } from '@/shared/ui/IconButton'
import { Popover } from '@/shared/ui/Popover'
import styles from './VidaAgendaSession.module.scss'

type VidaAgendaSessionProps = {
  entry: ExecutionSessionEntry
  /**
   * «Corregir» (criterio 35): abre la hoja con esta sesión. Sin esto **no se
   * pinta el «···»**, que es lo que pasa mientras la sesión sigue en marcha
   * —ahí se termina, no se corrige— y en cualquier pantalla que no lo cablee.
   */
  onEdit?: (session: ActivityFollowUp) => void

  /* ── «Qué hiciste» (FEAT-018, tajada 1) ─────────────────────────────────
   *
   * Aditivo: sin estas dos props la fila se pinta exactamente como antes.
   */

  /** Lo que se escribió en esta sesión. Se pinta bajo el nombre (criterio 535). */
  note?: string | null
  /**
   * Abre el editor de la nota. **Sin esto no se ofrece el «＋ añadir qué
   * hiciste»**: es lo que pasa en un día futuro, donde no hay nada que contar
   * (criterios 536 y 537).
   */
  onEditNote?: () => void
}

/**
 * Algo que pasó y **no es de ningún bloque del plan** (criterio 22), o lo real
 * de un bloque **movido** (criterio 23).
 *
 * Se pinta **en su hora**, en trazo punteado, con su actividad, sus horas y su
 * duración. No se descarta ni se encaja a la fuerza en un bloque: el plan se
 * queda quieto donde estaba y esto se cuenta aparte.
 *
 * Mismo esqueleto que `VidaAgendaBlock` y `VidaAgendaGap` —canaleta con la hora
 * a la izquierda, tarjeta a la derecha— para que la agenda se lea de corrido.
 * Lo que cambia es el trazo: **punteado**, como en el render 04-B.
 *
 * El texto distingue los dos casos **sin depender del color** (criterio 45, que
 * es de la tajada 4, pero la regla vale ya): «fuera del plan» y «40 min tarde».
 * Ninguno reprocha nada.
 *
 * **Desde la tajada 3 se puede corregir y quitar** (criterio 35). El «···» —el
 * mismo `Popover` + `IconButton` de `VidaAgendaBlock`— lleva a **«Corregir»**
 * (hora, duración y notas, que los pinta la hoja) y a **«Quitar del registro»**,
 * con confirmación que nombra qué se quita y salida **«Volver»**. Nunca
 * «cancelar» ni «eliminar» (criterio 59).
 *
 * Quitar vive **aquí** y no en la página, por el mismo motivo que en el bloque:
 * confirmar y quitar son **una sola decisión** y no hay nada que la página
 * necesite saber. Corregir sí sube, porque la hoja es de la página.
 *
 * Una sesión **en marcha** no ofrece nada de esto: se termina desde su bloque o
 * desde la barra del módulo, y corregir la hora de algo que aún no ha acabado
 * sería corregir lo que todavía no se sabe.
 */
export function VidaAgendaSession({
  entry,
  onEdit,
  note = null,
  onEditNote,
}: VidaAgendaSessionProps) {
  const { confirm } = useConfirmDialog()
  const removeMutation = useDeleteActivityFollowUpMutation()
  const session = entry.span.session
  const category = entry.span.session.activity?.category ?? null
  const colorStyle = category?.color
    ? ({ '--vida-category-color': category.color } as CSSProperties)
    : undefined
  // Mientras está en marcha no hay nada que corregir: se termina.
  const canManage = Boolean(onEdit) && !entry.span.isRunning

  async function handleRemove() {
    const ok = await confirm({
      title: `¿Quitar «${entry.span.title}» del registro?`,
      description: `Se va el rato de ${entry.rangeLabel} y el día vuelve a contarlo como sin dato. Tu actividad sigue en el catálogo y en tu plantilla.`,
      confirmLabel: 'Quitar del registro',
      cancelLabel: 'Volver',
    })
    if (!ok) return
    removeMutation.mutate({
      id: session.id,
      date: session.date,
      activityId: session.activityId,
      wasOpen: false,
    })
  }

  const menu = (
    <ul className={styles.menu}>
      <li>
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => onEdit?.(session)}
          disabled={removeMutation.isPending}
        >
          Corregir
        </button>
      </li>
      <li>
        <button
          type="button"
          className={styles.menuItem}
          onClick={handleRemove}
          disabled={removeMutation.isPending}
        >
          Quitar del registro
        </button>
      </li>
    </ul>
  )

  return (
    // El `id` es **la vía** del «en su lugar, X» de un bloque (criterio 42):
    // el ancla de la fila donde se pinta lo que sí ocurrió.
    <li id={entry.id} className={styles.row} style={colorStyle} data-variant={entry.variant}>
      <span className={styles.gutter}>
        <time className={styles.time} dateTime={minutesToTime(entry.startMinutes)}>
          {formatTimeForDisplay(minutesToTime(entry.startMinutes))}
        </time>
        <span className={styles.tick} aria-hidden />
      </span>

      <article className={styles.card}>
        <span className={styles.capsule} aria-hidden>
          <AppIcon name={category?.icon ?? UNCATEGORIZED_GROUP_ICON} size="sm" decorative />
        </span>
        <div className={styles.body}>
          <p className={styles.name}>{entry.span.title}</p>
          {/* Lo que hiciste dentro de este rato (criterio 535), entre el nombre
              y la hora. Sin nota y sin poder escribirla, no deja hueco. */}
          <VidaNoteLine
            text={note}
            placeholder={onEditNote ? 'añadir qué hiciste' : null}
            onEdit={onEditNote}
          />
          <p className={styles.meta}>
            {entry.rangeLabel} · {entry.durationLabel}
            {entry.span.isRunning ? (
              <>
                {' · '}
                <span className={styles.live}>en marcha</span>
              </>
            ) : null}
          </p>
        </div>
        <span className={styles.tag}>{entry.label}</span>

        {canManage ? (
          <div className={styles.more}>
            <Popover
              triggerLabel={`Más opciones de ${entry.span.title}`}
              trigger={<IconButton icon="ellipsis" size="sm" tabIndex={-1} aria-hidden />}
              content={menu}
              placement="bottom-end"
            />
          </div>
        ) : null}
      </article>
    </li>
  )
}
