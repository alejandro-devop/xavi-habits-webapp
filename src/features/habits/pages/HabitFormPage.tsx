import { useNavigate, useParams } from 'react-router'
import { useHabitQuery } from '@/features/habits/hooks/useHabits'
import { HabitFormModal } from '@/features/habits/components/HabitFormModal'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import { Spinner } from '@/shared/ui/Spinner'
import styles from './HabitFormPage.module.scss'

export function HabitFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: habit, isLoading } = useHabitQuery(id)

  function handleClose() {
    navigate(id ? habitsPaths.detail(id) : habitsPaths.list)
  }

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner />
      </div>
    )
  }

  if (!habit) {
    return null
  }

  return (
    <HabitFormModal mode="edit" habit={habit} open={true} onClose={handleClose} />
  )
}
