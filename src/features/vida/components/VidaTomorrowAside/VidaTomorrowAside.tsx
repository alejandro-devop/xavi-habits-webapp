import { useActivityDayPlanQuery } from '@/features/vida/hooks/useActivityDayPlan'
import { useBuildDayFromTemplate } from '@/features/vida/hooks/useBuildDayFromTemplate'
import { useVidaDayHours } from '@/features/vida/hooks/useVidaDayHours'
import { useVidaItemsQuery } from '@/features/vida/hooks/useVidaItems'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import {
  describeBuildDay,
  templateItemsForDate,
} from '@/features/vida/utils/vida-build-day.utils'
import {
  VIDA_DAY_LABELS,
  formatDateToYmd,
  getCurrentLocalDate,
  getVidaDayOfWeek,
  parseYmdToLocalDate,
  pluralDayLabel,
} from '@/features/vida/utils/vida-date.utils'
import { isInPlanningWindow } from '@/features/vida/utils/vida-window.utils'
import { Button } from '@/shared/ui/Button'
import styles from './VidaTomorrowAside.module.scss'

/** Mañana de verdad, la del reloj: «Mañana» no se mueve con el día que se mira. */
function tomorrowOf(today: string): string {
  const local = parseYmdToLocalDate(today)
  local.setDate(local.getDate() + 1)
  return formatDateToYmd(local)
}

/**
 * **El lateral de escritorio, desde FEAT-010 tajada 3: solo «Mañana».**
 *
 * «Mañana, \<día\>» con **«Armar mañana desde la plantilla»** (FEAT-003,
 * criterio 48, su segunda mitad, y D8). Es el gesto de la noche: el criterio de
 * fase pide que dejar mañana armado se haga en **menos de un minuto**, y desde
 * aquí son dos toques sin cambiar de pantalla. Si mañana ya tiene plan no se
 * ofrece armarlo —`Set` reemplaza el día entero y borraría lo que hubiera—: se
 * ofrece **verlo**.
 *
 * **La otra mitad del criterio 48 ya no existe.** Este componente sale de
 * `VidaTemplateAside`, que traía encima la lista «Tu plantilla de \<día\>» con
 * su botón «Ponerla»: **FEAT-010 criterio 383 la retira entera** —el usuario
 * dijo que no le resultaba útil y que no era intuitivo qué hacía— y con ella se
 * fue `findFirstFittingGap`. Lo que la lista servía sigue teniendo camino:
 * `/app/vida/plantilla` para verla, «+ otra cosa» para poner algo en un hueco y
 * la tarjeta de «Lo que viene» para lo que toca ahora (criterio 384).
 *
 * **Ninguna de sus tres consultas es nueva**: el plan de mañana es
 * `vidaKeys.dayPlan.byDate` (la misma que su agenda y la que su punto en la
 * tira), la plantilla es `vidaKeys.items.list` y el horario, los ajustes.
 *
 * **La página decide cuándo montarlo.** En un día pasado no se pinta: dejar
 * mañana armado no es lectura, y un día pasado se mira y no se toca (criterio
 * 38).
 */
export function VidaTomorrowAside({ viewedDate }: { viewedDate: string }) {
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
    <aside className={styles.root} aria-label={`Mañana, ${label}`}>
      <h2 className={styles.heading}>
        Mañana, {label} {parseYmdToLocalDate(tomorrow).getDate()}
      </h2>

      {planQuery.isPending ? (
        <p className={styles.note}>Mirando cómo viene mañana…</p>
      ) : hasPlan ? (
        <>
          <p className={styles.note}>
            Ya está planeado: {planItems.length} {planItems.length === 1 ? 'bloque' : 'bloques'}.
          </p>
          <Button variant="secondary" size="sm" to={vidaPaths.hoyForDate(tomorrow)}>
            Ver mañana
          </Button>
        </>
      ) : template.length === 0 ? (
        <p className={styles.note}>Mañana tu plantilla no trae nada que armar.</p>
      ) : (
        <>
          <p className={styles.note}>
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
        <p className={styles.note}>
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
    </aside>
  )
}
