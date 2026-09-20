import { useMemo, useState } from 'react'
import { authPaths } from '@/features/auth/router/auth-paths'
import { VidaActivitySheet } from '@/features/vida/components/VidaActivitySheet'
import { VidaCatalogGroup } from '@/features/vida/components/VidaCatalogGroup'
import { VidaStartingPoints } from '@/features/vida/components/VidaStartingPoints'
import { useActivitiesQuery } from '@/features/vida/hooks/useActivities'
import { useActivityCategoriesQuery } from '@/features/vida/hooks/useActivityCategories'
import { useVidaItemsQuery } from '@/features/vida/hooks/useVidaItems'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { Activity } from '@/features/vida/types/activity.types'
import { filterActivitiesBySearch } from '@/features/vida/utils/activity-filters'
import {
  buildVidaItemsByActivity,
  CATALOG_LIMIT,
  countCatalogCategories,
  excludeArchivedActivities,
  findVidaItemForActivity,
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
  // Con los desactivados: la tarjeta solo pinta los activos, pero la hoja
  // necesita el apagado para reactivar **el mismo** `VidaItem` en vez de crear
  // otro (criterios 19 y 20).
  const {
    data: vidaItems = [],
    isPending: isVidaItemsPending,
    fetchStatus: vidaItemsFetchStatus,
  } = useVidaItemsQuery(true)

  const activities = useMemo(() => excludeArchivedActivities(data?.activities ?? []), [data])
  const vidaItemsByActivity = useMemo(() => buildVidaItemsByActivity(vidaItems), [vidaItems])
  // Mientras la plantilla está en vuelo, la tarjeta **no afirma** «sin
  // plantilla»: sería mentira durante ese hueco y luego cambiaría sola. Con la
  // sesión caída la consulta queda `idle` y entonces sí se afirma: no va a
  // llegar nada. Es el hallazgo que dejó el revisor de la tajada 1.
  const isTemplatePending = isVidaItemsPending && vidaItemsFetchStatus !== 'idle'

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

  // El recuento mira **lo que se ve**: con una búsqueda escrita, lo filtrado.
  // Es lo que pide el criterio 4 al pie de la letra («los números coinciden con
  // lo que se ve en pantalla») y lo que dejó anotado el revisor de la tajada 1,
  // que veía «11 actividades» con dos tarjetas delante.
  const activityCount = visibleGroups.reduce((total, group) => total + group.activities.length, 0)
  const categoryCount = countCatalogCategories(visibleGroups)
  /** El catálogo entero, sin filtrar: es lo que decide si hay primer minuto. */
  const totalCount = activities.length
  // El crudo, antes de recortar: es lo que dice si el lote no cabía entero.
  const hasMore = (data?.total ?? 0) > (data?.activities.length ?? 0)

  function header(subtitle: string) {
    return <PageHeader title="Actividades" subtitle={subtitle} />
  }

  /**
   * El acceso a las archivadas (criterio 24): discreto y al pie, no en la barra
   * de módulo. Se pinta también en el primer minuto porque quien archiva todo
   * su catálogo se queda si no sin manera de volver a lo suyo.
   */
  const archivedLink = (
    <p className={styles.archivedLink}>
      <Button variant="ghost" size="sm" to={vidaPaths.archivadas}>
        Ver archivadas
      </Button>
    </p>
  )

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

  if (totalCount === 0) {
    return (
      <div className={styles.root}>
        {header('Las cosas que haces en un día. Nada más.')}
        <VidaStartingPoints />
        {archivedLink}
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {header(countLine)}

      <div className={styles.searchRow}>
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
        <Button variant="ghost" size="sm" to={vidaPaths.categorias}>
          Categorías ›
        </Button>
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
        <div className={styles.groups} aria-busy={isTemplatePending}>
          {visibleGroups.map((group) => (
            <VidaCatalogGroup
              key={group.id}
              group={group}
              vidaItemsByActivity={vidaItemsByActivity}
              isTemplatePending={isTemplatePending}
              onEdit={openEditSheet}
            />
          ))}
        </div>
      )}

      {archivedLink}

      <button type="button" className={styles.fab} onClick={openCreateSheet}>
        <AppIcon name="plus" size="sm" decorative />
        <span className={styles.srOnly}>Nueva actividad</span>
      </button>

      <VidaActivitySheet
        key={sheetSession}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        activity={editing}
        vidaItem={editing ? findVidaItemForActivity(vidaItems, editing.id) : null}
        isTemplatePending={isTemplatePending}
      />
    </div>
  )
}
