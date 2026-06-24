import { useNavigate } from 'react-router'
import { AppIcon } from '@/shared/ui/AppIcon'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import { activitiesPaths } from '@/features/activities/routes/activities-paths'
import styles from './QuickActions.module.scss'

const ACTIONS = [
  {
    id: 'start-activity',
    label: 'Iniciar actividad',
    icon: 'play',
    path: activitiesPaths.tracking,
    accent: 'var(--color-primary)',
  },
  {
    id: 'new-task',
    label: 'Nueva tarea',
    icon: 'plus',
    path: '/app/todos',
    accent: '#7c3aed',
  },
  {
    id: 'habits',
    label: 'Mis hábitos',
    icon: 'check',
    path: habitsPaths.myDay,
    accent: '#16a34a',
  },
  {
    id: 'routine',
    label: 'Rutina',
    icon: 'calendar-week',
    path: '/app/weekly-routine',
    accent: '#ea580c',
  },
] as const

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <div className={styles.row}>
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          className={styles.action}
          style={{ '--action-accent': action.accent } as React.CSSProperties}
          onClick={() => navigate(action.path)}
        >
          <span className={styles.iconWrap}>
            <AppIcon name={action.icon} size="sm" decorative />
          </span>
          <span className={styles.label}>{action.label}</span>
        </button>
      ))}
    </div>
  )
}
