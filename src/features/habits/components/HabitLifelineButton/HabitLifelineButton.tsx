import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useAddHabitFollowUpMutation } from '@/features/habits/hooks/useHabitFollowUps'
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
    <button
      type="button"
      className={styles.root}
      disabled={disabled || mutation.isPending}
      onClick={handleClick}
      title={disabled ? 'Sin salvavidas esta semana' : `Salvavidas (${lifelinesRemaining})`}
      aria-label={disabled ? 'Sin salvavidas esta semana' : `Usar salvavidas, quedan ${lifelinesRemaining}`}
    >
      <span className={styles.icon} aria-hidden>
        🛡
      </span>
      <span className={styles.count}>{lifelinesRemaining}</span>
    </button>
  )
}
