import {
  useActivityDayPlanQuery,
  useSetActivityDayPlanMutation,
} from '@/features/vida/hooks/useActivityDayPlan'
import type { ActivityDayPlanItem } from '@/features/vida/types/activity-day-plan.types'
import { VIDA_DAY_LABELS, getVidaDayOfWeek } from '@/features/vida/utils/vida-date.utils'
import { planItemsToSetItems, sameWeekdayLastWeek } from '@/features/vida/utils/vida-window.utils'
import { Button } from '@/shared/ui/Button'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import styles from './VidaDayActions.module.scss'

type VidaDayActionsProps = {
  /** `YYYY-MM-DD` del día que se está mirando. */
  date: string
  /** Los bloques que ese día ya tiene. */
  planItems: ActivityDayPlanItem[]
  /** El plan de este día se puede tocar: hoy o futuro (FEAT-003, D3). */
  canPlan: boolean
  /** «Empezar algo»: **solo hoy** (criterio 32). */
  onStartSomething?: () => void
  /** «Registrar tiempo pasado»: hoy y días pasados, nunca en futuros (criterio 32). */
  onLogPast?: () => void
}

/**
 * La fila de acciones del día: **lo que se planea** y, desde FEAT-004,
 * **lo que se registra**.
 *
 * Son **dos grupos con dueños distintos**, y por eso la fila se pinta en días
 * donde antes no existía:
 *
 * - **Plan** (FEAT-003, D3): «Copiar del \<día\> pasado» y «Vaciar y rehacer»,
 *   solo donde el plan se puede tocar —hoy y futuros—. Las dos escriben con
 *   `activityDayPlanSet`, que **reemplaza el día entero**: copiar no mezcla con
 *   lo que hubiera (por eso solo en días sin plan) y vaciar es esa misma
 *   mutación con la lista vacía. Ninguna mutación ni clave nueva:
 *   `invalidateDayPlanQueries(date)` refresca la agenda, el presupuesto y el
 *   punto de la tira, que comparten clave.
 * - **Registro** (FEAT-004, tajada 3, criterio 32): **«Empezar algo»** solo en
 *   **hoy** —no se empieza lo que ya pasó ni lo que no ha llegado— y
 *   **«Registrar tiempo pasado»** en hoy y en los días **pasados**, aunque su
 *   plan siga sin poder editarse (D10). En un día **futuro**, ninguno de los
 *   dos. Quién puede qué lo decide la página: aquí solo se pinta lo que llega
 *   con su `onClick`.
 *
 * El vocabulario: **«Vaciar y rehacer»**, nunca «eliminar»; la salida del
 * diálogo es **«Volver»**, nunca «Cancelar» (criterios 30 y 56 de FEAT-003).
 */
export function VidaDayActions({
  date,
  planItems,
  canPlan,
  onStartSomething,
  onLogPast,
}: VidaDayActionsProps) {
  // Las dos filas son independientes: un día pasado **no** monta los atajos de
  // plan (y por eso tampoco pide el plan de la semana pasada), y un día futuro
  // no monta los de registro.
  if (!canPlan && !onStartSomething && !onLogPast) return null

  return (
    <div className={styles.root}>
      {canPlan ? <PlanShortcuts date={date} planItems={planItems} /> : null}

      {/* Registrar lo que se sale del plan (criterios 30, 31 y 32). Va aquí y
          no en la agenda porque no pertenece a ningún hueco: es del día. */}
      {onStartSomething ? (
        <span className={styles.action}>
          <Button variant="secondary" size="sm" onClick={onStartSomething}>
            Empezar algo
          </Button>
          <span className={styles.note}>
            Algo que no está en tu plan. Arranca ahora mismo.
          </span>
        </span>
      ) : null}

      {onLogPast ? (
        <span className={styles.action}>
          <Button variant="ghost" size="sm" onClick={onLogPast}>
            Registrar tiempo pasado
          </Button>
          <span className={styles.note}>
            Un rato que ya pasó: qué hiciste, a qué hora y cuánto duró.
          </span>
        </span>
      ) : null}
    </div>
  )
}

/**
 * Los dos atajos del **plan**. Salen a su propio componente para que un día
 * pasado —donde el plan no se toca— no monte su consulta de la semana pasada
 * solo para no pintar nada.
 */
function PlanShortcuts({ date, planItems }: { date: string; planItems: ActivityDayPlanItem[] }) {
  const { confirm } = useConfirmDialog()
  const setMutation = useSetActivityDayPlanMutation()

  const previousDate = sameWeekdayLastWeek(date)
  const dayLabel = VIDA_DAY_LABELS[getVidaDayOfWeek(date)]
  // Misma clave que la agenda de aquel día: si ya se miró, esto no pide nada.
  const previousQuery = useActivityDayPlanQuery(previousDate)
  const previousItems = previousQuery.data ?? []
  const previousCount = previousItems.length

  const hasPlan = planItems.length > 0
  const isBusy = setMutation.isPending

  function copyFromLastWeek() {
    if (previousCount === 0) return
    setMutation.mutate({ date, items: planItemsToSetItems(previousItems) })
  }

  async function emptyDay() {
    const ok = await confirm({
      title: `¿Vaciar el plan de este día?`,
      description: `Se van ${planItems.length} ${planItems.length === 1 ? 'bloque' : 'bloques'} y el día queda libre para rehacerlo. Tus actividades y tu plantilla siguen donde estaban.`,
      // La confirmación no repite el nombre del botón: dentro del diálogo lo
      // que se decide es este día, y así no hay dos controles con el mismo
      // nombre en la pantalla a la vez.
      confirmLabel: 'Vaciar el día',
      cancelLabel: 'Volver',
    })
    if (!ok) return
    setMutation.mutate({ date, items: [] })
  }

  return (
    <>
      {/* Copiar solo en un día **sin plan** (D7): `Set` reemplaza el día
          entero, así que ofrecerlo sobre un día ya armado sería borrar lo
          hecho sin decirlo. */}
      {!hasPlan ? (
        <span className={styles.action}>
          <Button
            variant="secondary"
            size="sm"
            onClick={copyFromLastWeek}
            disabled={isBusy || previousQuery.isPending || previousCount === 0}
          >
            Copiar del {dayLabel} pasado
          </Button>
          <span className={styles.note}>
            {previousQuery.isPending
              ? 'Mirando qué tenías ese día…'
              : previousCount > 0
                ? `Trae ${previousCount} ${previousCount === 1 ? 'bloque' : 'bloques'}, con sus horas.`
                : `Ese ${dayLabel} no tuviste plan, así que no hay nada que traer.`}
          </span>
        </span>
      ) : null}

      {hasPlan ? (
        <span className={styles.action}>
          <Button variant="ghost" size="sm" onClick={emptyDay} disabled={isBusy}>
            Vaciar y rehacer
          </Button>
          <span className={styles.note}>
            Deja el día libre para armarlo otra vez desde cero.
          </span>
        </span>
      ) : null}
    </>
  )
}
