import { HabitFollowUpForm } from '@/features/habits/components/HabitFollowUpForm'
import { useHabitLifelineAction } from '@/features/habits/hooks/useHabitLifelineAction'
import type { Habit, HabitFollowUp } from '@/features/habits/types/habit.types'
import { formatLongDate } from '@/features/habits/utils/habit-date-format.utils'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Button } from '@/shared/ui/Button'
import { Drawer } from '@/shared/ui/Drawer'
import styles from './HabitFollowUpDrawer.module.scss'

type HabitFollowUpDrawerProps = {
  open: boolean
  onClose: () => void
  /** `null` mientras no hay hábito en foco (el panel no se monta). */
  habit: Habit | null
  date: string
  followUp?: HabitFollowUp | null
  lifelinesRemaining: number
}

/**
 * Panel de registro detallado. Es el `HabitFollowUpForm` de siempre —con sus
 * mutaciones intactas— en un `Drawer` lateral en lugar de un modal centrado,
 * para poder seguir viendo la lista mientras se registra. En móvil baja a
 * hoja inferior.
 */
export function HabitFollowUpDrawer({
  open,
  onClose,
  habit,
  date,
  followUp,
  lifelinesRemaining,
}: HabitFollowUpDrawerProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { spendLifeline, isPending: isSpendingLifeline } = useHabitLifelineAction()

  if (!habit) return null

  const canSpendLifeline =
    habit.weeklyLifelines > 0 && lifelinesRemaining > 0 && followUp?.isLifeline !== true

  async function handleLifeline() {
    if (!habit) return
    const spent = await spendLifeline({ habitId: habit.id, date, lifelinesRemaining })
    if (spent) onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side={isMobile ? 'bottom' : 'right'}
      size="sm"
      ds="aura"
      title={habit.name}
      description={formatLongDate(date)}
      footer={
        <div className={styles.footer}>
          {canSpendLifeline ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLifeline}
              isLoading={isSpendingLifeline}
              disabled={isSpendingLifeline}
            >
              Usar salvavidas ({lifelinesRemaining})
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      }
    >
      <HabitFollowUpForm
        habit={habit}
        date={date}
        existingFollowUp={followUp ?? undefined}
        onSuccess={onClose}
      />
    </Drawer>
  )
}
