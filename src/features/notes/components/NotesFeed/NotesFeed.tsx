import { useMemo } from 'react'
import { NoteCard } from '@/features/notes/components/NoteCard/NoteCard'
import type { Note, TodoTag } from '@/features/notes/types/note.types'
import styles from './NotesFeed.module.scss'

type Props = {
  notes: Note[]
  availableTags: TodoTag[]
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const noteDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((today.getTime() - noteDay.getTime()) / 86400000)

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
}

function groupByDay(notes: Note[]): { label: string; key: string; notes: Note[] }[] {
  const map = new Map<string, Note[]>()
  for (const note of notes) {
    const d = new Date(note.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const list = map.get(key) ?? []
    list.push(note)
    map.set(key, list)
  }
  return Array.from(map.entries()).map(([key, dayNotes]) => ({
    key,
    label: formatDayLabel(dayNotes[0].createdAt),
    notes: dayNotes,
  }))
}

export function NotesFeed({ notes, availableTags }: Props) {
  const groups = useMemo(() => groupByDay(notes), [notes])

  if (notes.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No hay notas todavía.</p>
        <p>Presiona <kbd>⌘ Shift N</kbd> para capturar una rápidamente.</p>
      </div>
    )
  }

  return (
    <div className={styles.feed}>
      {groups.map((group) => (
        <section key={group.key} className={styles.group}>
          <h2 className={styles.dayLabel}>{group.label}</h2>
          <div className={styles.cards}>
            {group.notes.map((note) => (
              <NoteCard key={note.id} note={note} availableTags={availableTags} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
