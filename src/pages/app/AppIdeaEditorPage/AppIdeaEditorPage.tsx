import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { AppIdeaEditor } from '@/features/app-ideas/components/AppIdeaEditor'
import { useAppIdea } from '@/features/app-ideas/hooks/useAppIdeas'
import type { AppIdea } from '@/features/app-ideas/types/app-idea.types'
import { appIdeaKeys } from '@/shared/api/query-keys'
import { EmptyState, Spinner } from '@/shared/ui'
import styles from './AppIdeaEditorPage.module.scss'

export function AppIdeaEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const { ideaId } = useParams()
  const qc = useQueryClient()

  const cachedTemp =
    ideaId?.startsWith('temp-')
      ? qc.getQueryData<AppIdea>(appIdeaKeys.detail(ideaId))
      : undefined

  const { data: idea, isLoading, isError } = useAppIdea(
    mode === 'edit' && ideaId && !ideaId.startsWith('temp-') ? ideaId : undefined,
  )

  if (mode === 'create') {
    return <AppIdeaEditor mode="create" />
  }

  if (ideaId?.startsWith('temp-')) {
    if (!cachedTemp) {
      return (
        <div className={styles.center}>
          <EmptyState
            title="Idea temporal no encontrada"
            description="Vuelve al listado e inténtalo de nuevo."
          />
        </div>
      )
    }
    return <AppIdeaEditor key={cachedTemp.id} mode="edit" idea={cachedTemp} />
  }

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner />
      </div>
    )
  }

  if (isError || !idea) {
    return (
      <div className={styles.center}>
        <EmptyState
          title="Idea no encontrada"
          description="Puede que se haya eliminado o no tengas acceso."
        />
      </div>
    )
  }

  return <AppIdeaEditor key={idea.id} mode="edit" idea={idea} />
}
