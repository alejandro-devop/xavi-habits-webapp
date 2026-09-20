import type { CSSProperties } from 'react'
import {
  useActivityDayPlanQuery,
  useAddDayPlanItemMutation,
} from '@/features/vida/hooks/useActivityDayPlan'
import { useBuildDayFromTemplate } from '@/features/vida/hooks/useBuildDayFromTemplate'
import { useVidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import { useVidaItemsQuery } from '@/features/vida/hooks/useVidaItems'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import type { VidaSuggestion } from '@/features/vida/types/vida-item.types'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import {
  describeBuildDay,
  templateItemsForDate,
} from '@/features/vida/utils/vida-build-day.utils'
import type { DayAgenda } from '@/features/vida/utils/vida-agenda.utils'
import { findFirstFittingGap } from '@/features/vida/utils/vida-agenda.utils'
import { UNCATEGORIZED_GROUP_ICON } from '@/features/vida/utils/vida-catalog.utils'
import { toDayPlanTimes } from '@/features/vida/utils/vida-gap-form.utils'
import {
  VIDA_DAY_LABELS,
  formatDateToYmd,
  getCurrentLocalDate,
  getVidaDayOfWeek,
  parseYmdToLocalDate,
  pluralDayLabel,
} from '@/features/vida/utils/vida-date.utils'
import {
  DEFAULT_BLOCK_MINUTES,
  formatDurationFromMinutes,
  formatDurationMinutes,
  formatTimeForDisplay,
  minutesToTime,
} from '@/features/vida/utils/vida-time.utils'
import { isInPlanningWindow } from '@/features/vida/utils/vida-window.utils'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import styles from './VidaTemplateAside.module.scss'

type VidaTemplateAsideProps = {
  /** «viernes». */
  dayLabel: string
  suggestions: VidaSuggestion[]
  planItems: ActivityDayPlanItem[]
  /** `YYYY-MM-DD` del día que se está mirando: es donde se coloca. */
  date: string
  /** El día ya repartido: de sus huecos sale «el primero donde cabe». */
  agenda: DayAgenda
}

/**
 * La duración con la que se colocaría un ítem: la suya, o la de por defecto.
 * `0` y los negativos cuentan como «sin duración» (mismo criterio que
 * `vida-build-day.utils.ts`).
 */
function placementMinutes(item: VidaSuggestion['item']): number {
  const own = item.durationMinutes
  return own === null || own === undefined || own <= 0 ? DEFAULT_BLOCK_MINUTES : own
}

/** Mañana de verdad, la del reloj: «Mañana» no se mueve con el día que se mira. */
function tomorrowOf(today: string): string {
  const local = parseYmdToLocalDate(today)
  local.setDate(local.getDate() + 1)
  return formatDateToYmd(local)
}

/**
 * El lateral de escritorio: «Tu plantilla de \<día\>», marcando lo que ya está
 * en el plan (criterio 48, su primera mitad).
 *
 * Marcado **contra el plan del día**, por `activityId`, nunca contra
 * `takenToday`: aquél es el «ya lo tomé hoy» de F1, sale de otra tabla y en un
 * día futuro es siempre `false`.
 *
 * En la tajada 2 no lleva botón de «ponerla en el primer hueco donde cabe»
 * —eso es una mutación, tajada 3—. La tajada 5 le añade **«Mañana»**.
 *
 * **La página decide cuándo montarlo.** En un día pasado no se pinta: desde
 * que lleva «Armar mañana desde la plantilla» dejó de ser solo lectura, y un
 * día pasado no se toca (criterio 38).
 */
export function VidaTemplateAside({
  dayLabel,
  suggestions,
  planItems,
  date,
  agenda,
}: VidaTemplateAsideProps) {
  const plannedActivityIds = new Set(planItems.map((item) => item.activityId))
  const items = suggestions.filter((suggestion) => suggestion.item.isActive !== false)
  const addMutation = useAddDayPlanItemMutation()

  return (
    <aside className={styles.root} aria-label={`Tu plantilla de ${dayLabel}`}>
      <h2 className={styles.heading}>Tu plantilla de {dayLabel}</h2>
      <p className={styles.subtitle}>Lo que sueles hacer; marcado, lo que ya está en el plan.</p>

      {items.length === 0 ? (
        <p className={styles.empty}>
          Todavía no tienes nada en tu plantilla para los {pluralDayLabel(dayLabel)}.{' '}
          <Button variant="ghost" size="sm" to={vidaPaths.actividades}>
            Ver tus actividades
          </Button>
        </p>
      ) : (
        <ul className={styles.list}>
          {items.map(({ item }) => {
            const category = item.activity?.category ?? null
            const colorStyle = category?.color
              ? ({ '--vida-category-color': category.color } as CSSProperties)
              : undefined
            const schedule = [
              item.startTime ? formatTimeForDisplay(item.startTime) : 'sin hora',
              item.durationMinutes !== null ? formatDurationMinutes(item.durationMinutes) : null,
            ]
              .filter(Boolean)
              .join(' · ')
            return (
              <li key={item.id} className={styles.item} style={colorStyle}>
                <span className={styles.capsule} aria-hidden>
                  <AppIcon name={category?.icon ?? UNCATEGORIZED_GROUP_ICON} size="xs" decorative />
                </span>
                <span className={styles.body}>
                  <span className={styles.name}>{item.activity?.title ?? 'Actividad'}</span>
                  <span className={styles.meta}>{schedule}</span>
                </span>
                {plannedActivityIds.has(item.activityId) ? (
                  <span className={styles.badge}>en el plan</span>
                ) : (
                  <PlaceInFirstGapButton
                    item={item}
                    date={date}
                    agenda={agenda}
                    isPlacing={addMutation.isPending}
                    onPlace={(input) => addMutation.mutate(input)}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}

      <VidaTomorrowBlock viewedDate={date} />
    </aside>
  )
}

/**
 * **«Ponerla en el primer hueco donde cabe»** (criterio 48, su primera mitad).
 *
 * El hueco se busca en el día **ya repartido** (`buildDayAgenda`), saltando lo
 * que ya pasó: el mismo reparto que pinta la agenda, así que lo que el botón
 * promete es exactamente lo que se ve. La duración es la del ítem de plantilla
 * y, si no la tiene, `DEFAULT_BLOCK_MINUTES` — nunca se coloca sin decir cuánto.
 *
 * Es otra superficie y otro comportamiento que el toque en una ficha de un hueco
 * (criterio 23): aquélla coloca al principio de **ese** hueco; ésta busca el
 * **primero del día** donde la cosa entra.
 *
 * Si no cabe en ninguno, el botón queda **apagado con su motivo** en vez de
 * desaparecer: que algo no quepa hoy es información, no un error.
 */
function PlaceInFirstGapButton({
  item,
  date,
  agenda,
  isPlacing,
  onPlace,
}: {
  item: VidaSuggestion['item']
  date: string
  agenda: DayAgenda
  isPlacing: boolean
  onPlace: (input: {
    date: string
    activityId: string
    startTime: string
    endTime: string
  }) => void
}) {
  const minutes = placementMinutes(item)
  const gap = findFirstFittingGap(agenda.gaps, minutes)
  const title = item.activity?.title ?? 'Actividad'

  if (!gap) {
    return (
      <span className={styles.noRoom}>
        <button
          type="button"
          className={styles.place}
          disabled
          aria-label={`${title} no cabe hoy en ningún rato libre de ${formatDurationFromMinutes(minutes)}`}
        >
          Ponerla
        </button>
        <span className={styles.noRoomNote}>
          No queda un rato de {formatDurationFromMinutes(minutes)} en este día.
        </span>
      </span>
    )
  }

  const startTime = minutesToTime(gap.startMinutes)
  return (
    <button
      type="button"
      className={styles.place}
      disabled={isPlacing}
      // El nombre dice **qué hueco**: es otra superficie que la ficha dentro de
      // un hueco (criterio 23), que se llama «Poner X a las HH:MM». Si se
      // llamaran igual, ni un lector de pantalla ni un test podrían
      // distinguirlas.
      aria-label={`Poner ${title} en el primer hueco donde cabe: a las ${formatTimeForDisplay(startTime)}, ${formatDurationFromMinutes(minutes)}`}
      onClick={() =>
        onPlace({
          date,
          activityId: item.activityId,
          ...toDayPlanTimes(startTime, minutes),
        })
      }
    >
      Ponerla {formatTimeForDisplay(startTime)}
    </button>
  )
}

/**
 * «Mañana, \<día\>» con **«Armar mañana desde la plantilla»** (criterio 48,
 * su segunda mitad, y D8).
 *
 * Es el gesto de la noche: el criterio de fase pide que dejar mañana armado se
 * haga en **menos de un minuto**, y desde aquí son dos toques sin cambiar de
 * pantalla. Si mañana ya tiene plan no se ofrece armarlo —`Set` reemplaza el
 * día entero y borraría lo que hubiera—: se ofrece **verlo**.
 *
 * Va aparte del lateral para que sus tres consultas no se disparen cuando el
 * lateral no se pinta, y **ninguna es nueva**: el plan de mañana es
 * `vidaKeys.dayPlan.byDate` (la misma que su agenda y la que su punto en la
 * tira), la plantilla es `vidaKeys.items.list` y el horario, los ajustes.
 */
function VidaTomorrowBlock({ viewedDate }: { viewedDate: string }) {
  const today = getCurrentLocalDate()
  const tomorrow = tomorrowOf(today)
  const dayHours = useVidaDayHours()
  const planQuery = useActivityDayPlanQuery(tomorrow)
  const itemsQuery = useVidaItemsQuery()
  const { build, isPending, lastBuild } = useBuildDayFromTemplate()

  // El último domingo de la ventana de D5 no tiene «mañana» al que ir: en vez
  // de un botón muerto, el bloque no está (criterio 35). Y **estando ya en
  // mañana** tampoco se pinta: decir «Mañana, lunes 21» dentro del lunes 21 se
  // lee mal, y la pantalla entera ya es ese día.
  if (!isInPlanningWindow(tomorrow, today) || viewedDate === tomorrow) return null

  const label = VIDA_DAY_LABELS[getVidaDayOfWeek(tomorrow)]
  const planItems = planQuery.data ?? []
  const template = templateItemsForDate(itemsQuery.data ?? [], tomorrow)
  const hasPlan = planItems.length > 0
  const notes = lastBuild?.date === tomorrow ? describeBuildDay(lastBuild.summary) : null

  return (
    <section className={styles.tomorrow} aria-label={`Mañana, ${label}`}>
      <h3 className={styles.tomorrowHeading}>
        Mañana, {label} {parseYmdToLocalDate(tomorrow).getDate()}
      </h3>

      {planQuery.isPending ? (
        <p className={styles.tomorrowNote}>Mirando cómo viene mañana…</p>
      ) : hasPlan ? (
        <>
          <p className={styles.tomorrowNote}>
            Ya está planeado: {planItems.length} {planItems.length === 1 ? 'bloque' : 'bloques'}.
          </p>
          <Button variant="secondary" size="sm" to={vidaPaths.hoyForDate(tomorrow)}>
            Ver mañana
          </Button>
        </>
      ) : template.length === 0 ? (
        <p className={styles.tomorrowNote}>Mañana tu plantilla no trae nada que armar.</p>
      ) : (
        <>
          <p className={styles.tomorrowNote}>
            Tu plantilla trae {template.length} {template.length === 1 ? 'cosa' : 'cosas'} los{' '}
            {pluralDayLabel(label)}.
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={isPending || dayHours.isPending}
            onClick={() =>
              build({
                date: tomorrow,
                templateItems: template,
                dayStart: dayHours.startTime,
                dayEnd: dayHours.endTime,
              })
            }
          >
            {isPending ? 'Armando…' : 'Armar mañana desde la plantilla'}
          </Button>
        </>
      )}

      {/* Lo que hubo que ajustar, dicho aquí mismo: nada se pierde en silencio
          (criterios 43 y 44). */}
      {notes ? (
        <p className={styles.tomorrowNote}>
          {[notes.headline, notes.moved, notes.defaultDuration, notes.dropped]
            .filter(Boolean)
            .join(' ')}
          {notes.withoutTime ? (
            <>
              {' '}
              {notes.withoutTime}{' '}
              <Button variant="ghost" size="sm" to={vidaPaths.actividades}>
                Ver tus actividades
              </Button>
            </>
          ) : null}
        </p>
      ) : null}
    </section>
  )
}
