import type { Habit } from '@/features/habits/types/habit.types'
import { HabitCreateWizard } from './HabitCreateWizard'
import { HabitEditForm } from './HabitEditForm'

export type HabitFormModalProps =
  | { mode: 'create'; habit?: undefined; open: boolean; onClose: () => void }
  | { mode: 'edit'; habit: Habit; open: boolean; onClose: () => void }

/**
 * Dos caminos distintos a propósito: crear es una conversación de tres pasos
 * para quien no sabe nada de la app; editar es el formulario plano de siempre,
 * para quien ya sabe qué quiere cambiar.
 */
export function HabitFormModal(props: HabitFormModalProps) {
  if (props.mode === 'edit') {
    return <HabitEditForm habit={props.habit} open={props.open} onClose={props.onClose} />
  }
  return <HabitCreateWizard open={props.open} onClose={props.onClose} />
}
