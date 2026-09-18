import { useAddHabitFollowUpMutation } from '@/features/habits/hooks/useHabitFollowUps'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'

type SpendLifelineArgs = {
  habitId: string
  date: string
  lifelinesRemaining: number
}

/**
 * Gastar un salvavidas: confirmación + el mismo `addHabitFollowUp` de siempre.
 * Vive en un hook porque lo disparan dos sitios —el menú `⋯` de la fila y el
 * panel de registro— y la confirmación no debe divergir entre ellos.
 */
export function useHabitLifelineAction() {
  const { confirm } = useConfirmDialog()
  const mutation = useAddHabitFollowUpMutation()

  async function spendLifeline({ habitId, date, lifelinesRemaining }: SpendLifelineArgs) {
    if (lifelinesRemaining <= 0) return false

    const ok = await confirm({
      title: '¿Usar un salvavidas?',
      description: `Te quedan ${lifelinesRemaining} salvavidas esta semana. El día quedará cubierto y la racha no se romperá.`,
      confirmLabel: 'Usar salvavidas',
      cancelLabel: 'Cancelar',
    })
    if (!ok) return false

    mutation.mutate({ habitId, date, isLifeline: true })
    return true
  }

  return { spendLifeline, isPending: mutation.isPending }
}
