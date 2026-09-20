import type { CSSProperties } from 'react'
import { useRemoveDayPlanItemMutation } from '@/features/vida/hooks/useActivityDayPlan'
import { useVidaElapsed } from '@/features/vida/hooks/useVidaElapsed'
import type { AgendaBlock } from '@/features/vida/utils/vida-agenda.utils'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import { describeOverPlan } from '@/features/vida/utils/vida-session.utils'
import {
  formatDurationMinutes,
  formatTimeForDisplay,
  minutesToTime,
} from '@/features/vida/utils/vida-time.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { IconButton } from '@/shared/ui/IconButton'
import { Popover } from '@/shared/ui/Popover'
import styles from './VidaAgendaBlock.module.scss'

type VidaAgendaBlockProps = {
  block: AgendaBlock
  /** Es el primero que aún no ha empezado: lleva el «en N min» (criterio 16). */
  isNext?: boolean
  /** Minutos desde medianoche, o `null` si el día mostrado no es hoy. */
  nowMinutes?: number | null
  /**
   * `YYYY-MM-DD` del día del bloque: `activityDayPlanItemRemove` devuelve
   * `Boolean!` sin fecha, así que la invalidación la sostiene quien llama.
   * Sin fecha no se pinta el «···»: un menú que no puede escribir no se pinta.
   */
  date?: string | null
  /** «Cambiar hora o duración»: abre la hoja con la ventana del bloque (criterio 30). */
  onEdit?: (block: AgendaBlock) => void

  /* ── La sesión viva (FEAT-004, tajada 1) ────────────────────────────────
   *
   * Todo esto es **aditivo**: sin ninguna de estas props el bloque se pinta
   * exactamente como lo dejó FEAT-003, que es lo que pasa en un día futuro, en
   * uno pasado y en cualquier pantalla que no cablee la sesión.
   */

  /** «▶ Empezar» (criterios 1 y 2). Sin esto no se pinta: no se empieza el pasado ni el futuro. */
  onStart?: (block: AgendaBlock) => void
  /** Este bloque es el que está en marcha ahora mismo. */
  isRunning?: boolean
  /** El instante en que empezó la sesión: lo que cuenta el cronómetro (criterio 3). */
  sessionStartInstant?: Date | null
  /** «Terminar», de un solo toque (criterio 5). */
  onFinish?: () => void
  /** El cierre completo: duración, notas y subtareas (criterio 6). */
  onOpenFinishModal?: () => void
  /** Una mutación de sesión en vuelo: los botones se inhabilitan (criterio 13). */
  isSessionBusy?: boolean
}

/**
 * Un bloque del plan: hora, icono y color de su categoría, nombre y duración.
 *
 * El icono y el color salen de `item.activity.category`, que **ya viaja dentro
 * del plan del día** (`activity-day-plan.graphql.ts` selecciona
 * `category { id name color icon }`). Por eso aquí no hace falta el cruce por
 * `Map` con las categorías que hace `VidaActividadesPage`: el dato viene
 * pegado al bloque y una consulta menos es una consulta menos.
 *
 * **Desde FEAT-004 también se vive el día**, y todo lo de vivirlo es **aditivo**:
 * sin las props de sesión el bloque se pinta exactamente como lo dejó FEAT-003,
 * que es lo que pasa en un día futuro, en uno pasado y en cualquier pantalla que
 * no cablee la sesión. Lo que añade: **«▶ Empezar»** (criterios 1 y 2), el
 * estado **«planeado 45 min · en marcha»** con el **cronómetro** (criterio 3),
 * **«Terminar»** de un toque (criterio 5), el aviso de que te pasaste **sin
 * interrumpir** (criterio 9) y, en el «···», **«Terminar y añadir una nota»**
 * (criterio 6).
 *
 * El cronómetro lo cuenta `useVidaElapsed` **contra el instante de inicio de la
 * sesión**, no contra el montaje: recargar la página no lo reinicia. Y solo el
 * bloque en marcha monta un intervalo; los demás pasan `null`.
 *
 * Lo que **no** hace: pintar «ya registrado» ni ninguna etiqueta de ejecutado
 * («✓ calcado», «+11 min», las horas reales). Eso necesita el cruce sesión ↔
 * bloque de D1, que es la **tajada 2**. Por eso aquí «▶ Empezar» se esconde solo
 * en el bloque en marcha y en los días que no son hoy: la otra mitad del
 * criterio 1 llega con el cruce.
 *
 * En pantalla se lee **«Quitar del plan»**: nunca «cancelar» ni «eliminar»
 * (criterio 30, heredado del 25 de FEAT-002). Y la salida del diálogo es
 * «Volver», igual que al archivar en el catálogo.
 *
 * El menú se monta como en `VidaActivityCard`: `Popover` + `IconButton`, y la
 * mutación vive **aquí**, no en la página, por el mismo motivo que allí —el
 * confirmar y el quitar son una sola decisión y no hay nada que la página
 * necesite saber—. Cambiar hora o duración sí sube: la hoja es de la página.
 */
export function VidaAgendaBlock({
  block,
  isNext = false,
  nowMinutes = null,
  date = null,
  onEdit,
  onStart,
  isRunning = false,
  sessionStartInstant = null,
  onFinish,
  onOpenFinishModal,
  isSessionBusy = false,
}: VidaAgendaBlockProps) {
  const { confirm } = useConfirmDialog()
  const removeMutation = useRemoveDayPlanItemMutation()
  // Solo tictaquea el bloque que está en marcha: los demás pasan `null` y el
  // hook no monta ningún intervalo (criterio 4).
  const elapsed = useVidaElapsed(isRunning ? sessionStartInstant : null)
  const category = block.item.activity?.category ?? null
  const colorStyle = category?.color
    ? ({ '--vida-category-color': category.color } as CSSProperties)
    : undefined
  const startsIn = nowMinutes === null ? null : block.startMinutes - nowMinutes
  const title = block.item.activity?.title ?? 'Actividad'
  // El criterio 16 pide «en N min» y eso es lo que se lee dentro de la hora
  // siguiente. Más allá, «en 920 min» no se lee: se usa el formateador largo
  // que ya existe y queda «en 15 h 20 min» (hallazgo 4 del revisor).
  // «llevas 52 min · planeado 45». Solo cuando hay sesión y solo cuando se pasa.
  const overPlan = isRunning ? describeOverPlan(elapsed.minutes, block.durationMinutes) : null
  const soonLabel =
    startsIn === null || startsIn <= 0
      ? null
      : startsIn < 60
        ? `en ${startsIn} min`
        : `en ${formatDurationMinutes(startsIn)}`

  async function handleRemove() {
    if (!date) return
    const ok = await confirm({
      title: `¿Quitar «${title}» de tu plan?`,
      description:
        'Sale del plan de este día y el rato vuelve a quedar libre. Sigue en tu catálogo y en tu plantilla.',
      confirmLabel: 'Quitar del plan',
      cancelLabel: 'Volver',
    })
    if (!ok) return
    removeMutation.mutate({ itemId: block.item.id, date })
  }

  const menu = (
    <ul className={styles.menu}>
      {isRunning && onOpenFinishModal ? (
        <li>
          <button type="button" className={styles.menuItem} onClick={onOpenFinishModal}>
            Terminar y añadir una nota
          </button>
        </li>
      ) : null}
      {onEdit ? (
        <li>
          <button type="button" className={styles.menuItem} onClick={() => onEdit(block)}>
            Cambiar hora o duración
          </button>
        </li>
      ) : null}
      <li>
        <button
          type="button"
          className={styles.menuItem}
          onClick={handleRemove}
          disabled={removeMutation.isPending}
        >
          Quitar del plan
        </button>
      </li>
    </ul>
  )

  return (
    <li className={styles.row} style={colorStyle}>
      <span className={styles.gutter}>
        <time className={styles.time} dateTime={minutesToTime(block.startMinutes)}>
          {formatTimeForDisplay(minutesToTime(block.startMinutes))}
        </time>
        <span className={styles.tick} aria-hidden />
      </span>

      <article className={styles.card}>
        <span className={styles.capsule} aria-hidden>
          <AppIcon name={category?.icon ?? UNCATEGORIZED_GROUP_ICON} size="sm" decorative />
        </span>
        <div className={styles.body}>
          <p className={styles.name}>{title}</p>
          <p className={styles.meta}>
            {isRunning ? (
              <>
                planeado {formatDurationMinutes(block.durationMinutes)} ·{' '}
                <span className={styles.live}>en marcha</span>
              </>
            ) : (
              <>
                {formatDurationMinutes(block.durationMinutes)}
                {isNext && soonLabel ? <span className={styles.soon}> · {soonLabel}</span> : null}
              </>
            )}
          </p>
          {/* Pasarse del plan **no interrumpe** (criterio 9): una línea, sin
              color de alarma, sin modal y sin sonido. */}
          {overPlan ? <p className={styles.overPlan}>{overPlan}</p> : null}
        </div>

        {isRunning ? (
          <div className={styles.running}>
            <span
              className={styles.timer}
              aria-live="polite"
              aria-label={`Llevas ${elapsed.label}`}
            >
              {elapsed.label}
            </span>
            {onFinish ? (
              <Button size="sm" variant="primary" onClick={onFinish} disabled={isSessionBusy}>
                Terminar
              </Button>
            ) : null}
          </div>
        ) : onStart ? (
          <Button
            size="sm"
            variant="secondary"
            className={styles.start}
            // Dos toques seguidos **no crean dos sesiones** (criterio 13).
            disabled={isSessionBusy}
            onClick={() => onStart(block)}
          >
            ▶ Empezar
          </Button>
        ) : null}

        {date ? (
          <div className={styles.more}>
            <Popover
              triggerLabel={`Más opciones de ${title}`}
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
