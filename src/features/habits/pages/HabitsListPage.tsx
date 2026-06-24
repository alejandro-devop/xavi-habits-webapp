import { useMemo, useState } from 'react'
import type { Habit } from '@/features/habits/types/habit.types'
import { useHabitCategoriesQuery, useHabitsQuery } from '@/features/habits/hooks/useHabits'
import { HabitCard } from '@/features/habits/components/HabitCard'
import { HabitFormModal } from '@/features/habits/components/HabitFormModal'
import { habitsPaths } from '@/features/habits/routes/habits-paths'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import styles from './HabitsListPage.module.scss'

export function HabitsListPage() {
  const { data, isLoading } = useHabitsQuery({ status: 'active' })
  const { data: categories = [] } = useHabitCategoriesQuery()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

  const habits = data?.habits ?? []

  const grouped = useMemo(() => {
    const categoryMap = new Map<string | null, Habit[]>()
    categoryMap.set(null, [])

    for (const cat of categories) {
      categoryMap.set(cat.id, [])
    }

    for (const habit of habits) {
      const key = habit.categoryId ?? null
      if (!categoryMap.has(key)) {
        categoryMap.set(key, [])
      }
      categoryMap.get(key)!.push(habit)
    }

    return Array.from(categoryMap.entries()).filter(([, list]) => list.length > 0)
  }, [habits, categories])

  function getCategoryName(id: string | null): string {
    if (!id) return 'Sin categoría'
    return categories.find((c) => c.id === id)?.name ?? 'Sin categoría'
  }

  function handleEdit(habit: Habit) {
    setEditingHabit(habit)
    setModalOpen(true)
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditingHabit(null)
  }

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Hábitos activos</h1>
        <div className={styles.headerActions}>
          <Button variant="ghost" to={habitsPaths.archived}>
            Ver archivados
          </Button>
          <Button onClick={() => { setEditingHabit(null); setModalOpen(true) }}>
            + Nuevo hábito
          </Button>
        </div>
      </header>

      {habits.length === 0 ? (
        <EmptyState
          title="Sin hábitos activos"
          description="Crea tu primer hábito para empezar a construir rutinas."
        />
      ) : (
        <div className={styles.groups}>
          {grouped.map(([categoryId, list]) => (
            <section key={categoryId ?? '_none'} className={styles.group}>
              <h2 className={styles.groupTitle}>{getCategoryName(categoryId)}</h2>
              <ul className={styles.list}>
                {list.map((habit) => (
                  <li key={habit.id}>
                    <HabitCard habit={habit} onEdit={handleEdit} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {editingHabit ? (
        <HabitFormModal
          mode="edit"
          habit={editingHabit}
          open={modalOpen}
          onClose={handleCloseModal}
        />
      ) : (
        <HabitFormModal mode="create" open={modalOpen} onClose={handleCloseModal} />
      )}
    </div>
  )
}
