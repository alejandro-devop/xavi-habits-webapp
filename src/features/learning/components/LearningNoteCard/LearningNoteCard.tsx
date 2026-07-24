import { Link } from 'react-router'
import { LearningTagChip } from '@/features/learning/components/LearningTagChip'
import { learningPaths } from '@/features/learning/routes/learning-paths'
import type { LearningNote } from '@/features/learning/types/learning-note.types'
import styles from './LearningNoteCard.module.scss'

function toSnippet(markdown: string, max = 160): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/[#>*_\-[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= max) return plain
  return `${plain.slice(0, max).trim()}…`
}

type Props = {
  note: LearningNote
}

export function LearningNoteCard({ note }: Props) {
  const updated = new Date(note.updatedAt).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  const snippet = toSnippet(note.contentMarkdown)

  return (
    <Link to={learningPaths.note(note.id)} className={styles.card}>
      <h3 className={styles.title}>{note.title || 'Sin título'}</h3>
      <div className={styles.meta}>
        <div className={styles.tags}>
          {note.tags.map((tag) => (
            <LearningTagChip key={tag.id} tag={tag} />
          ))}
        </div>
        <time className={styles.date} dateTime={note.updatedAt}>
          {updated}
        </time>
      </div>
      {snippet ? <p className={styles.snippet}>{snippet}</p> : null}
    </Link>
  )
}
