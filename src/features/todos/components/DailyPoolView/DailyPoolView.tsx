import { useState } from 'react'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Spinner } from '@/shared/ui/Spinner'
import { PriorityBadge } from '@/features/todos/components/PriorityBadge/PriorityBadge'
import {
  useCreateTodoMutation,
  useTodoDailyTemplatesByDayQuery,
} from '@/features/todos/hooks/useTodos'
import type { TodoDailyTemplate } from '@/features/todos/types/todo.types'
import styles from './DailyPoolView.module.scss'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

type ItemProps = {
  template: TodoDailyTemplate
  folderName?: string
}

function DailyPoolItem({ template, folderName }: ItemProps) {
  const [justAdded, setJustAdded] = useState(false)
  const createTodo = useCreateTodoMutation()

  const handleAdd = () => {
    createTodo.mutate(
      {
        title: template.title,
        description: template.description ?? undefined,
        priority: template.priority,
        folderId: template.folderId ?? undefined,
        selectedToday: true,
      },
      {
        onSuccess: () => {
          setJustAdded(true)
          setTimeout(() => setJustAdded(false), 1500)
        },
      },
    )
  }

  return (
    <li className={styles.item}>
      <div className={styles.itemMain}>
        <span className={styles.itemTitle}>{template.title}</span>
        {folderName ? <span className={styles.folderChip}>{folderName}</span> : null}
      </div>
      <div className={styles.itemActions}>
        <PriorityBadge priority={template.priority} iconOnly />
        <button
          type="button"
          className={[styles.addBtn, justAdded ? styles.addBtnDone : ''].join(' ')}
          onClick={handleAdd}
          disabled={createTodo.isPending}
          aria-label={`Añadir "${template.title}" a Hoy`}
        >
          {justAdded ? '✓' : '+ Añadir'}
        </button>
      </div>
    </li>
  )
}

type Props = {
  folderMap?: Record<string, string>
}

export function DailyPoolView({ folderMap = {} }: Props) {
  const today = new Date().getDay()
  const { data: templates = [], isLoading } = useTodoDailyTemplatesByDayQuery(today)

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner />
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <EmptyState
        title="Sin actividades para hoy"
        description={`No tienes actividades configuradas para el ${DAY_NAMES[today]}. Configúralas en Ajustes.`}
      />
    )
  }

  return (
    <ul className={styles.list} role="list">
      {templates.map((t) => (
        <DailyPoolItem
          key={t.id}
          template={t}
          folderName={t.folderId ? folderMap[t.folderId] : undefined}
        />
      ))}
    </ul>
  )
}
