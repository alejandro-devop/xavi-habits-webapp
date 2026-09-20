import { useMemo, useState } from 'react'
import { authPaths } from '@/features/auth/router/auth-paths'
import { VidaActivitySheet } from '@/features/vida/components/VidaActivitySheet'
import { VidaCatalogGroup } from '@/features/vida/components/VidaCatalogGroup'
import { VidaStartingPoints } from '@/features/vida/components/VidaStartingPoints'
import { useActivitiesQuery } from '@/features/vida/hooks/useActivities'
import { useActivityCategoriesQuery } from '@/features/vida/hooks/useActivityCategories'
import { useVidaItemsQuery } from '@/features/vida/hooks/useVidaItems'
import type { Activity } from '@/features/vida/types/activity.types'
import { filterActivitiesBySearch } from '@/features/vida/utils/activity-filters'
import {
  buildVidaItemsByActivity,
  countCatalogCategories,
  excludeArchivedActivities,
  groupActivitiesByCategory,
} from '@/features/vida/utils/vida-catalog.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './VidaActividadesPage.module.scss'

/**
 * El catálogo: las cosas que uno hace en un día, agrupadas por categoría.
 *
 * Se pide **sin filtro de estado** y las archivadas se recortan en cliente:
 * `ActivityFilters.status` es un enum único, así que pedir «todo menos
 * `cancelled`» costaría tres consultas. De ahí que el recuento salga del array
 * ya filtrado y nunca de `total`.
 */
const CATALOG_LIMIT = 200

export function VidaActividadesPage() {
  const [search, setSearch] = useState('')
  // La hoja: abierta sin actividad es «crear»; con actividad, «editar». Vive en
  // la página y no en la tarjeta para que sea la misma hoja en los dos caminos.
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  // Una `key` por apertura: la hoja se remonta y parte limpia sin que nadie
  // tenga que vaciarla a mano. Se queda montada al cerrar para que la
  // animación de salida se vea.
  const [sheetSession, setSheetSession] = useState(0)

  function openCreateSheet() {
    setEditing(null)
    setSheetSession((session) => session + 1)
    setSheetOpen(true)
  }

  function openEditSheet(activity: Activity) {
    setEditing(activity)
    setSheetSession((session) => session + 1)
    setSheetOpen(true)
  }

  const {
    data,
    isPending,
    fetchStatus,
    isError,
    refetch,
  } = useActivitiesQuery({ page: 1, limit: CATALOG_LIMIT })
  const { data: categories = [] } = useActivityCategoriesQuery()
  const { data: vidaItems = [], isPending: isVidaItemsPending } = useVidaItemsQuery()

  const activities = useMemo(() => excludeArchivedActivities(data?.activities ?? []), [data])
  const vidaItemsByActivity = useMemo(() => buildVidaItemsByActivity(vidaItems), [vidaItems])

  const allGroups = useMemo(
    () => groupActivitiesByCategory(activities, categories),
    [activities, categories],
  )
  const visibleGroups = useMemo(() => {
    if (!search.trim()) return allGroups
    return allGroups
      .map((group) => ({
        ...group,
        activities: filterActivitiesBySearch(group.activities, search),
      }))
      .filter((group) => group.activities.length > 0)
  }, [allGroups, search])

  const activityCount = activities.length
  const categoryCount = countCatalogCategories(allGroups)
  // El crudo, antes de recortar: es lo que dice si el lote no cabía entero.
  const hasMore = (data?.total ?? 0) > (data?.activities.length ?? 0)

  function header(subtitle: string) {
    return <PageHeader title="Actividades" subtitle={subtitle} />
  }

  const countLine = `${activityCount} ${activityCount === 1 ? 'actividad' : 'actividades'} · ${categoryCount} ${categoryCount === 1 ? 'categoría' : 'categorías'}`

  // Sin sesión la consulta queda deshabilitada: `isPending` con
  // `fetchStatus: 'idle'`. Si el esqueleto mirara solo `isPending` se quedaría
  // girando para siempre, así que se mira el `fetchStatus`.
  if (isPending && fetchStatus === 'idle') {
    return (
      <div className={styles.root}>
        {header('Las cosas que haces en un día. Nada más.')}
        <Card className={styles.panel} padding="lg">
          <EmptyState
            title="Entra para ver tus actividades"
            description="Tu catálogo viaja con tu cuenta. Inicia sesión y aparece."
            action={
              <Button to={authPaths.login} variant="secondary">
                Iniciar sesión
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className={styles.root}>
        {header('Las cosas que haces en un día. Nada más.')}
        <div className={styles.groups} aria-busy="true" aria-live="polite">
          {[0, 1].map((group) => (
            <div key={group} className={styles.skeletonGroup}>
              <Skeleton width="35%" height={12} />
              {[0, 1, 2].map((card) => (
                <div key={card} className={styles.skeletonCard}>
                  <Skeleton width={36} height={36} radius="0.75rem" />
                  <div className={styles.skeletonText}>
                    <Skeleton width="55%" height={14} />
                    <Skeleton width="35%" height={10} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className={styles.root}>
        {header('Las cosas que haces en un día. Nada más.')}
        <Alert variant="danger" title="No pudimos cargar tus actividades">
          <p className={styles.errorText}>
            Revisa tu conexión e inténtalo otra vez; lo que tienes guardado sigue ahí.
          </p>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </Alert>
      </div>
    )
  }

  if (activityCount === 0) {
    return (
      <div className={styles.root}>
        {header('Las cosas que haces en un día. Nada más.')}
        <VidaStartingPoints />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {header(countLine)}

      <div className={styles.search}>
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar…"
          aria-label="Buscar actividades"
          leftIcon={<AppIcon name="magnifying-glass" size="xs" decorative />}
        />
      </div>

      {hasMore ? (
        <p className={styles.note}>
          Mostrando las primeras {CATALOG_LIMIT}. Archiva lo que ya no hagas para verlo todo.
        </p>
      ) : null}

      {visibleGroups.length === 0 ? (
        <Card className={styles.panel} padding="lg">
          <EmptyState
            title={`Sin resultados para “${search.trim()}”`}
            description="Prueba con otras palabras del nombre."
            action={
              <Button variant="secondary" onClick={() => setSearch('')}>
                Limpiar búsqueda
              </Button>
            }
          />
        </Card>
      ) : (
        <div className={styles.groups} aria-busy={isVidaItemsPending}>
          {visibleGroups.map((group) => (
            <VidaCatalogGroup
              key={group.id}
              group={group}
              vidaItemsByActivity={vidaItemsByActivity}
              onEdit={openEditSheet}
            />
          ))}
        </div>
      )}

      <button type="button" className={styles.fab} onClick={openCreateSheet}>
        <AppIcon name="plus" size="sm" decorative />
        <span className={styles.srOnly}>Nueva actividad</span>
      </button>

      <VidaActivitySheet
        key={sheetSession}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        activity={editing}
      />
    </div>
  )
}
