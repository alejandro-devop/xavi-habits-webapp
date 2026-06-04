import { useNavigate } from 'react-router'
import type { Habit } from '@/features/habits/types/habit.types'
import { useCompleteHabitMutation, useUpdateHabitMutation } from '@/features/habits/hooks/useHabits'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import { HabitStreakBadge } from '@/features/habits/components/HabitStreakBadge'
import { HabitStatusBadge } from '@/features/habits/components/HabitStatusBadge'
import { HabitTypeBadge } from '@/features/habits/components/HabitTypeBadge'
import { HabitPeriodProgress } from '@/features/habits/components/HabitPeriodProgress'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Popover } from '@/shared/ui/Popover'
import styles from './HabitCard.module.scss'

type Props = {
  habit: Habit
  onEdit: (habit: Habit) => void
}

export function HabitCard({ habit, onEdit }: Props) {
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()
  const completeMutation = useCompleteHabitMutation()
  const updateMutation = useUpdateHabitMutation()

  const accentStyle = habit.color ? { borderLeftColor: habit.color } : undefined

  async function handleComplete() {
    const ok = await confirm({
      title: '¿Marcar hábito como completado?',
      description: 'El hábito pasará al estado completado y desaparecerá de Mi Día.',
      confirmLabel: 'Completar',
      cancelLabel: 'Cancelar',
    })
    if (!ok) return
    completeMutation.mutate(habit.id)
  }

  async function handleArchive() {
    const ok = await confirm({
      title: '¿Archivar este hábito?',
      description: 'El hábito se ocultará de las vistas activas.',
      confirmLabel: 'Archivar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!ok) return
    updateMutation.mutate({ id: habit.id, name: habit.name, habitType: habit.habitType, status: 'archived' })
  }

  const kebabTrigger = (
    <button type="button" className={styles.kebab} aria-label="Opciones">
      ···
    </button>
  )

  const kebabMenu = (
    <ul className={styles.menu}>
      <li>
        <button
          type="button"
          className={styles.menuItem}
          onClick={() => navigate(habitsPaths.detail(habit.id))}
        >
          Ver detalle
        </button>
      </li>
      <li>
        <button type="button" className={styles.menuItem} onClick={() => onEdit(habit)}>
          Editar
        </button>
      </li>
      <li>
        <button
          type="button"
          className={styles.menuItem}
          onClick={handleComplete}
          disabled={completeMutation.isPending}
        >
          Completar
        </button>
      </li>
      <li>
        <button
          type="button"
          className={[styles.menuItem, styles.menuItemDanger].join(' ')}
          onClick={handleArchive}
          disabled={updateMutation.isPending}
        >
          Archivar
        </button>
      </li>
    </ul>
  )

  return (
    <article className={styles.card} style={accentStyle}>
      <div className={styles.body}>
        <div className={styles.main}>
          <div className={styles.identity}>
            {habit.icon && <span className={styles.icon}>{habit.icon}</span>}
            <span className={styles.name}>{habit.name}</span>
          </div>
          <div className={styles.badges}>
            <HabitTypeBadge habitType={habit.habitType} />
            <HabitStatusBadge status={habit.status} />
            <HabitStreakBadge streak={habit.streak} />
          </div>
          {habit.periodDays > 0 && (
            <div className={styles.progress}>
              <HabitPeriodProgress streak={habit.streak} periodDays={habit.periodDays} />
            </div>
          )}
        </div>
        <Popover trigger={kebabTrigger} content={kebabMenu} placement="bottom-end" />
      </div>
    </article>
  )
}
