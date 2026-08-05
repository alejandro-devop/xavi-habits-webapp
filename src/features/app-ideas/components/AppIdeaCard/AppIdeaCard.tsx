import { Link } from 'react-router'
import { appIdeasPaths } from '@/features/app-ideas/routes/app-ideas-paths'
import {
  APP_IDEA_STATUS_LABELS,
  type AppIdea,
} from '@/features/app-ideas/types/app-idea.types'
import { Badge } from '@/shared/ui'
import styles from './AppIdeaCard.module.scss'

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

function statusBadgeVariant(status: AppIdea['status']) {
  switch (status) {
    case 'shipped':
      return 'success' as const
    case 'building':
      return 'primary' as const
    case 'exploring':
      return 'warning' as const
    case 'archived':
      return 'neutral' as const
    default:
      return 'neutral' as const
  }
}

type Props = {
  idea: AppIdea
}

export function AppIdeaCard({ idea }: Props) {
  const updated = new Date(idea.updatedAt).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  const snippet = toSnippet(idea.contentMarkdown)

  return (
    <Link to={appIdeasPaths.idea(idea.id)} className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{idea.title || 'Sin título'}</h3>
        <Badge variant={statusBadgeVariant(idea.status)}>
          {APP_IDEA_STATUS_LABELS[idea.status]}
        </Badge>
      </div>
      <div className={styles.meta}>
        <time className={styles.date} dateTime={idea.updatedAt}>
          {updated}
        </time>
      </div>
      {snippet ? <p className={styles.snippet}>{snippet}</p> : null}
    </Link>
  )
}
