import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useAddHabitFollowUpMutation } from '@/features/habits/hooks/useHabitFollowUps'
import { Button } from '@/shared/ui/Button'
import styles from './HabitLifelineButton.module.scss'

type Props = {
  habitId: string
  date: string
  lifelinesRemaining: number
}

export function HabitLifelineButton({ habitId, date, lifelinesRemaining }: Props) {
  const { confirm } = useConfirmDialog()
  const mutation = useAddHabitFollowUpMutation()
  const disabled = lifelinesRemaining === 0

  async function handleClick() {
    const ok = await confirm({
      title: '¿Usar un salvavidas?',
      description: `Te quedan ${lifelinesRemaining} salvavidas esta semana. Se registrará hoy como día cubierto por salvavidas.`,
      confirmLabel: 'Usar salvavidas',
      cancelLabel: 'Cancelar',
    })
    if (!ok) return
    mutation.mutate({ habitId, date, isLifeline: true })
  }

  return (
    <div className={styles.root}>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={handleClick}
        isLoading={mutation.isPending}
        title={disabled ? 'Sin salvavidas esta semana' : undefined}
      >
        🛡 Salvavidas ({lifelinesRemaining})
      </Button>
    </div>
  )
}
