import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import { authPaths } from '@/features/auth/router/auth-paths'
import { useActivitiesQuery } from '@/features/vida/hooks/useActivities'
import { useActivityCategoriesQuery } from '@/features/vida/hooks/useActivityCategories'
import { useArchiveActivity } from '@/features/vida/hooks/useArchiveActivity'
import { useVidaItemsQuery } from '@/features/vida/hooks/useVidaItems'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import {
  CATALOG_LIMIT,
  findVidaItemForActivity,
  UNCATEGORIZED_GROUP_ICON,
} from '@/features/vida/utils/vida-catalog.utils'
import { compareVidaNames } from '@/features/vida/utils/vida-text.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './VidaArchivadasPage.module.scss'

/**
 * Lo que archivaste. Es el **mismo listado** del catálogo con el otro filtro
 * —`status: 'cancelled'`, la única consulta directa que permite el enum único
 * de `ActivityFilters`—, sin agrupar: aquí no se planea nada, solo se recupera.
 *
 * La palabra `cancelled` no asoma a la pantalla en ningún sitio (criterio 25):
 * lo que se lee es «archivadas» y «Restaurar».
 */
export function VidaArchivadasPage() {
  const { data, isPending, fetchStatus, isError, refetch } = useActivitiesQuery({
    status: 'cancelled',
    page: 1,
    limit: CATALOG_LIMIT,
  })
  const { data: categories = [] } = useActivityCategoriesQuery()
  // Con los desactivados: el `VidaItem` que se apagó al archivar es justo el que
  // hay que volver a encender, y por definición está inactivo (criterio 24).
  const { data: vidaItems = [] } = useVidaItemsQuery(true)
  const { restore, isPending: isRestoring } = useArchiveActivity()

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )

  const activities = useMemo(
    () => [...(data?.activities ?? [])].sort((a, b) => compareVidaNames(a.title, b.title)),
    [data],
  )

  const subtitle = 'Siguen aquí enteras. Restaura cualquiera cuando vuelva a tocar.'

  function shell(children: React.ReactNode) {
    return (
      <div className={styles.root}>
        <PageHeader
          title="Archivadas"
          subtitle={subtitle}
          actions={
            <Button variant="ghost" size="sm" to={vidaPaths.actividades}>
              ← Al catálogo
            </Button>
          }
        />
        {children}
      </div>
    )
  }

  // Sin sesión la consulta queda deshabilitada (`isPending` + `fetchStatus:
  // 'idle'`): sin esta rama el esqueleto giraría para siempre.
  if (isPending && fetchStatus === 'idle') {
    return shell(
      <Card className={styles.panel} padding="lg">
        <EmptyState
          title="Entra para ver lo que archivaste"
          description="Tu catálogo viaja con tu cuenta. Inicia sesión y aparece."
          action={
            <Button to={authPaths.login} variant="secondary">
              Iniciar sesión
            </Button>
          }
        />
      </Card>,
    )
  }

  if (isPending) {
    return shell(
      <ul className={styles.list} aria-busy="true" aria-live="polite">
        {[0, 1, 2].map((row) => (
          <li key={row} className={styles.skeletonRow}>
            <Skeleton width={36} height={36} radius="0.75rem" />
            <Skeleton width="45%" height={14} />
          </li>
        ))}
      </ul>,
    )
  }

  if (isError) {
    return shell(
      <Alert variant="danger" title="No pudimos cargar lo que archivaste">
        <p className={styles.errorText}>
          Revisa tu conexión e inténtalo otra vez; lo que tienes guardado sigue ahí.
        </p>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          Reintentar
        </Button>
      </Alert>,
    )
  }

  if (activities.length === 0) {
    return shell(
      <Card className={styles.panel} padding="lg">
        <EmptyState
          title="No has archivado nada"
          description="Cuando algo deje de formar parte de tus días, archívalo desde su «···» y lo encontrarás aquí."
          action={
            <Button variant="secondary" to={vidaPaths.actividades}>
              Volver al catálogo
            </Button>
          }
        />
      </Card>,
    )
  }

  return shell(
    <ul className={styles.list}>
      {activities.map((activity) => {
        const category = activity.categoryId
          ? (categoriesById.get(activity.categoryId) ?? activity.category ?? null)
          : null
        const color = category?.color ?? null
        const colorStyle = color
          ? ({ '--vida-category-color': color } as CSSProperties)
          : undefined

        return (
          <li key={activity.id} className={styles.row} style={colorStyle}>
            <span className={styles.capsule} aria-hidden>
              <AppIcon name={category?.icon ?? UNCATEGORIZED_GROUP_ICON} size="sm" decorative />
            </span>
            <div className={styles.body}>
              <p className={styles.name}>{activity.title}</p>
              <p className={styles.meta}>{category?.name ?? 'Sin categoría'}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={isRestoring}
              onClick={() => restore(activity, findVidaItemForActivity(vidaItems, activity.id))}
            >
              Restaurar
            </Button>
          </li>
        )
      })}
    </ul>,
  )
}
