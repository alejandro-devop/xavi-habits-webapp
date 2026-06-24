import { useNavigate } from 'react-router'
import type { Habit } from '@/features/habits/types/habit.types'
import {
  useDeleteHabitMutation,
  useUpdateHabitMutation,
} from '@/features/habits/hooks/useHabits'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import { HabitStreakBadge } from '@/features/habits/components/HabitStreakBadge'
import { HabitStatusBadge } from '@/features/habits/components/HabitStatusBadge'
import { HabitTypeBadge } from '@/features/habits/components/HabitTypeBadge'
import { useConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { Popover } from '@/shared/ui/Popover'
import { AppIcon } from '@/shared/ui/AppIcon'
import styles from './ArchivedHabitCard.module.scss'

type Props = {
  habit: Habit
}

export function ArchivedHabitCard({ habit }: Props) {
  const navigate = useNavigate()
  const { confirm } = useConfirmDialog()
  const restoreMutation = useUpdateHabitMutation()
  const deleteMutation = useDeleteHabitMutation()

  const accentStyle = habit.color ? { borderLeftColor: habit.color } : undefined

  async function handleRestore() {
    const ok = await confirm({
      title: '¿Restaurar este hábito?',
      description: 'Volverá a aparecer en Mis Día y en la lista de hábitos activos.',
      confirmLabel: 'Restaurar',
      cancelLabel: 'Cancelar',
    })
    if (!ok) return
    restoreMutation.mutate({ id: habit.id, status: 'active' })
  }

  async function handleDelete() {
    const ok = await confirm({
      title: '¿Eliminar permanentemente?',
      description:
        'Se borrarán el hábito y todo su historial. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      variant: 'danger',
    })
    if (!ok) return
    deleteMutation.mutate(habit.id)
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
        <button
          type="button"
          className={styles.menuItem}
          onClick={handleRestore}
          disabled={restoreMutation.isPending}
        >
          Restaurar
        </button>
      </li>
      <li>
        <button
          type="button"
          className={[styles.menuItem, styles.menuItemDanger].join(' ')}
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          Eliminar permanentemente
        </button>
      </li>
    </ul>
  )

  return (
    <article className={styles.card} style={accentStyle}>
      <div className={styles.body}>
        <div className={styles.main}>
          <div className={styles.identity}>
            {habit.icon && <AppIcon name={habit.icon} size="sm" className={styles.icon} />}
            <span className={styles.name}>{habit.name}</span>
          </div>
          <div className={styles.badges}>
            <HabitTypeBadge habitType={habit.habitType} />
            <HabitStatusBadge status={habit.status} />
            <HabitStreakBadge streak={habit.streak} />
          </div>
        </div>
        <Popover trigger={kebabTrigger} content={kebabMenu} placement="bottom-end" />
      </div>
    </article>
  )
}
