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
}

/**
 * Los dos atajos de un día que **sí** se puede planear: copiar del mismo día de
 * la semana pasada y vaciarlo para rehacerlo.
 *
 * Quien lo monta ya decidió que el día es editable (hoy o futuro, dentro de la
 * ventana): en un día pasado esta fila **no se pinta**, que es lo que pide D3.
 *
 * Las dos escriben con `activityDayPlanSet`, que **reemplaza el día entero**:
 * copiar no mezcla con lo que hubiera —por eso solo aparece en días sin plan
 * (D7)— y vaciar es esa misma mutación con la lista vacía. Ninguna mutación
 * nueva, ninguna clave nueva: `invalidateDayPlanQueries(date)` refresca la
 * agenda, el presupuesto y el punto de la tira, que comparten clave.
 *
 * El vocabulario: **«Vaciar y rehacer»**, nunca «eliminar»; la salida del
 * diálogo es **«Volver»**, nunca «Cancelar» (criterios 30 y 56).
 */
export function VidaDayActions({ date, planItems }: VidaDayActionsProps) {
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
    <div className={styles.root}>
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
    </div>
  )
}
