import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { authPaths } from '@/features/auth/router/auth-paths'
import {
  VidaCategoryForm,
  type VidaCategoryFormValues,
} from '@/features/vida/components/VidaCategoryForm'
import { useActivitiesQuery } from '@/features/vida/hooks/useActivities'
import {
  useActivityCategoriesQuery,
  useUpdateActivityCategoryMutation,
} from '@/features/vida/hooks/useActivityCategories'
import { vidaPaths } from '@/features/vida/routes/vida-paths'
import type { ActivityCategory } from '@/features/vida/types/activity-category.types'
import {
  CATALOG_LIMIT,
  countActivitiesByCategory,
  excludeArchivedActivities,
  UNCATEGORIZED_GROUP_ICON,
} from '@/features/vida/utils/vida-catalog.utils'
import { compareVidaNames } from '@/features/vida/utils/vida-text.utils'
import { Alert } from '@/shared/ui/Alert'
import { AppIcon } from '@/shared/ui/AppIcon'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Modal } from '@/shared/ui/Modal'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Skeleton } from '@/shared/ui/Skeleton'
import styles from './VidaCategoriasPage.module.scss'

/**
 * Las categorías del catálogo: quién le da el icono y el color a cada tarjeta.
 *
 * Solo **listar y editar** (criterio 27). Crear sigue viviendo en «+ nueva»
 * dentro de la hoja de la actividad —que es donde hace falta— y **borrar no
 * existe en F1**: dejaría actividades huérfanas y está fuera de alcance.
 *
 * El recuento por categoría se calcula sobre las actividades **no archivadas**,
 * el mismo array del que sale el «N actividades · M categorías» del catálogo:
 * si dijera otra cosa, los dos números se contradirían en la misma sesión.
 */
export function VidaCategoriasPage() {
  const {
    data: categories = [],
    isPending,
    fetchStatus,
    isError,
    refetch,
  } = useActivityCategoriesQuery()
  const { data: activitiesData } = useActivitiesQuery({ page: 1, limit: CATALOG_LIMIT })
  const updateMutation = useUpdateActivityCategoryMutation()

  const [editing, setEditing] = useState<ActivityCategory | null>(null)
  const [values, setValues] = useState<VidaCategoryFormValues>({
    name: '',
    icon: null,
    color: null,
  })

  const counts = useMemo(
    () => countActivitiesByCategory(excludeArchivedActivities(activitiesData?.activities ?? [])),
    [activitiesData],
  )

  const sorted = useMemo(
    () =>
      [...categories].sort(
        (a, b) => a.orderIndex - b.orderIndex || compareVidaNames(a.name, b.name),
      ),
    [categories],
  )

  function openEdit(category: ActivityCategory) {
    setValues({ name: category.name, icon: category.icon, color: category.color })
    setEditing(category)
  }

  function closeForm() {
    if (updateMutation.isPending) return
    setEditing(null)
  }

  function handleSubmit(next: VidaCategoryFormValues) {
    if (!editing) return
    updateMutation.mutate(
      { id: editing.id, name: next.name, icon: next.icon, color: next.color },
      // Solo se cierra si de verdad se guardó: si falla, el formulario se queda
      // abierto con lo escrito y el hook de F0 avisa con su toast.
      { onSuccess: () => setEditing(null) },
    )
  }

  function shell(children: React.ReactNode) {
    return (
      <div className={styles.root}>
        <PageHeader
          title="Categorías"
          subtitle="Le dan el icono y el color a cada actividad."
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
          title="Entra para ver tus categorías"
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
      <Alert variant="danger" title="No pudimos cargar tus categorías">
        <p className={styles.errorText}>
          Revisa tu conexión e inténtalo otra vez; lo que tienes guardado sigue ahí.
        </p>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          Reintentar
        </Button>
      </Alert>,
    )
  }

  if (sorted.length === 0) {
    return shell(
      <Card className={styles.panel} padding="lg">
        <EmptyState
          title="Todavía no tienes categorías"
          description="Se crean al vuelo desde la hoja de una actividad, con «+ nueva»."
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
    <>
      <ul className={styles.list}>
        {sorted.map((category) => {
          const count = counts.get(category.id) ?? 0
          const colorStyle = category.color
            ? ({ '--vida-category-color': category.color } as CSSProperties)
            : undefined

          return (
            <li key={category.id} className={styles.row} style={colorStyle}>
              <span className={styles.capsule} aria-hidden>
                <AppIcon
                  name={category.icon ?? UNCATEGORIZED_GROUP_ICON}
                  size="sm"
                  decorative
                />
              </span>
              <div className={styles.body}>
                <p className={styles.name}>{category.name}</p>
                <p className={styles.meta}>
                  {count} {count === 1 ? 'actividad' : 'actividades'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openEdit(category)}
                aria-label={`Editar ${category.name}`}
              >
                Editar
              </Button>
            </li>
          )
        })}
      </ul>

      <Modal open={editing !== null} onClose={closeForm} title="Editar categoría" size="md">
        <VidaCategoryForm
          values={values}
          onChange={setValues}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitLabel="Guardar"
          loading={updateMutation.isPending}
        />
      </Modal>
    </>,
  )
}
